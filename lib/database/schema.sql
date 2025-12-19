-- Registration App Database Schema
-- This file contains the complete database structure for the event registration system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'attendee',
  'organizer',
  'admin'
);

-- Event status enum
CREATE TYPE event_status AS ENUM (
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'ongoing',
  'completed',
  'cancelled'
);

-- Ticket type enum
CREATE TYPE ticket_type AS ENUM (
  'general_admission',
  'vip',
  'group',
  'student',
  'early_bird',
  'speaker',
  'staff',
  'complimentary'
);

-- Registration status enum
CREATE TYPE registration_status AS ENUM (
  'pending',
  'confirmed',
  'paid',
  'cancelled',
  'waitlist'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

-- Check-in status enum
CREATE TYPE checkin_status AS ENUM (
  'not_checked_in',
  'checked_in',
  'checked_out',
  'no_show'
);

-- Enhanced user profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  bio TEXT,
  profile_image_url TEXT,
  role user_role DEFAULT 'attendee',
  is_active BOOLEAN DEFAULT true,
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Add approval status for organizers
ALTER TABLE user_profiles 
ADD COLUMN approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending_approval', 'approved', 'rejected')),
ADD COLUMN approval_notes TEXT,
ADD COLUMN approved_by UUID REFERENCES user_profiles(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Add index for filtering pending approvals
CREATE INDEX idx_user_profiles_approval_status ON user_profiles(approval_status);

-- Update comment
COMMENT ON COLUMN user_profiles.approval_status IS 'Approval status for event organizers. Attendees are auto-approved.';

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  slug TEXT UNIQUE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  venue_name TEXT,
  venue_address TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_country TEXT,
  venue_postal_code TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_platform TEXT,
  virtual_link TEXT,
  max_attendees INTEGER,
  registration_start_date TIMESTAMP WITH TIME ZONE,
  registration_end_date TIMESTAMP WITH TIME ZONE,
  status event_status DEFAULT 'draft',
  featured_image_url TEXT,
  banner_image_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  tags TEXT[],
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket types for events
CREATE TABLE ticket_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type ticket_type NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  quantity_available INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  min_quantity_per_order INTEGER DEFAULT 1,
  max_quantity_per_order INTEGER DEFAULT 10,
  sale_start_date TIMESTAMP WITH TIME ZONE,
  sale_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  includes_items TEXT[], -- e.g., ['workshop_access', 'lunch', 'materials']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations
CREATE TABLE registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  status registration_status DEFAULT 'pending',
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmation_code TEXT UNIQUE,
  qr_code TEXT,
  special_requirements TEXT,
  group_name TEXT,
  group_size INTEGER,
  is_group_leader BOOLEAN DEFAULT false,
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  custom_fields JSONB, -- Flexible custom form data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Payment transactions
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT, -- 'credit_card', 'paypal', 'bank_transfer', etc.
  payment_processor TEXT, -- 'stripe', 'paypal', etc.
  processor_transaction_id TEXT,
  status payment_status DEFAULT 'pending',
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  fee_amount DECIMAL(10,2) DEFAULT 0.00,
  net_amount DECIMAL(10,2),
  processed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-in/out tracking
CREATE TABLE checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_name TEXT, -- For multi-session events
  checkin_time TIMESTAMP WITH TIME ZONE,
  checkout_time TIMESTAMP WITH TIME ZONE,
  status checkin_status DEFAULT 'not_checked_in',
  checked_in_by UUID REFERENCES user_profiles(id), -- Staff member who performed check-in
  notes TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event sessions/agenda
CREATE TABLE event_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  room TEXT,
  max_attendees INTEGER,
  session_type TEXT, -- 'keynote', 'workshop', 'panel', 'break', etc.
  speaker_ids UUID[],
  requires_separate_registration BOOLEAN DEFAULT false,
  is_mandatory BOOLEAN DEFAULT false,
  materials_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Speaker profiles and information
CREATE TABLE speakers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT,
  bio TEXT,
  company TEXT,
  website_url TEXT,
  social_links JSONB, -- {twitter: '', linkedin: '', etc.}
  headshot_url TEXT,
  presentation_title TEXT,
  presentation_description TEXT,
  presentation_slides_url TEXT,
  presentation_materials JSONB, -- Array of file URLs/info
  contact_preferences JSONB,
  travel_requirements TEXT,
  accommodation_requirements TEXT,
  honorarium_amount DECIMAL(10,2),
  status TEXT DEFAULT 'invited', -- 'invited', 'confirmed', 'declined'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Staff assignments and schedules
CREATE TABLE staff_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'registration', 'security', 'tech_support', etc.
  department TEXT,
  shift_start TIMESTAMP WITH TIME ZONE,
  shift_end TIMESTAMP WITH TIME ZONE,
  location TEXT,
  responsibilities TEXT[],
  contact_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'assigned', -- 'assigned', 'confirmed', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discount codes and promotions
CREATE TABLE discount_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_ticket_types UUID[], -- Array of ticket_type IDs
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, code)
);

-- Email campaigns and communications
CREATE TABLE email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_email TEXT,
  sender_name TEXT,
  recipient_filter JSONB, -- Criteria for selecting recipients
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback and surveys
CREATE TABLE surveys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL, -- Array of question objects
  is_active BOOLEAN DEFAULT true,
  is_post_event BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE survey_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  responses JSONB NOT NULL, -- Question-answer pairs
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_registrations_event_user ON registrations(event_id, user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_checkins_event_user ON checkins(event_id, user_id);
CREATE INDEX idx_checkins_status ON checkins(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_user_profiles 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_events 
  BEFORE UPDATE ON events 
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_registrations 
  BEFORE UPDATE ON registrations 
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_payments 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_set_timestamp();

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- All users can view published events
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT USING (status = 'published' OR status = 'registration_open');

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations" ON registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own registrations
CREATE POLICY "Users can create own registrations" ON registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);