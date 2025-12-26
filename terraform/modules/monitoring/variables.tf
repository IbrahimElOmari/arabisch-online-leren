# Variables for Monitoring Module

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  default     = ""
  sensitive   = true
}

variable "pagerduty_integration_key" {
  description = "PagerDuty integration key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "log_retention_days" {
  description = "Days to retain logs"
  type        = number
  default     = 7
}

variable "metrics_retention_days" {
  description = "Days to retain metrics"
  type        = number
  default     = 30
}

variable "enable_sentry" {
  description = "Enable Sentry integration"
  type        = bool
  default     = true
}

variable "sentry_dsn" {
  description = "Sentry DSN for error tracking"
  type        = string
  default     = ""
  sensitive   = true
}
