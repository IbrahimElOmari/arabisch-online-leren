# Taak 17: Infrastructure as Code (Terraform)

**Status:** 🟡 In Progress (5%)  
**Prioriteit:** Medium  
**Geschatte Tijd:** 10-15 uur

## Doel

Implementeer Infrastructure as Code (IaC) met Terraform voor reproduceerbare, versiebeheerde infrastructure deployments van het Arabic Learning Platform.

## Scope

### 1. Terraform Project Structuur

```
terraform/
├── main.tf                    # Main configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── versions.tf                # Provider versions
├── terraform.tfvars.example   # Example variables file
├── .gitignore                 # Ignore sensitive files
│
├── modules/
│   ├── supabase/
│   │   ├── main.tf           # Supabase project, database, auth
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── storage.tf        # Storage buckets configuration
│   │
│   ├── cloudflare/
│   │   ├── main.tf           # CDN, DNS, SSL
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── monitoring/
│   │   ├── main.tf           # Sentry, analytics
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── edge-functions/
│       ├── main.tf           # Deploy edge functions
│       ├── variables.tf
│       └── outputs.tf
│
└── environments/
    ├── staging/
    │   ├── main.tf
    │   ├── terraform.tfvars
    │   └── backend.tf         # Remote state (S3/Terraform Cloud)
    │
    └── production/
        ├── main.tf
        ├── terraform.tfvars
        └── backend.tf
```

---

### 2. Supabase Module

**File: `modules/supabase/main.tf`**
```hcl
terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

variable "project_name" {
  type        = string
  description = "Name of the Supabase project"
}

variable "organization_id" {
  type        = string
  description = "Supabase organization ID"
}

variable "database_password" {
  type        = string
  sensitive   = true
  description = "Master database password"
}

variable "region" {
  type        = string
  default     = "eu-central-1"
  description = "AWS region for Supabase project"
}

# Create Supabase project
resource "supabase_project" "main" {
  name              = var.project_name
  organization_id   = var.organization_id
  database_password = var.database_password
  region            = var.region

  settings = {
    db_version      = "15"
    db_size         = "small"  # small, medium, large, xlarge
    auth_enabled    = true
    storage_enabled = true
  }
}

# Create storage buckets
resource "supabase_bucket" "avatars" {
  name       = "avatars"
  public     = true
  project_id = supabase_project.main.id

  allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]
  file_size_limit    = 5242880  # 5MB

  lifecyle {
    max_age = 365  # Delete after 1 year
  }
}

resource "supabase_bucket" "documents" {
  name       = "documents"
  public     = false
  project_id = supabase_project.main.id

  allowed_mime_types = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]
  file_size_limit = 52428800  # 50MB
}

resource "supabase_bucket" "media" {
  name       = "media"
  public     = true
  project_id = supabase_project.main.id

  allowed_mime_types = [
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/wav"
  ]
  file_size_limit = 104857600  # 100MB
}

# Auth configuration
resource "supabase_auth_settings" "main" {
  project_id = supabase_project.main.id

  email_enabled          = true
  email_double_confirm   = true
  email_verification_url = "https://${var.domain}/auth/verify"

  password_min_length = 8
  password_require_uppercase = true
  password_require_lowercase = true
  password_require_numbers   = true
  password_require_symbols   = false

  jwt_expiry = 3600  # 1 hour
  refresh_token_rotation_enabled = true

  external_providers = {
    google = {
      enabled     = true
      client_id   = var.google_oauth_client_id
      secret      = var.google_oauth_secret
    }
  }
}

output "project_url" {
  value = supabase_project.main.url
}

output "anon_key" {
  value     = supabase_project.main.anon_key
  sensitive = true
}

output "service_role_key" {
  value     = supabase_project.main.service_role_key
  sensitive = true
}
```

