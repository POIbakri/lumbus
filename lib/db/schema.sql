-- Lumbus Database Schema
-- Run this SQL on your Supabase/Neon PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    data_gb DECIMAL(10, 2) NOT NULL,
    validity_days INTEGER NOT NULL,
    supplier_sku VARCHAR(255) NOT NULL UNIQUE,
    retail_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plans_region ON plans(region_code);
CREATE INDEX idx_plans_active ON plans(is_active);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'provisioning', 'completed', 'failed')),
    stripe_session_id VARCHAR(255) UNIQUE,
    connect_order_id VARCHAR(255) UNIQUE,
    qr_url TEXT,
    smdp VARCHAR(255),
    activation_code VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX idx_orders_connect_order ON orders(connect_order_id);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_webhook_provider_type ON webhook_events(provider, event_type);
CREATE INDEX idx_webhook_processed ON webhook_events(processed_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample plans (1GLOBAL SKUs - update with real SKUs)
INSERT INTO plans (name, region_code, data_gb, validity_days, supplier_sku, retail_price, currency) VALUES
('Japan 5GB - 30 Days', 'JP', 5, 30, '1GLOBAL_JP_5GB_30D', 19.99, 'USD'),
('Europe 10GB - 30 Days', 'EU', 10, 30, '1GLOBAL_EU_10GB_30D', 29.99, 'USD'),
('USA 5GB - 30 Days', 'US', 5, 30, '1GLOBAL_US_5GB_30D', 24.99, 'USD'),
('Global 3GB - 7 Days', 'GLOBAL', 3, 7, '1GLOBAL_GLOBAL_3GB_7D', 14.99, 'USD')
ON CONFLICT (supplier_sku) DO NOTHING;
