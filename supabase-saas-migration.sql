-- =====================================================
-- SaaS Migration - Add Organizations and Subscriptions
-- =====================================================
-- Run this in your Supabase SQL Editor to convert to SaaS model

-- Add new organization-related enums
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid'
);

CREATE TYPE subscription_plan AS ENUM (
  'free',
  'starter',
  'professional',
  'enterprise'
);

-- Create Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_type TEXT,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Subscription details
  subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- Limits based on plan
  max_events INTEGER DEFAULT 5,
  max_attendees_per_event INTEGER DEFAULT 100,
  max_team_members INTEGER DEFAULT 3,
  
  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  
  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update user_profiles to add organization relationship
ALTER TABLE user_profiles 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN is_organization_owner BOOLEAN DEFAULT false,
  ADD COLUMN position TEXT,
  ADD COLUMN department TEXT;

-- Update user_role enum to include super_admin and management
-- First, create the new enum
CREATE TYPE user_role_new AS ENUM (
  'super_admin',
  'management',
  'attendee',
  'speaker',
  'staff',
  'volunteer',
  'guest',
  'admin'
);

-- Update the table to use the new enum
-- First, drop the default value
ALTER TABLE user_profiles 
  ALTER COLUMN role DROP DEFAULT;

-- Change the column type
ALTER TABLE user_profiles 
  ALTER COLUMN role TYPE user_role_new 
  USING role::text::user_role_new;

-- Drop the old enum and rename the new one
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;

-- Set the new default value
ALTER TABLE user_profiles 
  ALTER COLUMN role SET DEFAULT 'attendee'::user_role;

-- Create Subscription History table
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  status subscription_status NOT NULL,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Invitations table (for inviting team members)
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'attendee',
  invited_by UUID REFERENCES user_profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Indexes for Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);

-- Indexes for updated user_profiles
CREATE INDEX idx_user_profiles_organization_id ON user_profiles(organization_id);

-- Indexes for Subscription History
CREATE INDEX idx_subscription_history_organization_id ON subscription_history(organization_id);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at DESC);

-- Indexes for Invitations
CREATE INDEX idx_invitations_organization_id ON organization_invitations(organization_id);
CREATE INDEX idx_invitations_email ON organization_invitations(email);
CREATE INDEX idx_invitations_token ON organization_invitations(token);

-- Trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Super admins can see all organizations
CREATE POLICY "Super admins can view all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Organization members can view their organization
CREATE POLICY "Members can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

-- Organization owners can update their organization
CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_organization_owner = true
    )
  );

-- Anyone can create organization (during registration)
CREATE POLICY "Anyone can create organization"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for Subscription History
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view subscription history"
  ON subscription_history FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

-- RLS Policies for Invitations
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization owners can manage invitations"
  ON organization_invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.is_organization_owner = true OR user_profiles.role = 'management')
    )
  );

-- Update events table to add organization_id
ALTER TABLE events 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_events_organization_id ON events(organization_id);

-- Update events RLS policies
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Event creators can insert events" ON events;
DROP POLICY IF EXISTS "Event creators can update own events" ON events;
DROP POLICY IF EXISTS "Event creators can delete own events" ON events;

-- New event policies with organization support
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (status != 'draft' OR created_by = auth.uid());

CREATE POLICY "Organization members can create events"
  ON events FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('management', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Organization members can update events"
  ON events FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('management', 'admin', 'super_admin')
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Organization members can delete events"
  ON events FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('management', 'admin', 'super_admin')
    )
    OR created_by = auth.uid()
  );

-- Function to generate organization slug
CREATE OR REPLACE FUNCTION generate_org_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_organization_limits(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  org organizations%ROWTYPE;
  event_count INTEGER;
  team_count INTEGER;
  result JSONB;
BEGIN
  SELECT * INTO org FROM organizations WHERE id = org_id;
  
  SELECT COUNT(*) INTO event_count FROM events WHERE organization_id = org_id;
  SELECT COUNT(*) INTO team_count FROM user_profiles WHERE organization_id = org_id;
  
  result := jsonb_build_object(
    'can_create_events', event_count < org.max_events,
    'can_add_team_members', team_count < org.max_team_members,
    'current_events', event_count,
    'max_events', org.max_events,
    'current_team_members', team_count,
    'max_team_members', org.max_team_members
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ SaaS migration schema created successfully!';
  RAISE NOTICE 'New tables: organizations, subscription_history, organization_invitations';
  RAISE NOTICE 'Updated: user_profiles (added organization_id), events (added organization_id)';
  RAISE NOTICE 'New roles: super_admin, management';
END $$;
