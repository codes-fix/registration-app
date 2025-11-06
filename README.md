# Registration App - Event Management System

A professional event registration and management platform built with Next.js and Supabase.

## Features

- 🎫 Multiple ticket types
- 🔐 Secure authentication with Supabase
- 💳 Payment processing
- 📱 QR code check-in
- 📊 Real-time analytics
- 👥 Role-based access control

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **Language:** JavaScript

## Color Scheme

- **Primary:** Slate (#64748B)
- **Secondary:** Sky Blue (#0EA5E9)
- **Accent:** Amber (#F59E0B)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd registration-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings -> API
   - Copy your Project URL and anon public key

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Set up database**
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy the contents of `supabase-schema.sql`
   - Run the SQL script

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
registration-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── auth/callback/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── lib/
│   └── supabase/
│       ├── client.js
│       └── server.js
├── middleware.js
├── supabase-schema.sql
└── tailwind.config.js
```

## Deployment on Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Update Supabase redirect URLs**
   - Go to Supabase Dashboard -> Authentication -> URL Configuration
   - Add your Vercel URL to "Site URL"
   - Add `https://your-app.vercel.app/auth/callback` to "Redirect URLs"

## Development Roadmap

- [x] Phase 1: Authentication & Basic Setup
- [ ] Phase 2: Event Creation & Management
- [ ] Phase 3: Ticket Types & Registration
- [ ] Phase 4: Payment Integration
- [ ] Phase 5: QR Code Check-in
- [ ] Phase 6: Speaker/Staff Portals
- [ ] Phase 7: Analytics & Reporting

## License

MIT

## Support

For support, email support@eventreg.com