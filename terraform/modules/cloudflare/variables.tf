# Variables for Cloudflare Module

variable "zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "domain" {
  description = "Primary domain name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "supabase_project_id" {
  description = "Supabase project ID for API subdomain"
  type        = string
  default     = "xugosdedyukizseveahx"
}

variable "enable_cdn" {
  description = "Enable CDN caching"
  type        = bool
  default     = true
}

variable "cache_ttl" {
  description = "Edge cache TTL (seconds)"
  type        = number
  default     = 3600
}

variable "browser_cache_ttl" {
  description = "Browser cache TTL (seconds)"
  type        = number
  default     = 14400
}

variable "enable_ddos_protection" {
  description = "Enable DDoS protection"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = true
}

variable "security_level" {
  description = "Security level (off, essentially_off, low, medium, high, under_attack)"
  type        = string
  default     = "medium"
}

variable "ssl_mode" {
  description = "SSL mode (off, flexible, full, full_strict)"
  type        = string
  default     = "full_strict"
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}
