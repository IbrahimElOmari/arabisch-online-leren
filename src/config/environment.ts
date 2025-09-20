// Environment configuration and feature flags
export const ENV_CONFIG = {
  // Current environment
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Feature flags (can be controlled per environment)
  FEATURES: {
    ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
    PWA: import.meta.env.VITE_ENABLE_PWA === 'true',
    RATE_LIMITING: import.meta.env.VITE_RATE_LIMIT_ENABLED !== 'false', // Default true
  },
  
  // Environment checks
  isDevelopment: () => ENV_CONFIG.APP_ENV === 'development',
  isStaging: () => ENV_CONFIG.APP_ENV === 'staging',
  isProduction: () => ENV_CONFIG.APP_ENV === 'production',
  
  // Supabase configuration
  SUPABASE: {
    PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    URL: import.meta.env.VITE_SUPABASE_URL,
    ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // Validation
  validateRequiredEnvVars: () => {
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_PROJECT_ID'
    ];
    
    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
      );
    }
  }
};

// Validate environment on module load
ENV_CONFIG.validateRequiredEnvVars();