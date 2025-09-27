-- Create users table first as it will be referenced by other tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  contract_type TEXT CHECK (contract_type IN ('standard', 'premium', 'enterprise')),
  contract_start_date DATE,
  contract_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff profiles table
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  position TEXT NOT NULL,
  department TEXT,
  hourly_rate DECIMAL(10,2),
  skills TEXT[],
  certifications TEXT[],
  availability JSONB DEFAULT '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": false, "sunday": false}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  emergency_contact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missions table
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id),
  assigned_staff_id UUID REFERENCES public.staff_profiles(id),
  location TEXT NOT NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  estimated_duration INTEGER, -- in minutes
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  service_type TEXT NOT NULL CHECK (service_type IN ('ramassage', 'recyclage', 'dechets_speciaux', 'urgence')),
  zone TEXT,
  equipment_needed TEXT[],
  gps_location JSONB, -- {lat: number, lng: number}
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mission updates table for tracking progress
CREATE TABLE IF NOT EXISTS public.mission_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff_profiles(id),
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'note', 'photo', 'time_log')),
  content TEXT,
  photo_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id),
  mission_id UUID REFERENCES public.missions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'bank_transfer', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  paypal_order_id TEXT,
  transaction_fee DECIMAL(10,2) DEFAULT 0,
  invoice_ref TEXT,
  invoice_url TEXT,
  description TEXT,
  payment_details JSONB, -- détails supplémentaires spécifiques à la méthode de paiement
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')),
  status TEXT DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rating table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  staff_id UUID REFERENCES public.staff_profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for comments
CREATE POLICY "Users can view mission comments" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_id 
      AND (
        m.client_id = auth.uid() 
        OR m.assigned_staff_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

-- RLS Policies for ratings
CREATE POLICY "Users can view mission ratings" ON public.ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_id 
      AND (
        m.client_id = auth.uid() 
        OR m.assigned_staff_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

-- Create indexes for new tables
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_comments_mission_id ON public.comments(mission_id);
CREATE INDEX idx_ratings_mission_id ON public.ratings(mission_id);
CREATE INDEX idx_ratings_staff_id ON public.ratings(staff_id);

-- RLS Policies for staff_profiles
CREATE POLICY "Staff can view their own profile" ON public.staff_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can update their own profile" ON public.staff_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all staff profiles" ON public.staff_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for missions
CREATE POLICY "Staff can view their assigned missions" ON public.missions
  FOR SELECT USING (assigned_staff_id = auth.uid());

CREATE POLICY "Clients can view their missions" ON public.missions
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admins can view all missions" ON public.missions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for mission_updates
CREATE POLICY "Staff can create updates for their missions" ON public.mission_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE missions.id = mission_id 
      AND missions.assigned_staff_id = auth.uid()
    )
  );

CREATE POLICY "Users can view updates for their missions" ON public.mission_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE missions.id = mission_id 
      AND (missions.assigned_staff_id = auth.uid() OR missions.client_id = auth.uid())
    )
  );

-- RLS Policies for payments
CREATE POLICY "Clients can view their payments" ON public.payments
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
