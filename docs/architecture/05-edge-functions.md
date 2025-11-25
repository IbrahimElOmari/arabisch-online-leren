# Edge Functions Architecture

**Document:** 05 - Edge Functions  
**Laatst Bijgewerkt:** 2025-01-25  
**Status:** ✅ Volledig

## Overzicht

Edge Functions in het Arabic Learning Platform worden gebruikt voor serverless backend logic die dicht bij de gebruiker draait. Ze worden gehost op Supabase en geschreven in TypeScript/Deno.

## Edge Functions Overview

```mermaid
graph TB
    subgraph "Client"
        Browser[Browser/App]
    end
    
    subgraph "Supabase Edge Network"
        EF1[create-checkout-session]
        EF2[stripe-webhook]
        EF3[process-payment]
        EF4[virus-scan]
        EF5[moderate-content]
        EF6[generate-certificate]
        EF7[send-notification]
        EF8[backup-database]
    end
    
    subgraph "External APIs"
        Stripe[Stripe API]
        VirusTotal[VirusTotal API]
        EmailAPI[Email Service]
        StorageAPI[Supabase Storage]
    end
    
    subgraph "Database"
        DB[(Supabase DB)]
    end
    
    Browser --> EF1
    Browser --> EF4
    Browser --> EF5
    
    EF1 --> Stripe
    EF2 --> Stripe
    EF3 --> DB
    EF4 --> VirusTotal
    EF4 --> StorageAPI
    EF5 --> DB
    EF6 --> StorageAPI
    EF6 --> DB
    EF7 --> EmailAPI
    EF8 --> DB
    
    Stripe -.Webhook.-> EF2
    EF2 --> EF3
