import { createClient } from '@/utils/supabase/server'
import LoginButton from '@/components/LoginButton'
import LogoutButton from '@/components/LogoutButton'
import BookmarksContainer from '@/components/BookmarksContainer'

export default async function Home() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Bookmark App
              </h1>
              <p className="text-sm text-gray-500 mt-1">Save and organize your bookmarks intelligently</p>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">{user.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-blue-100"
                  />
                )}
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? (
          <BookmarksContainer />
        ) : (
          <div className="max-w-md mx-auto mt-20">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center space-y-6">
                <div>
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold mb-3 text-gray-800">Get Started</h2>
                  <p className="text-gray-600 text-base">
                    Sign in with your Google account to start saving your bookmarks
                  </p>
                </div>
                <div className="flex justify-center">
                  <LoginButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}