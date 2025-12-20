'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ArrowLeftIcon } from '@/components/ui/Icons'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [eventData, setEventData] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    venue: '',
    address: '',
    city: '',
    country: '',
    capacity: '',
    banner_url: '',
    status: 'draft',
    is_virtual: false,
    virtual_platform: '',
    virtual_url: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }
        const profile = await getUserProfile(user.id)
        setUserRole(profile?.role)

        const res = await fetch(`/api/events/${params.id}`, { credentials: 'include' })
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          router.push('/unauthorized')
          return
        }
        if (!res.ok) {
          setError('Failed to load event')
          return
        }
        const { event } = await res.json()
        setEventData(event)
        setForm({
          name: event.name || '',
          description: event.description || '',
          start_date: event.start_date ? event.start_date.slice(0, 16) : '',
          end_date: event.end_date ? event.end_date.slice(0, 16) : '',
          venue: event.venue || '',
          address: event.address || '',
          city: event.city || '',
          country: event.country || '',
          capacity: event.capacity ?? '',
          banner_url: event.banner_url || '',
          status: event.status || 'draft',
          is_virtual: event.is_virtual || false,
          virtual_platform: event.virtual_platform || '',
          virtual_url: event.virtual_url || ''
        })
      } catch (err) {
        setError('Error loading event')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, router])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        venue: form.venue,
        address: form.address,
        city: form.city,
        country: form.country,
        capacity: form.capacity === '' ? null : Number(form.capacity),
        banner_url: form.banner_url,
        status: form.status,
        is_virtual: form.is_virtual,
        virtual_platform: form.virtual_platform,
        virtual_url: form.virtual_url
      }

      const res = await fetch(`/api/events/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save event')
      }

      router.push(`/events/${params.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100">
      <header className="bg-white shadow-md border-b border-primary-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href={userRole === 'admin' ? '/events' : '/organizer/events'} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Edit Event
              </h1>
              {eventData && (
                <p className="text-gray-600 mt-1">Current status: <span className="font-medium">{eventData.status}</span></p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start</label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End</label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
            </div>

            {/* Virtual Event Toggle */}
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id="is_virtual"
                name="is_virtual"
                checked={form.is_virtual}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="is_virtual" className="text-sm font-medium text-gray-700">
                This is a virtual event
              </label>
            </div>

            {form.is_virtual ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Virtual Platform</label>
                  <input
                    type="text"
                    name="virtual_platform"
                    value={form.virtual_platform}
                    onChange={handleChange}
                    placeholder="Zoom, Google Meet, Teams, etc."
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Virtual Event URL</label>
                  <input
                    type="url"
                    name="virtual_url"
                    value={form.virtual_url}
                    onChange={handleChange}
                    placeholder="https://zoom.us/j/..."
                    className="input"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <input
                    type="text"
                    name="venue"
                    value={form.venue}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  className="input"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner URL</label>
                <input
                  type="text"
                  name="banner_url"
                  value={form.banner_url}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            {eventData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="registration_open">Registration Open</option>
                  <option value="registration_closed">Registration Closed</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            <div className="border-t pt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link 
                href={userRole === 'admin' ? '/events' : '/organizer/events'}
                className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}