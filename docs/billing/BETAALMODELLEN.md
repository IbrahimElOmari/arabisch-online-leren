# 💰 Betaalmodellen & Facturatie

## 1. Abonnementsvormen

### 1.1 Gratis Tier (Freemium)
- **Toegang**: Niveau 1 content
- **Limiet**: 50 vragen per week
- **Features**: Basis oefeningen, geen certificaten
- **Doel**: Conversie naar betaald

### 1.2 Basis Abonnement (€9,99/maand)
- **Toegang**: Niveaus 1-3
- **Features**: 
  - Onbeperkte oefeningen
  - Voortgangsrapportage
  - Community forum
- **Facturatie**: Maandelijks of jaarlijks (€99,99/jaar)

### 1.3 Premium Abonnement (€19,99/maand)
- **Toegang**: Alle 6 niveaus
- **Features**:
  - Alles van Basis
  - Live lessen toegang
  - Certificaten
  - Prioriteit support
- **Facturatie**: Maandelijks of jaarlijks (€199,99/jaar)

### 1.4 School Licentie (Op maat)
- **Toegang**: Alle content
- **Features**:
  - Bulk student accounts
  - Docent dashboard
  - Aangepaste branding (optioneel)
  - API toegang
- **Facturatie**: Per student/jaar of vast bedrag

## 2. Facturatie Flow

### 2.1 Checkout Process
1. Gebruiker selecteert plan
2. Redirect naar Stripe Checkout
3. Betaling verwerking
4. Webhook ontvangt `checkout.session.completed`
5. Enrollment record aangemaakt
6. Welkomstmail verstuurd

### 2.2 Abonnement Management
- Upgrade: Direct, pro-rata berekening
- Downgrade: Einde huidige periode
- Annuleren: Toegang tot einde periode

## 3. Database Schema

### payments tabel
| Kolom | Type | Beschrijving |
|-------|------|--------------|
| id | UUID | Primary key |
| student_id | UUID | FK naar profiles |
| enrollment_id | UUID | FK naar enrollments |
| payment_method | TEXT | 'ideal', 'card', 'bancontact' |
| payment_status | TEXT | 'pending', 'completed', 'failed' |
| amount_cents | INTEGER | Bedrag in centen |
| currency | TEXT | 'EUR' standaard |
| stripe_session_id | TEXT | Checkout session ID |
| created_at | TIMESTAMP | Aanmaakdatum |

### subscriptions tabel
| Kolom | Type | Beschrijving |
|-------|------|--------------|
| id | UUID | Primary key |
| user_id | UUID | FK naar profiles |
| plan_type | TEXT | 'free', 'basic', 'premium', 'school' |
| stripe_subscription_id | TEXT | Stripe subscription ID |
| status | TEXT | 'active', 'cancelled', 'past_due' |
| current_period_start | TIMESTAMP | Periode start |
| current_period_end | TIMESTAMP | Periode einde |

## 4. Stripe Integratie

### Webhook Events
- `checkout.session.completed` - Nieuwe betaling
- `customer.subscription.updated` - Plan wijziging
- `customer.subscription.deleted` - Annulering
- `invoice.payment_failed` - Mislukte betaling

### Edge Functions
- `create-checkout-session` - Start checkout
- `create-portal-session` - Stripe Customer Portal
- `stripe-webhook` - Webhook handler
