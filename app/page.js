'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">EventReg</h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="btn-primary">
                    Dashboard
                  </Link>
                  <Link href="/events" className="btn-outline">
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-gray-600 hover:text-primary font-medium">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Professional Event
            <span className="text-primary"> Registration</span> &
            <span className="text-secondary"> Management</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your event registration process with our comprehensive platform. 
            From attendee management to speaker portals, we've got you covered.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-3">
                Start Free Trial
              </Link>
              <Link href="/demo" className="btn-secondary text-lg px-8 py-3">
                View Demo
              </Link>
            </div>
          )}

          {user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
                Go to Dashboard
              </Link>
              <Link href="/events/create" className="btn-secondary text-lg px-8 py-3">
                Create Event
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Successful Events
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to manage events from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature cards */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎫</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Registration
              </h4>
              <p className="text-gray-600 text-sm">
                Multiple ticket types, group registrations, early bird pricing, and custom forms.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Secure Payments
              </h4>
              <p className="text-gray-600 text-sm">
                Integrated payment processing, invoicing, discount codes, and automated receipts.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                QR Code Check-in
              </h4>
              <p className="text-gray-600 text-sm">
                Fast check-in with QR codes, real-time attendance tracking, and session management.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎤</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Speaker Management
              </h4>
              <p className="text-gray-600 text-sm">
                Dedicated speaker portals, document uploads, session scheduling, and communication tools.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics & Reports
              </h4>
              <p className="text-gray-600 text-sm">
                Comprehensive reporting, attendance analytics, revenue tracking, and insights.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Communication Tools
              </h4>
              <p className="text-gray-600 text-sm">
                Email campaigns, automated reminders, SMS alerts, and segmented messaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Built for Every Role
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tailored experiences for organizers, speakers, staff, and attendees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                👨‍💼
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Event Organizers</h4>
              <p className="text-gray-600 text-sm">
                Complete event management dashboard with full control over all aspects.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🎤
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Speakers</h4>
              <p className="text-gray-600 text-sm">
                Dedicated portal for session management, materials, and communication.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                👷‍♀️
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Staff & Volunteers</h4>
              <p className="text-gray-600 text-sm">
                Schedule management, task assignments, and real-time coordination tools.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🎯
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Attendees</h4>
              <p className="text-gray-600 text-sm">
                Simple registration, digital tickets, and personalized event experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Events?
          </h3>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of event organizers who trust EventReg for their registration needs.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-primary hover:bg-gray-50 font-semibold py-3 px-8 rounded-lg transition-colors">
                Start Free Trial
              </Link>
              <Link href="/contact" className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold py-3 px-8 rounded-lg transition-colors">
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
              <h4 className="text-lg font-semibold mb-4">EventReg</h4>
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
            © 2025 EventReg. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}