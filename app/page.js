'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { useSiteLogo } from '@/lib/hooks/useLogo'
import { TicketIcon, MoneyIcon, CheckCircleIcon, ChartIcon, CalendarIcon, UserIcon, SearchIcon, LocationIcon } from '@/components/ui/Icons'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { logo: siteLogo } = useSiteLogo()

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100">
      {/* Header */} 
      <header className="bg-white/90 backdrop-blur-md shadow-md border-b border-primary-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center gap-3 group">
                {siteLogo ? (
                  <img 
                    src={siteLogo} 
                    alt="At The Roc Logo" 
                    className="h-10 w-10 object-contain rounded-lg shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                    <TicketIcon className="w-6 h-6 text-white" />
                  </div>
                )}
                <h1 className="text-2xl font-bold text-primary cursor-pointer">At The Roc</h1>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="w-20 h-8 bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse rounded-lg"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard" className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/events" className="px-4 py-2 bg-white text-primary-600 border-2 border-primary-300 rounded-lg hover:bg-primary-50 hover:shadow-md transition-all duration-200 font-medium">
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative elements with floating animation */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent-200 rounded-full opacity-10 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-200 shadow-md mb-6 animate-fade-in-down">
            <CheckCircleIcon className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-semibold text-gray-700">Trusted by 25,000+ Event Organizers Worldwide</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            The Ultimate Platform for
            <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent"> Event Management</span> &
            <span className="bg-gradient-to-r from-secondary-600 to-secondary-700 bg-clip-text text-transparent"> Registration</span>
          </h2>
          <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto font-medium animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            Powerful tools for event organizers, seamless experiences for attendees. Manage registrations, 
            speakers, staff, and attendees all in one place with enterprise-grade features.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 text-lg px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-200 font-semibold group">
                <TicketIcon className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" />
                Start Free Trial
              </Link>
              <Link href="#features" className="inline-flex items-center justify-center gap-2 text-lg px-8 py-3 bg-white text-primary-700 border-2 border-primary-300 rounded-xl hover:bg-primary-50 hover:shadow-lg transition-all duration-200 font-semibold group">
                <SearchIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                Explore Features
              </Link>
            </div>
          )}

          {user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 text-lg px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-200 font-semibold">
                <ChartIcon className="w-6 h-6" />
                Go to Dashboard
              </Link>
              <Link href="/events/create" className="inline-flex items-center justify-center gap-2 text-lg px-8 py-3 bg-gradient-to-r from-secondary-600 to-secondary-700 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-200 font-semibold">
                <CalendarIcon className="w-6 h-6" />
                Create Event
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full border border-primary-200 mb-4">
              <CheckCircleIcon className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Feature-Rich Platform</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Successful Events
            </h3>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
              Our platform provides all the tools you need to manage events from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature cards with staggered animation */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-md">
                <TicketIcon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Registration
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Multiple ticket types, group registrations, early bird pricing, and custom forms.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200 shadow-md">
                <MoneyIcon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Secure Payments
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Integrated payment processing, invoicing, discount codes, and automated receipts.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200 shadow-md">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                QR Code Check-in
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Fast check-in with QR codes, real-time attendance tracking, and session management.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group animate-slide-up" style={{animationDelay: '0.4s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200 shadow-md">
                <UserIcon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Speaker Management
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dedicated speaker portals, document uploads, session scheduling, and communication tools.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group animate-slide-up" style={{animationDelay: '0.5s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200 shadow-md">
                <ChartIcon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics & Reports
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Comprehensive reporting, attendance analytics, revenue tracking, and insights.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group animate-slide-up" style={{animationDelay: '0.6s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Communication Tools
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Email campaigns, automated reminders, SMS alerts, and segmented messaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-50 rounded-full border border-secondary-200 mb-4">
              <UserIcon className="w-5 h-5 text-secondary-600" />
              <span className="text-sm font-semibold text-secondary-700">Role-Based Access Control</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tailored Experiences for Every User
            </h3>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
              Secure, role-based dashboards with custom permissions and workflows for each user type.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Admin */}
            <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-purple-900 mb-2">Admins</h4>
              <p className="text-purple-700 text-sm leading-relaxed font-medium">
                Full platform control, user management, organizer approvals, and system configuration.
              </p>
            </div>

            {/* Organizers */}
            <div className="text-center bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6 shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-accent-200 hover:border-accent-400 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-accent-900 mb-2">Organizers</h4>
              <p className="text-accent-700 text-sm leading-relaxed font-medium">
                Create and manage events, track registrations, handle payments, and access analytics.
              </p>
            </div>

            {/* Speakers */}
            <div className="text-center bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-6 shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-secondary-200 hover:border-secondary-400 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-2">Speakers</h4>
              <p className="text-secondary-700 text-sm leading-relaxed font-medium">
                Dedicated portal for session schedules, materials upload, attendee Q&A, and bio management.
              </p>
            </div>

            {/* Staff & Volunteers */}
            <div className="text-center bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-primary-200 hover:border-primary-400 animate-slide-up" style={{animationDelay: '0.4s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-primary-900 mb-2">Staff & Volunteers</h4>
              <p className="text-primary-700 text-sm leading-relaxed font-medium">
                Task assignments, shift schedules, check-in management, and real-time coordination tools.
              </p>
            </div>

            {/* Attendees */}
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 animate-slide-up" style={{animationDelay: '0.5s'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TicketIcon className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-blue-900 mb-2">Attendees</h4>
              <p className="text-blue-700 text-sm leading-relaxed font-medium">
                Easy registration, digital tickets, personalized agendas, networking features, and event updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-secondary-600 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 animate-fade-in-up">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Event Professionals Worldwide
            </h3>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of organizations that have transformed their event management
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center transform hover:scale-110 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 animate-pulse">25K+</div>
              <div className="text-white/90 font-medium">Event Organizers</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 animate-pulse" style={{animationDelay: '0.5s'}}>500K+</div>
              <div className="text-white/90 font-medium">Events Hosted</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 animate-pulse" style={{animationDelay: '1s'}}>15M+</div>
              <div className="text-white/90 font-medium">Registrations Processed</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 animate-pulse" style={{animationDelay: '1.5s'}}>99.9%</div>
              <div className="text-white/90 font-medium">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-50 rounded-full border border-accent-200 mb-4">
              <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-accent-700">Loved by Event Professionals</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                &quot;At The Roc transformed how we manage our conferences. The attendee check-in system alone saved us hours of manual work.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">SM</div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Martinez</div>
                  <div className="text-sm text-gray-600">Conference Director</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                &quot;The analytics dashboard gives us real-time insights into our events. We can make data-driven decisions instantly.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center text-white font-bold">JC</div>
                <div>
                  <div className="font-semibold text-gray-900">James Chen</div>
                  <div className="text-sm text-gray-600">Event Manager</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                &quot;Best investment we made. The payment integration is seamless and our attendees love the mobile experience.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold">EP</div>
                <div>
                  <div className="font-semibold text-gray-900">Emily Parker</div>
                  <div className="text-sm text-gray-600">Festival Organizer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white rounded-full opacity-10 blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Events?
          </h3>
          <p className="text-xl text-white/95 mb-8 font-medium">
            Join thousands of event organizers who trust At The Roc for their registration needs.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-gray-50 font-semibold py-3 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
                <TicketIcon className="w-5 h-5" />
                Start Free Trial
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-primary-700 font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Sales
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">At The Roc</h4>
              <p className="text-gray-400 text-sm">
                Professional event registration and management platform.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Features</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Registration</a></li>
                <li><a href="#" className="hover:text-white">Payment Processing</a></li>
                <li><a href="#" className="hover:text-white">Check-in System</a></li>
                <li><a href="#" className="hover:text-white">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Support</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Company</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2025 At The Roc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}