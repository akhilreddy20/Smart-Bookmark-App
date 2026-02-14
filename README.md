# 🔖 Smart Bookmark App

A modern, real-time bookmark management application built with Next.js, Supabase, and Google OAuth. Save, organize, and access your bookmarks from anywhere with instant synchronization across all your devices.

## ✨ Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with your Google account
- 📚 **Bookmark Management** - Add, view, and delete bookmarks easily  
- ⚡ **Real-time Sync** - Changes appear instantly across all tabs and devices
- 🔒 **Private & Secure** - Your bookmarks are completely private with Row Level Security
- 📱 **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, professional interface with smooth animations
- 🌐 **Multi-device Support** - Access your bookmarks from anywhere

## 🚀 Live Demo
https://smart-bookmark-app-seven-jet.vercel.app

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, JavaScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Google OAuth 2.0
- **Real-time:** Supabase Realtime
- **Deployment:** Vercel

## 📋 Prerequisites

- Node.js 18+ installed
- A Google Cloud Console account
- A Supabase account
- A Vercel account (for deployment)

## 🔧 Local Development Setup

### 1. Clone & Install

```bash
git clone https://github.com/akhilreddy20/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

### 2. Set Up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run the SQL migration (see `supabase/migrations/001_create_bookmarks_table.sql`)
3. Enable Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;`
4. Get credentials from Settings → API

### 3. Set Up Google OAuth

1. Create OAuth 2.0 Client at [Google Cloud Console](https://console.cloud.google.com)
2. Added redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://smart-bookmark-app-seven-jet.vercel.app/auth/google/callback`

### 4. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000]




#### 1. Pushed to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/akhilreddy20/smart-bookmark-app.git
git push -u origin main
```

#### 2. Deployed on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Imported the project GitHub repository
3. Configure project:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   ```
5.  Deployed

#### 3. Updated Google OAuth

After deployment added the deployemnet url

1. Authorized JavaScript origins: `https://smart-bookmark-app-seven-jet.vercel.app`
2. Authorized redirect URIs: `https://smart-bookmark-app-seven-jet.vercel.app/auth/google/callback`


## 🐛 Problems Encountered & Solutions

### Problem 1: OAuth Showing Supabase URL Instead of App Name

**Issue:** Google OAuth consent screen displayed "Continue to lmzfpifsazqdlgwpensg.supabase.co" instead of "Smart Bookmark App"

**Root Cause:** 
- Supabase's built-in OAuth redirects through Supabase servers
- Google displays the redirect URI domain in the consent screen
- Cannot customize this when using Supabase OAuth proxy

**Solution Attempted:**
- Implemented direct Google OAuth instead of Supabase OAuth
- Created custom callback handler at `/auth/google/callback/route.js`
- Changed redirect URI to point directly to our domain

**Code Changes:**
```javascript
// Before (Supabase OAuth)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${origin}/auth/callback` }
})

// After (Direct OAuth)
const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
googleAuthUrl.searchParams.append('client_id', clientId)
googleAuthUrl.searchParams.append('redirect_uri', `${origin}/auth/google/callback`)
window.location.href = googleAuthUrl.toString()
```

**Partial Resolution:**
- In development (localhost), still shows project URL
- **In production with custom domain**, shows properly as "Smart Bookmark App"
- Updated OAuth Consent Screen with app name and logo

**Final Takeaway:** This is a known limitation with localhost development. Once deployed to a production domain, the OAuth screen displays correctly.

### Problem 2: Real-time Updates Not Working Across Tabs

**Issue:** Adding a bookmark in one browser tab didn't appear in other tabs without manual refresh

**Root Cause:**
- Realtime replication not enabled for bookmarks table
- No WebSocket subscription in client code
- Manual refresh logic wasn't triggering properly

**Solution:**
1. **Enabled Realtime in Supabase:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
   ```

2. **Implemented Real-time Subscription:**
   ```javascript
   const channel = supabase
     .channel('bookmarks-changes')
     .on('postgres_changes', {
       event: '*', // INSERT, UPDATE, DELETE
       schema: 'public',
       table: 'bookmarks',
       filter: `user_id=eq.${user.id}`
     }, (payload) => {
       if (payload.eventType === 'INSERT') {
         setBookmarks((current) => [payload.new, ...current])
       } else if (payload.eventType === 'DELETE') {
         setBookmarks((current) => 
           current.filter((b) => b.id !== payload.old.id)
         )
       }
     })
     .subscribe()
   ```

3. **Added cleanup on unmount:**
   ```javascript
   return () => {
     supabase.removeChannel(channel)
   }
   ```


### Problem 3: Privacy - Users Seeing Each Other's Data

**Issue:** Needed to ensure User A cannot see User B's bookmarks

**Root Cause:** PostgreSQL tables are open by default - anyone with database access can query all rows

**Solution - Row Level Security (RLS):**

1. **Enabled RLS:**
   ```sql
   ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
   ```

2. **Created Policies:**
   ```sql
   -- View own bookmarks only
   CREATE POLICY "Users can view their own bookmarks"
     ON bookmarks FOR SELECT 
     USING (auth.uid() = user_id);

   -- Insert only for themselves
   CREATE POLICY "Users can insert their own bookmarks"
     ON bookmarks FOR INSERT 
     WITH CHECK (auth.uid() = user_id);

   -- Update and Delete policies similar
   ```

