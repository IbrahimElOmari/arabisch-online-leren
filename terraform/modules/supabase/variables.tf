# Variables for Supabase Module

variable "project_id" {
  description = "Supabase project ID"
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

variable "storage_buckets" {
  description = "Storage bucket configurations"
  type = list(object({
    name               = string
    public             = bool
    file_size_limit    = number
    allowed_mime_types = list(string)
  }))
  default = []
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}

variable "database_max_connections" {
  description = "Maximum database connections"
  type        = number
  default     = 100
}

variable "enable_realtime" {
  description = "Enable realtime functionality"
  type        = bool
  default     = true
}

variable "enable_storage" {
  description = "Enable storage functionality"
  type        = bool
  default     = true
}
