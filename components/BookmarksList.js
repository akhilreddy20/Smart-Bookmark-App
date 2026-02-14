'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function BookmarksList({ onUpdate }) {
  const [bookmarks, setBookmarks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const supabase = createClient()


  const fetchBookmarks = async () => {
    try {
      setIsLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to view bookmarks')
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setBookmarks(data || [])
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
      setError('Failed to load bookmarks')
    } finally {
      setIsLoading(false)
    }
  }


  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }


      setBookmarks(bookmarks.filter(b => b.id !== id))
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      console.error('Error deleting bookmark:', err)
      alert('Failed to delete bookmark')

      fetchBookmarks()
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  const getDomain = (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }


  useEffect(() => {
    fetchBookmarks()


    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return


      const channel = supabase
        .channel('bookmarks-changes')
        .on(
          'postgres_changes',
          {
            event: '*', 
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            console.log('Real-time change detected:', payload)

            if (payload.eventType === 'INSERT') {
              setBookmarks((current) => [payload.new, ...current])
            } else if (payload.eventType === 'UPDATE') {

              setBookmarks((current) =>
                current.map((bookmark) =>
                  bookmark.id === payload.new.id ? payload.new : bookmark
                )
              )
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((current) =>
                current.filter((bookmark) => bookmark.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = setupRealtimeSubscription()

    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn())
    }
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Loading bookmarks...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-lg font-medium">No bookmarks yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first bookmark above to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">My Bookmarks</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates enabled"></div>
        </div>
      </div>

      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="group border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 animate-fadeIn"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors truncate">
                    {bookmark.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {getDomain(bookmark.url)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Added {formatDate(bookmark.created_at)}
                  </p>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Open bookmark"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete bookmark"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}