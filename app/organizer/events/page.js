'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function OrganizerEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', filter: 'all' })

  useEffect(() => {
    loadEvents(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadEvents = async (opts) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        filter: opts.filter,
        search: opts.search
      })

      const res = await fetch(`/api/events?${params.toString()}`, {
        credentials: 'include'
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load events')
      }

      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    loadEvents(next)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
            <p className="text-gray-600">Create, review, and manage your events</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-outline">← Dashboard</Link>
            <Link href="/events/create" className="btn-primary">+ Create Event</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'draft', label: 'Draft' },
              { key: 'published', label: 'Published' }
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleFilterChange('filter', opt.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.filter === opt.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name or description"
              className="input"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-white border border-green-100 rounded-lg p-10 text-center text-gray-600">
            No events found. Create your first event to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white border border-green-100 rounded-lg p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                    <p className="text-sm text-gray-600">{event.description || 'No description provided'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span>📅 {formatDate(event.start_date)}</span>
                      <span>📍 {event.venue || 'Venue TBA'}</span>
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{event.status}</span>
                      {event.approval_status && (
                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                          {event.approval_status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm font-medium text-right min-w-[140px]">
                    <Link href={`/events/${event.id}`} className="text-primary hover:text-primary-600">View</Link>
                    <Link href={`/events/${event.id}/edit`} className="text-blue-600 hover:text-blue-700">Edit</Link>
                    {event.status === 'draft' && (
                      <button
                        onClick={async () => {
                          if (!confirm('Delete this draft event?')) return
                          try {
                            const res = await fetch(`/api/events/${event.id}`, {
                              method: 'DELETE',
                              credentials: 'include'
                            })
                            if (!res.ok) {
                              const body = await res.json().catch(() => ({}))
                              throw new Error(body.error || 'Delete failed')
                            }
                            setEvents((prev) => prev.filter((e) => e.id !== event.id))
                          } catch (err) {
                            alert(err.message)
                          }
                        }}
                        className="text-red-600 hover:text-red-700 text-left"
                      >
                        Delete draft
                      </button>
                    )}
                    {event.approval_status === 'pending_approval' && (
                      <span className="text-xs text-yellow-700">Awaiting admin approval</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
