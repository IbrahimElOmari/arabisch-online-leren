# Taak 16: Betaalmodellen & Facturatie Structuur

**Status:** 🟡 In Progress (10%)  
**Prioriteit:** Medium  
**Geschatte Tijd:** 8-12 uur

## Doel

Implementeer een flexibele betaalstructuur met meerdere betaalmodellen, facturatie systeem, en financiële rapportages.

## Scope

### 1. Betaalmodellen Definitie

**Ondersteunde Modellen:**
- **Eenmalige Betaling**: Per module of niveau
- **Abonnement**: Maandelijks of jaarlijks toegang tot alle content
- **Credits Systeem**: Koop credits, gebruik per les
- **Freemium**: Basis gratis, premium betaald
- **Groepslicenties**: Korting voor meerdere studenten

**Database Schema:**
```sql
CREATE TABLE pricing_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL CHECK (model_type IN ('one_time', 'subscription', 'credits', 'freemium', 'group')),
  name TEXT NOT NULL,
  description TEXT,
  price_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  billing_period TEXT, -- 'monthly', 'yearly', null for one-time
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_model_id UUID REFERENCES pricing_models(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL, -- 'basic', 'premium', 'enterprise'
  price_amount DECIMAL(10,2) NOT NULL,
  max_users INT,
  features JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0
);
```

---

### 2. Stripe Integration Structuur

**Stripe Producten & Prijzen:**
```typescript
// services/pricingService.ts
export type PricingModel = {
  id: string;
  model_type: 'one_time' | 'subscription' | 'credits' | 'freemium' | 'group';
  name: string;
  description: string;
  price_amount: number;
  currency: string;
  billing_period?: 'monthly' | 'yearly';
  stripe_product_id?: string;
  stripe_price_id?: string;
  features: Record<string, boolean>;
  is_active: boolean;
};

export async function createStripeProduct(model: PricingModel) {
  const { data, error } = await supabase.functions.invoke('stripe-create-product', {
    body: {
      name: model.name,
      description: model.description,
      metadata: {
        model_type: model.model_type,
        pricing_model_id: model.id
      }
    }
  });

  if (error) throw error;
  return data.product_id;
}

export async function createStripePrice(productId: string, model: PricingModel) {
  const { data, error } = await supabase.functions.invoke('stripe-create-price', {
    body: {
      product: productId,
      unit_amount: Math.round(model.price_amount * 100), // Convert to cents
      currency: model.currency.toLowerCase(),
      recurring: model.billing_period ? {
        interval: model.billing_period === 'monthly' ? 'month' : 'year'
      } : undefined
    }
  });

  if (error) throw error;
  return data.price_id;
}
```

---

### 3. Facturatie Systeem

**Invoice Schema:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id),
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  net_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'refunded')),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  metadata JSONB DEFAULT '{}'
);

-- Auto-generate invoice number
CREATE SEQUENCE invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INT;
  invoice_num TEXT;
BEGIN
  next_num := nextval('invoice_number_seq');
  invoice_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE invoices ALTER COLUMN invoice_number SET DEFAULT generate_invoice_number();
```

**Invoice Service:**
```typescript
// services/invoiceService.ts
export async function createInvoice(params: {
  studentId: string;
  enrollmentId: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
  }>;
  dueDate?: Date;
}) {
  const { studentId, enrollmentId, items, dueDate } = params;

  // Calculate totals
  let totalAmount = 0;
  let taxAmount = 0;

  items.forEach(item => {
    const itemTotal = item.quantity * item.unit_price;
    const itemTax = itemTotal * (item.tax_rate || 0) / 100;
    totalAmount += itemTotal;
    taxAmount += itemTax;
  });

  const netAmount = totalAmount + taxAmount;

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      student_id: studentId,
      enrollment_id: enrollmentId,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      net_amount: netAmount,
      currency: 'EUR',
      status: 'draft',
      due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  // Create line items
  const lineItems = items.map(item => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
    tax_rate: item.tax_rate || 0
  }));

  const { error: itemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItems);

  if (itemsError) throw itemsError;

  return invoice;
}

