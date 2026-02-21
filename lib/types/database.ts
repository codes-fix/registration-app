// Database types for the Event Registration System
// Auto-generated from Supabase schema

export type UserRole = 
  | 'super_admin'
  | 'management'
  | 'attendee'
  | 'speaker'
  | 'staff'
  | 'volunteer'
  | 'guest'
  | 'admin';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type SubscriptionPlan =
  | 'free'
  | 'starter'
  | 'professional'
  | 'enterprise';

export type EventStatus = 
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type TicketType = 
  | 'general_admission'
  | 'vip'
  | 'group'
  | 'student'
  | 'early_bird'
  | 'speaker'
  | 'staff'
  | 'complimentary';

export type RegistrationStatus = 
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'cancelled'
  | 'waitlist';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type CheckinStatus = 
  | 'not_checked_in'
  | 'checked_in'
  | 'checked_out'
  | 'no_show';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  business_type?: string;
  logo_url?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  trial_ends_at?: string;
  max_events: number;
  max_attendees_per_event: number;
  max_team_members: number;
  is_active: boolean;
  settings?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  bio?: string;
  profile_image_url?: string;
  role: UserRole;
  organization_id?: string;
  is_organization_owner: boolean;
  position?: string;
  department?: string;
  is_active: boolean;
  dietary_restrictions?: string[];
  accessibility_needs?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  slug: string;
  start_date: string;
  end_date: string;
  timezone: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_country?: string;
  venue_postal_code?: string;
  is_virtual: boolean;
  virtual_platform?: string;
  virtual_link?: string;
  max_attendees?: number;
  registration_start_date?: string;
  registration_end_date?: string;
  status: EventStatus;
  featured_image_url?: string;
  banner_image_url?: string;
  website_url?: string;
  contact_email?: string;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketTypeData {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  type: TicketType;
  price: number;
  currency: string;
  quantity_available?: number;
  quantity_sold: number;
  min_quantity_per_order: number;
  max_quantity_per_order: number;
  sale_start_date?: string;
  sale_end_date?: string;
  is_active: boolean;
  requires_approval: boolean;
  includes_items?: string[];
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type_id: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: RegistrationStatus;
  registration_date: string;
  confirmation_code?: string;
  qr_code?: string;
  special_requirements?: string;
  group_name?: string;
  group_size?: number;
  is_group_leader: boolean;
  dietary_restrictions?: string[];
  accessibility_needs?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  payment_processor?: string;
  processor_transaction_id?: string;
  status: PaymentStatus;
  discount_code?: string;
  discount_amount: number;
  fee_amount: number;
  net_amount?: number;
  processed_at?: string;
  refunded_at?: string;
  refund_amount?: number;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  session_name?: string;
  checkin_time?: string;
  checkout_time?: string;
  status: CheckinStatus;
  checked_in_by?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface EventSession {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  room?: string;
  max_attendees?: number;
  session_type?: string;
  speaker_ids?: string[];
  requires_separate_registration: boolean;
  is_mandatory: boolean;
  materials_url?: string;
  recording_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Speaker {
  id: string;
  user_id: string;
  event_id: string;
  title?: string;
  bio?: string;
  company?: string;
  website_url?: string;
  social_links?: Record<string, string>;
  headshot_url?: string;
  presentation_title?: string;
  presentation_description?: string;
  presentation_slides_url?: string;
  presentation_materials?: Record<string, any>;
  contact_preferences?: Record<string, any>;
  travel_requirements?: string;
  accommodation_requirements?: string;
  honorarium_amount?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StaffAssignment {
  id: string;
  user_id: string;
  event_id: string;
  role: string;
  department?: string;
  shift_start?: string;
  shift_end?: string;
  location?: string;
  responsibilities?: string[];
  contact_number?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DiscountCode {
  id: string;
  event_id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  max_uses?: number;
  current_uses: number;
  valid_from?: string;
  valid_until?: string;
  applicable_ticket_types?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  event_id: string;
  name: string;
  subject: string;
  content: string;
  sender_email?: string;
  sender_name?: string;
  recipient_filter?: Record<string, any>;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients?: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  questions: Record<string, any>;
  is_active: boolean;
  is_post_event: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  registration_id: string;
  responses: Record<string, any>;
  submitted_at: string;
}

export interface SubscriptionHistory {
  id: string;
  organization_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  billing_period_start?: string;
  billing_period_end?: string;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  paid_at?: string;
  created_at: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  invited_by?: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

// Utility types for forms and API responses
export interface CreateEventData {
  title: string;
  description?: string;
  short_description?: string;
  start_date: string;
  end_date: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_country?: string;
  is_virtual?: boolean;
  max_attendees?: number;
  registration_start_date?: string;
  registration_end_date?: string;
}

export interface CreateRegistrationData {
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  special_requirements?: string;
  group_name?: string;
  group_size?: number;
  dietary_restrictions?: string[];
  accessibility_needs?: string[];
  custom_fields?: Record<string, any>;
}

export interface UserRegistrationSummary {
  registration: Registration;
  event: Event;
  ticket_type: TicketTypeData;
  payment?: Payment;
  checkin?: Checkin;
}

export interface DashboardStats {
  total_events: number;
  total_registrations: number;
  total_revenue: number;
  upcoming_events: number;
  checked_in_today: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Form validation types
export interface RegistrationFormData {
  personal_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company?: string;
    job_title?: string;
  };
  ticket_selection: {
    ticket_type_id: string;
    quantity: number;
  };
  additional_info: {
    dietary_restrictions?: string[];
    accessibility_needs?: string[];
    special_requirements?: string;
  };
  emergency_contact?: {
    name: string;
    phone: string;
  };
  custom_fields?: Record<string, any>;
}

export interface EventFormData {
  basic_info: {
    title: string;
    description: string;
    short_description?: string;
    start_date: string;
    end_date: string;
    timezone: string;
  };
  venue_info: {
    is_virtual: boolean;
    venue_name?: string;
    venue_address?: string;
    venue_city?: string;
    venue_state?: string;
    venue_country?: string;
    virtual_platform?: string;
    virtual_link?: string;
  };
  registration_settings: {
    max_attendees?: number;
    registration_start_date?: string;
    registration_end_date?: string;
  };
  media: {
    featured_image_url?: string;
    banner_image_url?: string;
  };
}

// Database relationships for joins
export interface EventWithStats extends Event {
  ticket_types?: TicketTypeData[];
  registration_count?: number;
  revenue?: number;
  sessions?: EventSession[];
}

export interface RegistrationWithDetails extends Registration {
  event?: Event;
  ticket_type?: TicketTypeData;
  user?: UserProfile;
  payment?: Payment;
  checkin?: Checkin;
}