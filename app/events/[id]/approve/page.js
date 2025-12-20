'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ApproveEventPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/events/${params.id}`, { credentials: 'include' })
        if (res.status === 401) return router.push('/login')
        if (res.status === 403) return router.push('/unauthorized')
        if (!res.ok) throw new Error('Failed to load event')
        const { event } = await res.json()
        setEvent(event)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, router])

  const handleAction = async (action) => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${params.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, notes: notes || null })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to update approval')
      }
      router.push('/events?filter=pending_approval')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="text-gray-700">Event not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Event</h1>
            <p className="text-sm text-gray-600">{event.name}</p>
          </div>
          <Link href={`/events/${params.id}`} className="text-primary hover:text-primary-600 text-sm font-medium">
            ← Back to event
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-6 space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Approval Notes</h2>
            <p className="text-sm text-gray-600 mb-3">Add an optional note for the organizer.</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="input"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={submitting}
              onClick={() => handleAction('approve')}
              className="btn-primary"
            >
              {submitting ? 'Saving...' : 'Approve'}
            </button>
            <button
              disabled={submitting}
              onClick={() => handleAction('reject')}
              className="btn-secondary text-red-600 border-red-200"
            >
              {submitting ? 'Saving...' : 'Reject'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