**File: `modules/supabase/storage.tf`**
```hcl
# Storage policies for avatars bucket
resource "supabase_storage_policy" "avatars_read" {
  bucket_id = supabase_bucket.avatars.id
  name      = "Public avatar read access"
  operation = "SELECT"
  policy    = "true"  # Public read
}

resource "supabase_storage_policy" "avatars_insert" {
  bucket_id = supabase_bucket.avatars.id
  name      = "Users can upload own avatar"
  operation = "INSERT"
  policy    = "(bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])"
}

resource "supabase_storage_policy" "avatars_update" {
  bucket_id = supabase_bucket.avatars.id
  name      = "Users can update own avatar"
  operation = "UPDATE"
  policy    = "(bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])"
}

# Storage policies for documents bucket (private)
resource "supabase_storage_policy" "documents_read" {
  bucket_id = supabase_bucket.documents.id
  name      = "Users view own documents"
  operation = "SELECT"
  policy    = "(bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])"
}

resource "supabase_storage_policy" "documents_insert" {
  bucket_id = supabase_bucket.documents.id
  name      = "Users upload own documents"
  operation = "INSERT"
  policy    = "(bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])"
}
```

---

### 3. Cloudflare Module

**File: `modules/cloudflare/main.tf`**
```hcl
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "zone_id" {
  type        = string
  description = "Cloudflare Zone ID"
}

variable "domain" {
  type        = string
  description = "Main domain (e.g., arabisch-leren.nl)"
}

variable "origin_url" {
  type        = string
  description = "Origin URL (Lovable deployment)"
}

# DNS record for main domain
resource "cloudflare_record" "main" {
  zone_id = var.zone_id
  name    = "@"
  value   = var.origin_url
  type    = "CNAME"
  proxied = true
  ttl     = 1  # Auto
}

# DNS record for www subdomain
resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  value   = var.domain
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

# DNS record for API subdomain
resource "cloudflare_record" "api" {
  zone_id = var.zone_id
  name    = "api"
  value   = var.supabase_url
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

# SSL/TLS settings
resource "cloudflare_zone_settings_override" "main" {
  zone_id = var.zone_id

  settings {
    ssl                      = "strict"
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    min_tls_version          = "1.3"
    tls_1_3                  = "on"
    http3                    = "on"
    zero_rtt                 = "on"
    opportunistic_encryption = "on"
    ipv6                     = "on"
    websockets               = "on"
    brotli                   = "on"
    early_hints              = "on"
  }
}

# Page rules for caching
resource "cloudflare_page_rule" "cache_static" {
  zone_id  = var.zone_id
  target   = "${var.domain}/assets/*"
  priority = 1

  actions {
    cache_level         = "cache_everything"
    edge_cache_ttl      = 31536000  # 1 year
    browser_cache_ttl   = 31536000
  }
}

resource "cloudflare_page_rule" "cache_images" {
  zone_id  = var.zone_id
  target   = "${var.domain}/*.{jpg,jpeg,png,webp,gif,svg}"
  priority = 2

  actions {
    cache_level       = "cache_everything"
    edge_cache_ttl    = 2592000  # 30 days
    browser_cache_ttl = 2592000
  }
}

# Firewall rules
resource "cloudflare_firewall_rule" "block_bad_bots" {
  zone_id     = var.zone_id
  description = "Block known bad bots"
  filter_id   = cloudflare_filter.bad_bots.id
  action      = "block"
}

resource "cloudflare_filter" "bad_bots" {
  zone_id     = var.zone_id
  description = "Expression to block bad bots"
  expression  = "(cf.client.bot) and not (cf.verified_bot_category in {\"Search Engine Crawler\" \"AI Crawler\"})"
}

# Rate limiting
resource "cloudflare_rate_limit" "api_limit" {
  zone_id   = var.zone_id
  threshold = 100
  period    = 60  # per minute

  match {
    request {
      url_pattern = "${var.domain}/api/*"
    }
  }

  action {
    mode    = "challenge"
    timeout = 3600  # 1 hour
  }
}

output "nameservers" {
  value = cloudflare_zone.main.name_servers
}
```

---

### 4. Edge Functions Module

