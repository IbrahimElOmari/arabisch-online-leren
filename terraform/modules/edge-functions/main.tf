# Edge Functions Infrastructure Module

terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# Variable definitions
variable "project_id" {
  description = "Supabase project ID"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "functions" {
  description = "List of edge functions to deploy"
  type = list(object({
    name = string
    path = string
  }))
  default = []
}

variable "secrets" {
  description = "Secrets to inject into edge functions"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}

# Edge Function Deployments
# Note: Supabase edge functions are deployed via supabase CLI
# This module manages configuration and secrets

resource "supabase_function_secret" "secrets" {
  for_each = var.secrets

  project_id = var.project_id
  name       = each.key
  value      = each.value
}

# Function Configuration
locals {
  function_configs = {
    for func in var.functions : func.name => {
      name        = func.name
      path        = func.path
      verify_jwt  = !contains(["stripe-webhook", "health-check"], func.name)
      import_map  = "${func.path}/import_map.json"
    }
  }

  # Functions that should be public (no JWT verification)
  public_functions = [
    "stripe-webhook",
    "health-check",
    "verify-certificate",
  ]

  # Functions with specific CORS requirements
  cors_enabled_functions = [
    "create-checkout-session",
    "create-portal-session",
    "manage-enrollment",
    "manage-forum",
  ]
}

# Function metadata tracking
resource "null_resource" "function_metadata" {
  for_each = local.function_configs

  triggers = {
    function_name = each.value.name
    environment   = var.environment
    last_updated  = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "Function: ${each.value.name}"
      echo "Environment: ${var.environment}"
      echo "Path: ${each.value.path}"
    EOT
  }
}

# Output function URLs
output "function_urls" {
  description = "Deployed function URLs"
  value = {
    for name, config in local.function_configs : name => 
      "https://${var.project_id}.supabase.co/functions/v1/${name}"
  }
}

output "function_names" {
  description = "List of function names"
  value       = [for func in var.functions : func.name]
}

output "public_functions" {
  description = "Functions without JWT verification"
  value       = local.public_functions
}
