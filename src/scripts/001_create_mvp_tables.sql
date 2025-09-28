-- Replacing with the provided MVP database schema
-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'client', 'staff')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Client table
CREATE TABLE IF NOT EXISTS "Client" (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    address TEXT,
    user_id UUID REFERENCES "User"(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Staff table
CREATE TABLE IF NOT EXISTS "Staff" (
    staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('collecteur', 'chauffeur', 'superviseur')) NOT NULL,
    contact VARCHAR(255),
    user_id UUID REFERENCES "User"(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ServiceRequest table
CREATE TABLE IF NOT EXISTS "ServiceRequest" (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) CHECK (type IN ('ramassage', 'livraison', 'transport')) NOT NULL,
    description TEXT,
    location TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    client_id UUID REFERENCES "Client"(client_id) ON DELETE CASCADE,
    staff_id UUID REFERENCES "Staff"(staff_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Payment table (optional for MVP)
CREATE TABLE IF NOT EXISTS "Payment" (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) CHECK (method IN ('cash', 'mobile_money')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('paid', 'unpaid')) DEFAULT 'unpaid',
    request_id UUID REFERENCES "ServiceRequest"(request_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Clients can see their own data
CREATE POLICY "Clients can view own data" ON "Client"
    FOR SELECT USING (user_id = auth.uid());

-- Staff can see their own data
CREATE POLICY "Staff can view own data" ON "Staff"
    FOR SELECT USING (user_id = auth.uid());

-- Service requests visibility based on role
CREATE POLICY "Service requests visibility" ON "ServiceRequest"
    FOR SELECT USING (
        client_id IN (SELECT client_id FROM "Client" WHERE user_id = auth.uid()) OR
        staff_id IN (SELECT staff_id FROM "Staff" WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM "User" WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Payments visibility
CREATE POLICY "Payments visibility" ON "Payment"
    FOR SELECT USING (
        request_id IN (
            SELECT request_id FROM "ServiceRequest" sr
            JOIN "Client" c ON sr.client_id = c.client_id
            WHERE c.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM "User" WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Insert sample data
INSERT INTO "User" (user_id, name, email, password, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@service.com', 'password123', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'Jean Dupont', 'client@service.com', 'password123', 'client'),
    ('33333333-3333-3333-3333-333333333333', 'Marie Martin', 'staff@service.com', 'password123', 'staff');

INSERT INTO "Client" (client_id, name, contact, address, user_id) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Jean Dupont', '+33123456789', '123 Rue de la Paix, Paris', '22222222-2222-2222-2222-222222222222');

INSERT INTO "Staff" (staff_id, name, role, contact, user_id) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marie Martin', 'collecteur', '+33987654321', '33333333-3333-3333-3333-333333333333');

INSERT INTO "ServiceRequest" (request_id, type, description, location, status, client_id, staff_id) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ramassage', 'Collecte des déchets ménagers', '123 Rue de la Paix, Paris', 'pending', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