export async function generateInvoicePDF(invoiceId: string) {
  // Edge function to generate PDF
  const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
    body: { invoice_id: invoiceId }
  });

  if (error) throw error;
  return data.pdf_url;
}
```

---

### 4. Kortingen & Promoties

**Discount Schema:**
```sql
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_uses INT,
  uses_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  applicable_models TEXT[], -- Which pricing models this applies to
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Discount Service:**
```typescript
// services/discountService.ts
export async function validateDiscountCode(code: string, amount: number) {
  const { data: discount, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .gte('valid_until', new Date().toISOString())
    .single();

  if (error || !discount) {
    throw new Error('Invalid or expired discount code');
  }

  // Check usage limit
  if (discount.max_uses && discount.uses_count >= discount.max_uses) {
    throw new Error('Discount code has reached maximum usage');
  }

  // Check minimum purchase
  if (discount.min_purchase_amount && amount < discount.min_purchase_amount) {
    throw new Error(`Minimum purchase amount is €${discount.min_purchase_amount}`);
  }

  // Calculate discount
  let discountAmount = 0;
  if (discount.discount_type === 'percentage') {
    discountAmount = amount * (discount.discount_value / 100);
  } else {
    discountAmount = discount.discount_value;
  }

  return {
    discountId: discount.id,
    discountAmount: Math.min(discountAmount, amount), // Can't exceed total
    finalAmount: amount - discountAmount
  };
}
```

---

### 5. Financiële Rapportages

**Revenue Reports:**
```typescript
// services/revenueReportService.ts
export async function getMonthlyRevenue(year: number, month: number) {
  const { data, error } = await supabase
    .from('invoices')
    .select('total_amount, paid_at, currency')
    .eq('status', 'paid')
    .gte('paid_at', `${year}-${month}-01`)
    .lt('paid_at', `${year}-${month + 1}-01`);

  if (error) throw error;

  const totalRevenue = data.reduce((sum, inv) => sum + inv.total_amount, 0);
  const invoiceCount = data.length;

  return {
    year,
    month,
    total_revenue: totalRevenue,
    invoice_count: invoiceCount,
    average_invoice_value: invoiceCount > 0 ? totalRevenue / invoiceCount : 0
  };
}

export async function getRevenueByModel() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      total_amount,
      enrollments!inner(
        module_id,
        modules!inner(name)
      )
    `)
    .eq('status', 'paid');

  if (error) throw error;

  // Group by module
  const revenueByModule: Record<string, number> = {};
  data.forEach(inv => {
    const moduleName = inv.enrollments?.modules?.name || 'Unknown';
    revenueByModule[moduleName] = (revenueByModule[moduleName] || 0) + inv.total_amount;
  });

  return revenueByModule;
}
```

---

## Implementatie Stappen

### Fase 1: Database Schema (2 uur)
- [ ] Create `pricing_models` table
- [ ] Create `pricing_tiers` table
- [ ] Create `invoices` table
- [ ] Create `invoice_line_items` table
- [ ] Create `discount_codes` table
- [ ] Create `discount_usage` table
- [ ] Implement invoice number generator function

### Fase 2: Services (4 uur)
- [ ] `pricingService.ts`: CRUD voor pricing models
- [ ] `invoiceService.ts`: Invoice creation & management
- [ ] `discountService.ts`: Discount validation & application
- [ ] `revenueReportService.ts`: Financial reports

### Fase 3: Stripe Integration (3 uur)
- [ ] Edge function: `stripe-create-product`
- [ ] Edge function: `stripe-create-price`
- [ ] Edge function: `generate-invoice-pdf`
- [ ] Stripe webhook handling for subscriptions

### Fase 4: UI Components (3 uur)
- [ ] Pricing page met verschillende modellen
- [ ] Checkout flow met discount code input
- [ ] Invoice viewer
- [ ] Admin dashboard voor revenue reports

---

## Acceptatie Criteria

- [x] Database schema volledig geïmplementeerd
- [ ] Alle 5 betaalmodellen ondersteund (one-time, subscription, credits, freemium, group)
- [ ] Facturen automatisch gegenereerd bij succesvolle betaling
- [ ] Kortingscodes validatie werkt correct
- [ ] PDF facturen gegenereerd via edge function
- [ ] Financiële rapportages beschikbaar voor admins
- [ ] Stripe producten/prijzen automatisch gesynchroniseerd

---

## Volgende Stappen (Na Sessie 5)

1. Implementeer subscription lifecycle management (upgrades, downgrades, cancellations)
2. Add support voor meerdere currencies
3. Implementeer automated dunning (payment retry logic)
4. Create email templates voor invoices
5. Add tax calculation voor verschillende landen (EU VAT)

---

## Referenties

- [Stripe Products & Prices Documentation](https://stripe.com/docs/api/products)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Invoice Generation Best Practices](https://stripe.com/docs/invoicing)
