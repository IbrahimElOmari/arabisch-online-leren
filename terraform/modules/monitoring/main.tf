# Monitoring & Alerting Infrastructure Module

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

variable "alert_email" {
  description = "Email for alerts"
  type        = string
}

variable "error_rate_threshold" {
  description = "Error rate threshold (0-1)"
  type        = number
  default     = 0.05
}

variable "response_time_threshold" {
  description = "Response time threshold (ms)"
  type        = number
  default     = 2000
}

variable "cpu_threshold" {
  description = "CPU usage threshold (%)"
  type        = number
  default     = 80
}

variable "memory_threshold" {
  description = "Memory usage threshold (%)"
  type        = number
  default     = 85
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}

# Metric Thresholds Configuration
# These would be stored in Supabase and checked by edge functions
locals {
  metric_thresholds = {
    error_rate = {
      warning  = var.error_rate_threshold * 0.5
      critical = var.error_rate_threshold
      unit     = "percentage"
    }
    response_time = {
      warning  = var.response_time_threshold * 0.7
      critical = var.response_time_threshold
      unit     = "milliseconds"
    }
    cpu_usage = {
      warning  = var.cpu_threshold * 0.8
      critical = var.cpu_threshold
      unit     = "percentage"
    }
    memory_usage = {
      warning  = var.memory_threshold * 0.8
      critical = var.memory_threshold
      unit     = "percentage"
    }
    database_connections = {
      warning  = 80
      critical = 95
      unit     = "percentage"
    }
    edge_function_errors = {
      warning  = 5
      critical = 20
      unit     = "count_per_minute"
    }
  }

  alert_channels = {
    email = var.alert_email
    # Could add Slack, PagerDuty, etc.
  }

  # Health check endpoints
  health_checks = [
    {
      name     = "api_health"
      endpoint = "/rest/v1/"
      interval = 60
      timeout  = 10
    },
    {
      name     = "auth_health"
      endpoint = "/auth/v1/health"
      interval = 60
      timeout  = 10
    },
    {
      name     = "storage_health"
      endpoint = "/storage/v1/health"
      interval = 120
      timeout  = 15
    },
  ]
}

# Alert Configuration Document
# This generates a JSON configuration for the monitoring system
resource "local_file" "monitoring_config" {
  content = jsonencode({
    project_id  = var.project_id
    environment = var.environment
    
    thresholds = local.metric_thresholds
    
    alerts = {
      enabled  = true
      channels = local.alert_channels
      
      rules = [
        {
          name        = "High Error Rate"
          metric      = "error_rate"
          condition   = "greater_than"
          threshold   = var.error_rate_threshold
          duration    = "5m"
          severity    = "critical"
          description = "Error rate exceeded ${var.error_rate_threshold * 100}%"
        },
        {
          name        = "Slow Response Time"
          metric      = "response_time_p95"
          condition   = "greater_than"
          threshold   = var.response_time_threshold
          duration    = "5m"
          severity    = "warning"
          description = "P95 response time exceeded ${var.response_time_threshold}ms"
        },
        {
          name        = "High CPU Usage"
          metric      = "cpu_usage"
          condition   = "greater_than"
          threshold   = var.cpu_threshold
          duration    = "10m"
          severity    = "warning"
          description = "CPU usage exceeded ${var.cpu_threshold}%"
        },
        {
          name        = "High Memory Usage"
          metric      = "memory_usage"
          condition   = "greater_than"
          threshold   = var.memory_threshold
          duration    = "10m"
          severity    = "critical"
          description = "Memory usage exceeded ${var.memory_threshold}%"
        },
        {
          name        = "Database Connection Pool Exhaustion"
          metric      = "database_connections"
          condition   = "greater_than"
          threshold   = 90
          duration    = "2m"
          severity    = "critical"
          description = "Database connection pool near exhaustion"
        },
        {
          name        = "Authentication Failures Spike"
          metric      = "auth_failures"
          condition   = "greater_than"
          threshold   = 50
          duration    = "5m"
          severity    = "warning"
          description = "Unusual spike in authentication failures"
        },
      ]
    }
    
    health_checks = local.health_checks
    
    dashboards = {
      overview = {
        widgets = [
          "request_rate",
          "error_rate",
          "response_time_p50",
          "response_time_p95",
          "active_users",
          "database_queries",
        ]
      }
      performance = {
        widgets = [
          "cpu_usage",
          "memory_usage",
          "database_connections",
          "edge_function_duration",
          "storage_bandwidth",
        ]
      }
      security = {
        widgets = [
          "auth_attempts",
          "auth_failures",
          "rate_limit_hits",
          "blocked_requests",
        ]
      }
    }
    
    retention = {
      metrics = "30d"
      logs    = "7d"
      alerts  = "90d"
    }
  })

  filename = "${path.module}/generated/monitoring-config.json"
}

# Outputs
output "monitoring_config_path" {
  description = "Path to monitoring configuration file"
  value       = local_file.monitoring_config.filename
}

output "metric_thresholds" {
  description = "Configured metric thresholds"
  value       = local.metric_thresholds
}

output "health_check_endpoints" {
  description = "Health check endpoints"
  value       = local.health_checks
}

output "alert_email" {
  description = "Alert notification email"
  value       = var.alert_email
  sensitive   = true
}
