# Supabase Infrastructure Module

terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# Storage Buckets
resource "supabase_storage_bucket" "buckets" {
  for_each = { for bucket in var.storage_buckets : bucket.name => bucket }
  
  name                = each.value.name
  public              = each.value.public
  file_size_limit     = each.value.file_size_limit
  allowed_mime_types  = each.value.allowed_mime_types
  
  lifecycle {
    prevent_destroy = true
  }
}

# RLS Policies for Storage Buckets
resource "supabase_storage_bucket_policy" "media_public_read" {
  bucket_id = supabase_storage_bucket.buckets["media"].id
  name      = "Public read access"
  
  definition = jsonencode({
    for     = "SELECT"
    using   = true
  })
}

resource "supabase_storage_bucket_policy" "task_uploads_user_access" {
  bucket_id = supabase_storage_bucket.buckets["task_uploads"].id
  name      = "Users can upload their own files"
  
  definition = jsonencode({
    for       = "INSERT"
    with_check = "(bucket_id = 'task_uploads' AND auth.uid()::text = (storage.foldername(name))[1])"
  })
}

resource "supabase_storage_bucket_policy" "task_uploads_user_read" {
  bucket_id = supabase_storage_bucket.buckets["task_uploads"].id
  name      = "Users can view their own files"
  
  definition = jsonencode({
    for     = "SELECT"
    using   = "(bucket_id = 'task_uploads' AND auth.uid()::text = (storage.foldername(name))[1])"
  })
}

# Database Extensions
resource "supabase_database_extension" "pgcrypto" {
  name    = "pgcrypto"
  schema  = "extensions"
}

resource "supabase_database_extension" "pg_stat_statements" {
  name    = "pg_stat_statements"
  schema  = "extensions"
}

resource "supabase_database_extension" "pg_trgm" {
  name    = "pg_trgm"
  schema  = "extensions"
}

# Project Settings
resource "supabase_project_settings" "main" {
  project_id = var.project_id
  
  # Auth settings
  auth_settings = {
    enable_signup           = true
    enable_email_signup     = true
    enable_phone_signup     = false
    minimum_password_length = 8
    password_required_characters = ["lowercase", "uppercase", "numbers"]
  }
  
  # Database settings
  database_settings = {
    max_connections = var.database_max_connections
    statement_timeout = 30000  # 30 seconds
    idle_in_transaction_session_timeout = 60000  # 60 seconds
  }
  
  # API settings
  api_settings = {
    max_rows = 1000
    db_schema = "public"
  }
}

# Outputs
output "project_url" {
  description = "Supabase project URL"
  value       = "https://${var.project_id}.supabase.co"
}

output "storage_buckets" {
  description = "Created storage buckets"
  value       = { for k, v in supabase_storage_bucket.buckets : k => v.id }
}
