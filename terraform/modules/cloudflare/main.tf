# Cloudflare Infrastructure Module

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# DNS Records
resource "cloudflare_record" "root" {
  zone_id = var.zone_id
  name    = var.domain
  type    = "CNAME"
  value   = "${var.project_name}.pages.dev"
  proxied = true
  ttl     = 1  # Auto TTL when proxied
  
  comment = "Main application domain (${var.environment})"
}

resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  type    = "CNAME"
  value   = var.domain
  proxied = true
  ttl     = 1
  
  comment = "WWW redirect to main domain"
}

resource "cloudflare_record" "api" {
  zone_id = var.zone_id
  name    = "api"
  type    = "CNAME"
  value   = "${var.supabase_project_id}.supabase.co"
  proxied = true
  ttl     = 1
  
  comment = "Supabase API endpoint"
}

# Page Rules for Caching
resource "cloudflare_page_rule" "cache_static_assets" {
  zone_id  = var.zone_id
  target   = "${var.domain}/assets/*"
  priority = 1
  
  actions {
    cache_level         = "cache_everything"
    edge_cache_ttl      = var.cache_ttl
    browser_cache_ttl   = var.browser_cache_ttl
  }
}

resource "cloudflare_page_rule" "cache_images" {
  zone_id  = var.zone_id
  target   = "${var.domain}/*.{jpg,jpeg,png,gif,webp,svg,ico}"
  priority = 2
  
  actions {
    cache_level         = "cache_everything"
    edge_cache_ttl      = 86400  # 24 hours
    browser_cache_ttl   = 14400  # 4 hours
  }
}

# SSL/TLS Configuration
resource "cloudflare_zone_settings_override" "ssl" {
  zone_id = var.zone_id
  
  settings {
    ssl                      = var.ssl_mode
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
    opportunistic_encryption = "on"
  }
}

# Security Settings
resource "cloudflare_zone_settings_override" "security" {
  zone_id = var.zone_id
  
  settings {
    security_level            = var.security_level
    challenge_ttl             = 1800
    browser_check             = "on"
    hotlink_protection        = "on"
    ip_geolocation           = "on"
    email_obfuscation        = "on"
    server_side_exclude      = "on"
  }
}

# Performance Settings
resource "cloudflare_zone_settings_override" "performance" {
  zone_id = var.zone_id
  
  settings {
    brotli                   = "on"
    early_hints              = "on"
    http2                    = "on"
    http3                    = "on"
    zero_rtt                 = "on"
    minify {
      css  = "on"
      js   = "on"
      html = "on"
    }
    rocket_loader            = "off"  # May conflict with React
    automatic_platform_optimization {
      enabled = true
      cache_by_device_type = true
    }
  }
}

# WAF Rules
resource "cloudflare_firewall_rule" "rate_limit_api" {
  count   = var.enable_waf ? 1 : 0
  zone_id = var.zone_id
  
  description = "Rate limit API endpoints"
  action      = "challenge"
  priority    = 1
  
  filter {
    expression = "(http.request.uri.path contains \"/api/\" and rate(5m) > 100)"
  }
}

resource "cloudflare_firewall_rule" "block_bots" {
  count   = var.enable_waf ? 1 : 0
  zone_id = var.zone_id
  
  description = "Block known bad bots"
  action      = "block"
  priority    = 2
  
  filter {
    expression = "(cf.client.bot and not cf.verified_bot_category in {\"Search Engine Crawler\" \"Monitoring & Analytics\"})"
  }
}

# DDoS Protection
resource "cloudflare_rate_limit" "login_protection" {
  count   = var.enable_ddos_protection ? 1 : 0
  zone_id = var.zone_id
  
  threshold = 5
  period    = 60
  
  match {
    request {
      url_pattern = "${var.domain}/auth/*"
      schemes     = ["HTTPS"]
      methods     = ["POST"]
    }
  }
  
  action {
    mode    = "challenge"
    timeout = 3600  # 1 hour
  }
  
  description = "Protect login endpoints from brute force"
}

# Health Checks
resource "cloudflare_healthcheck" "app_health" {
  zone_id = var.zone_id
  
  name        = "${var.project_name}-health"
  description = "Application health check"
  address     = var.domain
  type        = "HTTPS"
  port        = 443
  path        = "/health"
  
  check_regions = [
    "WEU",  # Western Europe
    "ENAM", # Eastern North America
  ]
  
  interval           = 60
  retries            = 2
  timeout            = 5
  expected_codes     = "200"
  follow_redirects   = true
  allow_insecure     = false
}

# Outputs
output "nameservers" {
  description = "Cloudflare nameservers"
  value       = data.cloudflare_zone.main.name_servers
}

output "cdn_url" {
  description = "CDN URL"
  value       = "https://${var.domain}"
}

# Data source for zone info
data "cloudflare_zone" "main" {
  zone_id = var.zone_id
}
