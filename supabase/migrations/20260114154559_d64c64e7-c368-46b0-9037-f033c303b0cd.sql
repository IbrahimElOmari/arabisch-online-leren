-- Add order_index column to lessen table for lesson ordering
ALTER TABLE public.lessen ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_lessen_order ON public.lessen(class_id, order_index);

-- Add order_index column to vragen table for question ordering
ALTER TABLE public.vragen ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;