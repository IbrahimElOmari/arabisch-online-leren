# Main Terraform Configuration for Arabische Taalles Platform
# This file orchestrates the deployment of all infrastructure components

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

  # Backend configuration for state management
  backend "s3" {
    bucket = "arabische-taalles-terraform-state"
    key    = "production/terraform.tfstate"
    region = "eu-west-1"
    
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

# Provider configurations
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Locals for common tags and naming
locals {
  project_name = "arabische-taalles"
  environment  = var.environment
  
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
    Owner       = "Platform Team"
  }
}

# Supabase Module
module "supabase" {
  source = "./modules/supabase"
  
  project_id   = var.supabase_project_id
  environment  = var.environment
  project_name = local.project_name
  
  # Storage buckets configuration
  storage_buckets = [
    {
      name      = "media"
      public    = true
      file_size_limit = 52428800 # 50MB
      allowed_mime_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    },
    {
      name      = "task_uploads"
      public    = false
      file_size_limit = 104857600 # 100MB
      allowed_mime_types = ["application/pdf", "image/jpeg", "image/png", "video/mp4"]
    },
    {
      name      = "chat_attachments"
      public    = false
      file_size_limit = 20971520 # 20MB
      allowed_mime_types = ["image/jpeg", "image/png", "application/pdf"]
    }
  ]
  
  tags = local.common_tags
}

# Cloudflare Module
module "cloudflare" {
  source = "./modules/cloudflare"
  
  zone_id      = var.cloudflare_zone_id
  domain       = var.domain
  environment  = var.environment
  project_name = local.project_name
  
  # CDN configuration
  enable_cdn           = true
  cache_ttl            = 3600
  browser_cache_ttl    = 14400
  
  # Security configuration
  enable_ddos_protection = true
  enable_waf             = true
  security_level         = "medium"
  
  # SSL configuration
  ssl_mode = "full_strict"
  
  tags = local.common_tags
}

# Edge Functions Deployment
module "edge_functions" {
  source = "./modules/edge-functions"
  
  project_id  = var.supabase_project_id
  environment = var.environment
  
  functions = [
    {
      name = "create-checkout-session"
      path = "../supabase/functions/create-checkout-session"
    },
    {
      name = "create-portal-session"
      path = "../supabase/functions/create-portal-session"
    },
    {
      name = "ensure-stripe-customer"
      path = "../supabase/functions/ensure-stripe-customer"
    }
  ]
  
  # Environment variables for edge functions
  secrets = {
    STRIPE_SECRET_KEY = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET = var.stripe_webhook_secret
  }
  
  tags = local.common_tags
}

# Monitoring & Alerts
module "monitoring" {
  source = "./modules/monitoring"
  
  project_id  = var.supabase_project_id
  environment = var.environment
  
  # Alert configuration
  alert_email = var.alert_email
  
  # Metric thresholds
  error_rate_threshold    = 0.05  # 5%
  response_time_threshold = 2000  # 2 seconds
  cpu_threshold           = 80    # 80%
  memory_threshold        = 85    # 85%
  
  tags = local.common_tags
}

# Outputs
output "supabase_url" {
  description = "Supabase project URL"
  value       = module.supabase.project_url
}

output "cloudflare_nameservers" {
  description = "Cloudflare nameservers"
  value       = module.cloudflare.nameservers
}

output "cdn_url" {
  description = "CDN URL for static assets"
  value       = module.cloudflare.cdn_url
}

output "edge_functions" {
  description = "Deployed edge functions"
  value       = module.edge_functions.function_urls
  sensitive   = true
}
