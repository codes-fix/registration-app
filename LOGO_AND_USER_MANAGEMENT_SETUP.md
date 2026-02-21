# Logo Management & User Approval Setup Guide

## 🎯 Features Implemented

### 1. **Email Auto-Confirmation**
- New registered users are now auto-confirmed
- They can login immediately after registration
- No more "email not confirmed" errors!

### 2. **Super Admin User Management** (`/admin/users`)
- View all platform users
- Filter by: All, Pending Approval, Approved
- Approve user emails manually (if needed)
- Delete users (except super admins)
- See user roles, organizations, and join dates

### 3. **Logo Management in Settings** (`/settings`)

#### For Super Admin:
- Upload **Site Logo** (appears on login, register, public pages)
- Logo stored in `site-logos` bucket
- Saved to `site_settings` table

#### For Management Users:
- Upload **Organization Logo** (appears for their team)
- Logo stored in `organization-logos` bucket  
- Saved to their organization record
- Shows to all their team members (attendees, speakers, etc.)

---

## 📋 Setup Steps

### Step 1: Run Logo Storage SQL

Open your **Supabase SQL Editor** and run [setup-logo-storage.sql](setup-logo-storage.sql):

```sql
-- Creates storage buckets
-- Sets up RLS policies
-- Creates site_settings table
```

This will create:
- ✅ `organization-logos` bucket (public)
- ✅ `site-logos` bucket (public)
- ✅ `site_settings` table
- ✅ Proper RLS policies for both

### Step 2: Access Super Admin Panel

1. Login as super admin: `sanwalbajwa6026@gmail.com`
2. Navigate to: **`/admin/users`**
3. You'll see all registered users
4. Use filters to find pending/approved users
5. Click "Approve" to confirm emails manually

### Step 3: Upload Site Logo (Super Admin)

1. Go to: **Settings** (`/settings`)
2. Scroll to "Site Logo" section
3. Click "Choose Logo"
4. Select image (PNG, JPG, GIF - max 2MB)
5. Click "Upload Logo"
6. ✅ Logo now appears on login/register pages

### Step 4: Upload Organization Logo (Management)

1. Login as management user
2. Go to: **Settings** (`/settings`)
3. Scroll to "Organization Logo" section
4. Click "Choose Logo"
5. Select  image (PNG, JPG, GIF - max 2MB)
6. Click "Upload Logo"
7. ✅ Logo appears for your organization

---

## 🔐 API Routes Created

### User Management:
- `POST /api/admin/users/confirm` - Confirm user email
- `POST /api/admin/users/delete` - Delete user account

### Organization:
- `POST /api/organizations` - Now auto-confirms emails

---

## 📱 How It Works

### User Registration Flow:
1. User registers → Creates auth account
2. Organization created (via API)
3. **Email auto-confirmed** ✅
4. User can login immediately
5. Super admin can see them in `/admin/users`

### Logo Display Logic:

**Public Pages (Login/Register):**
- Shows **Site Logo** if uploaded by super admin
- Falls back to default EventReg logo

**User Dashboard/App:**
- **Management users**: See their organization logo
- **Their team members**: See same organization logo
- **Super admin**: Sees site logo everywhere

---

## 🎨 Logo Specifications

- **Format**: PNG, JPG, or GIF
- **Max Size**: 2MB
- **Recommended**:   - Square aspect ratio (1:1)
  - Minimum 200x200px
  - Transparent background (PNG) works best

---

## 🛡️ Security

- ✅ RLS policies enforce access control
- ✅ Only super admins can upload site logos
- ✅ Only organization owners/management can upload org logos
- ✅ Logos are public (anyone can view)
- ✅ Only authenticated users can upload

---

## 🧪 Testing

1. **Test User Approval**:
   - Create a new test user
   - Login as super admin
   - Go to `/admin/users`
   - Should see new user in list

2. **Test Site Logo**:
   - Login as super admin
   - Upload logo in settings
   - Logout
   - Check login page for logo

3. **Test Org Logo**:
   - Login as management user
   - Upload org logo
   - Check if it appears in your dashboard
   - Have a team member login - they should see it too

---

## 📝 Next Steps

After running the setup SQL, you can:
- ✅ View and approve users at `/admin/users`
- ✅ Upload site logo in settings (super admin)
- ✅ Upload organization logo in settings (management)
- ✅ Users can register and login immediately

Changes deployed to GitHub (commit 532ac2d)! 🚀
