# Variables for Edge Functions Module

variable "function_memory_mb" {
  description = "Memory allocation for functions (MB)"
  type        = number
  default     = 256
}

variable "function_timeout_seconds" {
  description = "Function timeout (seconds)"
  type        = number
  default     = 30
}

variable "enable_function_logs" {
  description = "Enable function logging"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Function log retention (days)"
  type        = number
  default     = 7
}
