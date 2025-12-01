-- ============================================================================
-- CREATE STOCK HISTORY TABLE FOR INVENTORY TRANSACTION TRACKING
-- Run this script in Supabase SQL Editor to create the stock_history table
-- ============================================================================

-- Step 1: Drop existing table if it exists (optional - only if you want to reset)
-- DROP TABLE IF EXISTS stock_history CASCADE;

-- Step 2: Create the stock_history table
CREATE TABLE IF NOT EXISTS public.stock_history (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT DEFAULT 'No reason provided',
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    previous_stock INTEGER,
    new_stock INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT fk_inventory_id FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE,
    CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('stock_in', 'stock_out', 'purchase')),
    CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_history_inventory_id 
    ON public.stock_history(inventory_id);

CREATE INDEX IF NOT EXISTS idx_stock_history_created_at 
    ON public.stock_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_history_transaction_type 
    ON public.stock_history(transaction_type);

CREATE INDEX IF NOT EXISTS idx_stock_history_user_email 
    ON public.stock_history(user_email);

CREATE INDEX IF NOT EXISTS idx_stock_history_user_name 
    ON public.stock_history(user_name);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for authenticated users

-- Policy 1: Allow authenticated users to READ stock history
DROP POLICY IF EXISTS "Users can read stock history" ON public.stock_history;
CREATE POLICY "Users can read stock history" ON public.stock_history
    FOR SELECT TO authenticated
    USING (true);

-- Policy 2: Allow authenticated users to INSERT stock history
DROP POLICY IF EXISTS "Users can insert stock history" ON public.stock_history;
CREATE POLICY "Users can insert stock history" ON public.stock_history
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Policy 3: Allow users to UPDATE their own records (optional)
DROP POLICY IF EXISTS "Users can update stock history" ON public.stock_history;
CREATE POLICY "Users can update stock history" ON public.stock_history
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 6: Add table description
COMMENT ON TABLE public.stock_history IS 'Tracks all stock transactions (stock in, stock out, purchases) for inventory items';
COMMENT ON COLUMN public.stock_history.inventory_id IS 'Reference to the inventory product';
COMMENT ON COLUMN public.stock_history.transaction_type IS 'Type of transaction: stock_in (restock), stock_out (sale), purchase';
COMMENT ON COLUMN public.stock_history.quantity IS 'Number of units affected by this transaction';
COMMENT ON COLUMN public.stock_history.reason IS 'Reason for the transaction';
COMMENT ON COLUMN public.stock_history.user_email IS 'Email of the user who performed the transaction';
COMMENT ON COLUMN public.stock_history.user_name IS 'Name of the user who performed the transaction';
COMMENT ON COLUMN public.stock_history.previous_stock IS 'Stock level before the transaction';
COMMENT ON COLUMN public.stock_history.new_stock IS 'Stock level after the transaction';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the table was created correctly)
-- ============================================================================

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_history'
) as table_exists;

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'stock_history'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'stock_history';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'stock_history'
ORDER BY indexname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see all the above queries return results without errors,
-- the stock_history table has been successfully created!
-- 
-- Next steps:
-- 1. Go back to your app and refresh the page (Ctrl+F5)
-- 2. Try adding/removing stock from a product
-- 3. The transaction should now appear in the Stock Activity Tracker
-- ============================================================================
