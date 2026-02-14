'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function AddBookmarkForm() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    // Validate inputs
    if (!url.trim() || !title.trim()) {
      setError('Both URL and title are required')
      setIsLoading(false)
      return
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)')
      setIsLoading(false)
      return
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to add bookmarks')
        setIsLoading(false)
        return
      }

      // Insert bookmark - real-time will automatically update the list!
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert([
          {
            user_id: user.id,
            url: url.trim(),
            title: title.trim(),
          }
        ])

      if (insertError) {
        throw insertError
      }

      // Success!
      setSuccess(true)
      setUrl('')
      setTitle('')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)

    } catch (err) {
      console.error('Error adding bookmark:', err)
      setError(err.message || 'Failed to add bookmark. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Bookmark</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800"
            disabled={isLoading}
          />
        </div>

        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Awesome Website"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800"
            disabled={isLoading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Bookmark added! Updates live across all tabs.
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding...' : 'Add Bookmark'}
        </button>
      </form>
    </div>
  )
}