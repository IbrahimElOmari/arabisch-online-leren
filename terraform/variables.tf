# Variables for Terraform configuration

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "supabase_project_id" {
  description = "Supabase project ID"
  type        = string
  default     = "xugosdedyukizseveahx"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the domain"
  type        = string
}

variable "domain" {
  description = "Primary domain name"
  type        = string
  default     = "arabischetaalles.nl"
}

variable "stripe_secret_key" {
  description = "Stripe secret key for payments"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "Email address for monitoring alerts"
  type        = string
}

# Environment-specific variables
variable "database_max_connections" {
  description = "Maximum database connections"
  type        = number
  default     = 100
}

variable "edge_function_memory_mb" {
  description = "Memory allocation for edge functions (MB)"
  type        = number
  default     = 256
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}
