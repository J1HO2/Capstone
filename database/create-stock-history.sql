-- Create stock_history table to track all inventory transactions
CREATE TABLE IF NOT EXISTS stock_history (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'purchase')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    previous_stock INTEGER,
    new_stock INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_history_inventory_id ON stock_history(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_transaction_type ON stock_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_history_user_email ON stock_history(user_email);

-- Add RLS (Row Level Security) policies
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read stock history
CREATE POLICY "Users can read stock history" ON stock_history
    FOR SELECT TO authenticated
    USING (true);

-- Allow authenticated users to insert stock history
CREATE POLICY "Users can insert stock history" ON stock_history
    FOR INSERT TO authenticated
    WITH CHECK (true);
