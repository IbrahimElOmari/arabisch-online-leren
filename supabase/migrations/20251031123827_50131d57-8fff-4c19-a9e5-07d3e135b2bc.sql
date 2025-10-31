-- PR3: Additional RLS policies and audit triggers for enrollments/payments

-- Drop and recreate policies to ensure consistency
DROP POLICY IF EXISTS "Students update own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students create own payments" ON public.enrollments;

-- Students can update their own enrollments (for status changes)
CREATE POLICY "Students update own enrollments"
ON public.enrollments
FOR UPDATE
TO authenticated
USING (student_id = auth.uid());

-- Students can create payment records (via edge function)
CREATE POLICY "Students create own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  enrollment_id IN (
    SELECT id FROM public.enrollments
    WHERE student_id = auth.uid()
  )
);

-- ============================================
-- AUDIT TRIGGERS FOR ENROLLMENTS AND PAYMENTS
-- ============================================

-- Audit function for enrollments
CREATE OR REPLACE FUNCTION audit_enrollment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, details, severity)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'ENROLLMENT_CREATED',
      'enrollment',
      NEW.id::text,
      jsonb_build_object(
        'module_id', NEW.module_id,
        'payment_type', NEW.payment_type,
        'status', NEW.status
      ),
      'info'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, old_values, new_values, details, severity)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'ENROLLMENT_UPDATED',
      'enrollment',
      NEW.id::text,
      jsonb_build_object('status', OLD.status, 'class_id', OLD.class_id, 'level_id', OLD.level_id),
      jsonb_build_object('status', NEW.status, 'class_id', NEW.class_id, 'level_id', NEW.level_id),
      jsonb_build_object('changed_fields', 
        CASE 
          WHEN OLD.status IS DISTINCT FROM NEW.status THEN jsonb_build_array('status')
          ELSE '[]'::jsonb
        END
      ),
      CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'warning' ELSE 'info' END
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Audit function for payments
CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, details, severity)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'PAYMENT_CREATED',
      'payment',
      NEW.id::text,
      jsonb_build_object(
        'enrollment_id', NEW.enrollment_id,
        'amount_cents', NEW.amount_cents,
        'payment_type', NEW.payment_type,
        'payment_method', NEW.payment_method
      ),
      'info'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, actie, resource_type, resource_id, old_values, new_values, details, severity)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      CASE 
        WHEN NEW.payment_status = 'success' THEN 'PAYMENT_STUB_SUCCEEDED'
        WHEN NEW.payment_status = 'failed' THEN 'PAYMENT_STUB_FAILED'
        ELSE 'PAYMENT_UPDATED'
      END,
      'payment',
      NEW.id::text,
      jsonb_build_object('payment_status', OLD.payment_status),
      jsonb_build_object('payment_status', NEW.payment_status),
      jsonb_build_object(
        'transaction_id', NEW.transaction_id,
        'completed_at', NEW.completed_at
      ),
      CASE 
        WHEN NEW.payment_status = 'success' THEN 'info'
        WHEN NEW.payment_status = 'failed' THEN 'warning'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS audit_enrollments_trigger ON public.enrollments;
CREATE TRIGGER audit_enrollments_trigger
AFTER INSERT OR UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION audit_enrollment_changes();

DROP TRIGGER IF EXISTS audit_payments_trigger ON public.payments;
CREATE TRIGGER audit_payments_trigger
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION audit_payment_changes();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_module_id ON public.enrollments(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON public.enrollments(class_id) WHERE class_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON public.payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id) WHERE transaction_id IS NOT NULL;