**File: `modules/edge-functions/main.tf`**
```hcl
# This is conceptual - actual edge function deployment via Supabase CLI
# Terraform can manage environment variables and secrets

variable "project_ref" {
  type = string
}

variable "edge_function_secrets" {
  type = map(string)
  sensitive = true
  description = "Secrets for edge functions"
}

# Set secrets for edge functions
resource "null_resource" "deploy_secrets" {
  for_each = var.edge_function_secrets

  provisioner "local-exec" {
    command = "npx supabase secrets set ${each.key}=${each.value} --project-ref ${var.project_ref}"
  }

  triggers = {
    secrets_hash = sha256(jsonencode(var.edge_function_secrets))
  }
}

# Deploy edge functions (via CLI)
resource "null_resource" "deploy_functions" {
  depends_on = [null_resource.deploy_secrets]

  provisioner "local-exec" {
    command = "npx supabase functions deploy --project-ref ${var.project_ref}"
  }

  triggers = {
    functions_hash = filesha256("${path.root}/../../supabase/functions")
  }
}
```

---

### 5. Production Environment

**File: `environments/production/main.tf`**
```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket = "arabisch-leren-terraform-state"
    key    = "production/terraform.tfstate"
    region = "eu-central-1"
    encrypt = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Supabase module
module "supabase" {
  source = "../../modules/supabase"

  project_name      = "Arabisch Leren - Production"
  organization_id   = var.supabase_org_id
  database_password = var.db_password
  region            = "eu-central-1"
  domain            = var.domain

  google_oauth_client_id = var.google_oauth_client_id
  google_oauth_secret    = var.google_oauth_secret
}

# Cloudflare module
module "cloudflare" {
  source = "../../modules/cloudflare"

  zone_id      = var.cloudflare_zone_id
  domain       = var.domain
  origin_url   = var.lovable_deployment_url
  supabase_url = module.supabase.project_url
}

# Edge functions
module "edge_functions" {
  source = "../../modules/edge-functions"

  project_ref = module.supabase.project_id

  edge_function_secrets = {
    STRIPE_SECRET_KEY    = var.stripe_secret_key
    VIRUSTOTAL_API_KEY   = var.virustotal_api_key
    SENDGRID_API_KEY     = var.sendgrid_api_key
    SENTRY_DSN           = var.sentry_dsn
  }
}

output "supabase_url" {
  value = module.supabase.project_url
}

output "cloudflare_nameservers" {
  value = module.cloudflare.nameservers
}
```

**File: `environments/production/terraform.tfvars.example`**
```hcl
# Copy to terraform.tfvars and fill in values

supabase_org_id = "your-org-id"
db_password     = "strong-database-password"

cloudflare_zone_id = "your-zone-id"
domain             = "arabisch-leren.nl"
lovable_deployment_url = "your-lovable-url.lovableproject.com"

google_oauth_client_id = "your-google-client-id"
google_oauth_secret    = "your-google-secret"

stripe_secret_key  = "sk_live_..."
virustotal_api_key = "your-virustotal-key"
sendgrid_api_key   = "SG...."
sentry_dsn         = "https://...@sentry.io/..."
```

---

## Implementatie Stappen

### Fase 1: Setup (2 uur)
- [ ] Install Terraform CLI
- [ ] Create Terraform Cloud account (or S3 backend)
- [ ] Initialize Terraform project structure
- [ ] Configure remote state backend

### Fase 2: Modules (5 uur)
- [ ] Implement Supabase module
- [ ] Implement Cloudflare module
- [ ] Implement Edge Functions module
- [ ] Implement Monitoring module

### Fase 3: Environments (3 uur)
- [ ] Configure staging environment
- [ ] Configure production environment
- [ ] Test deployments

### Fase 4: CI/CD Integration (3 uur)
- [ ] GitHub Actions for Terraform apply
- [ ] Automated testing (terraform validate, plan)
- [ ] Approval workflow for production changes

---

## Commands

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure (careful!)
terraform destroy

# Format code
terraform fmt -recursive

# Show current state
terraform show

# Import existing resource
terraform import module.supabase.supabase_project.main project-id
```

---

## Volgende Stappen (Na Sessie 5)

1. Add cost estimation with Infracost
2. Implement disaster recovery automation
3. Add monitoring/alerting infrastructure (Prometheus/Grafana)
4. Create Terraform modules for other services (Sentry, analytics)
5. Implement multi-region deployment

---

## Referenties

- [Terraform Documentation](https://www.terraform.io/docs)
- [Supabase Terraform Provider](https://registry.terraform.io/providers/supabase/supabase/latest/docs)
- [Cloudflare Terraform Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