3. **Tested with Multiple Accounts:**
   - Signed in as User A, added bookmarks
   - Signed in as User B (different browser)
   - Verified User B sees zero bookmarks from User A
   - Tested across all CRUD operations

**Result:** Complete data isolation - users can only access their own bookmarks

**Security Level:** Database-enforced (cannot be bypassed from client code)

### Problem 4: redirect_uri_mismatch Error

**Issue:** Getting "Error 400: redirect_uri_mismatch" when signing in with Google

**Root Cause:**
- Redirect URIs must match EXACTLY (including http/https, trailing slashes)
- Missing redirect URI configuration in Google Cloud Console
- Confusion between development and production URLs

**Solution:**

1. **Added Both URLs to Google Console:**
   ```
   Development: http://localhost:3000/auth/google/callback
   Production: https://smart-bookmark-app-seven-jet.vercel.app/
   ```

2. **Added Authorized JavaScript Origins:**
   ```
   http://localhost:3000
   https://smart-bookmark-app-seven-jet.vercel.app/
   ```

3. **Updated Supabase Site URL:**
   - Development: `http://localhost:3000`
   - Production: `https://smart-bookmark-app-seven-jet.vercel.app`

4. **Created Clear Documentation:**
   - Exact format requirements
   - Common mistakes to avoid
   - Troubleshooting guide

**Result:** OAuth works seamlessly in both dev and production

**Prevention Tips:**
- Always use exact URLs (copy-paste, don't type)
- Test in incognito window after changes
- Wait 5-10 minutes for Google to propagate changes


### Problem 6: Bookmarks Disappearing After Page Refresh (Early Bug)

**Issue:** In initial development, added bookmarks would disappear after refreshing

**Root Cause:**
- Stored bookmarks only in React state
- Forgot to actually save to Supabase database
- Was testing UI before implementing backend

**Solution:**

1. **Proper Database Integration:**

   const { data, error } = await supabase
     .from('bookmarks')
     .insert([{ user_id, url, title }])
   
   if (error) throw error
   


2. **Added Error Handling:**
   try {
     await saveBookmark()
     setSuccess(true)
   } catch (err) {
     setError(err.message)
     // Don't update UI if database save failed
   }

3. **Implemented Loading States:**
   - Shows spinner while fetching
   - Prevents user actions during save
   - Gives feedback on success/failure

**Result:** Bookmarks persist correctly across page refreshes ✅

**Best Practice:** Always save to database before updating UI state

## 📁 Project Structure

```
smart-bookmark-app/
├── app/
│   ├── auth/
│   │   └── google/callback/    # OAuth callback handler
│   ├── globals.css             # Global styles + animations
│   ├── layout.js               # Root layout
│   └── page.js                 # Main page
├── components/
│   ├── AddBookmarkForm.js      # Add bookmark form
│   ├── BookmarksList.js        # List with real-time
│   ├── BookmarksContainer.js   # Container component
│   ├── LoginButton.js          # Google OAuth button
│   └── LogoutButton.js         # Sign out button
├── utils/supabase/
│   ├── client.js               # Client-side Supabase
│   └── server.js               # Server-side Supabase
├── supabase/migrations/
│   └── 001_create_bookmarks_table.sql
├── middleware.js               # Session refresh
├── .env.local                  # Environment variables
├── .env.example                # Template
└── package.json
```

## 🔒 Security Features

- ✅ Row Level Security (RLS) - Database-level access control
- ✅ Google OAuth 2.0 - Secure authentication
- ✅ Server-side validation - Middleware checks
- ✅ Environment variables - Secrets protected
- ✅ HTTPS in production - Encrypted connections
- ✅ SQL injection prevention - Parameterized queries

## 🧪 Testing Checklist

- [ ] User can sign in with Google
- [ ] User can add bookmarks
- [ ] User can delete bookmarks
- [ ] Bookmarks persist after refresh
- [ ] Real-time works across tabs
- [ ] User A can't see User B's data
- [ ] Works on mobile
- [ ] OAuth works in production

## 📚 Documentation

Additional guides available in the project:

- `BOOKMARK_FEATURE_SETUP.md` - Bookmark functionality setup
- `REALTIME_SETUP.md` - Real-time configuration
- `PRIVACY_EXPLANATION.md` - Security implementation
- `DIRECT_OAUTH_SETUP.md` - OAuth configuration
- `DEPLOYMENT_GUIDE.md` - Detailed deployment steps

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/Amazing`)
3. Commit changes (`git commit -m 'Add Amazing'`)
4. Push to branch (`git push origin feature/Amazing`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 👤 Author

- Name: Akhil REDDY
- GitHub:https://github.com/akhilreddy20

## 🙏 Acknowledgments

- Next.js - React framework
- Supabase - Backend platform
- Tailwind CSS - Styling
- Vercel - Hosting
- Google - OAuth provider

## 🗺️ Roadmap

### ✅ Completed
- Google OAuth authentication
- Add/delete bookmarks
- Real-time synchronization
- Private user data with RLS
- Responsive design
- Production deployment

### 🔜 Planned
- [ ] Edit bookmarks
- [ ] Search functionality
- [ ] Tags and categories
- [ ] Bookmark folders
- [ ] Export/import
- [ ] Dark mode
- [ ] Browser extension

---

Made with ❤️ using Next.js and Supabase