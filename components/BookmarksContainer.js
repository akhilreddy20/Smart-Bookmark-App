'use client'

import AddBookmarkForm from './AddBookmarkForm'
import BookmarksList from './BookmarksList'

export default function BookmarksContainer() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <AddBookmarkForm />
      </div>
      <div className="lg:col-span-2">
        <BookmarksList />
      </div>
    </div>
  )
}