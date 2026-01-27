# Content Calendar - Setup Guide

Your team content calendar for X/Twitter, LinkedIn, and Paragraph.

## Quick Setup (15 minutes)

### Step 1: Set up Supabase Database

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/bvfhzeoqnesbobqqcmks

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy the entire contents of `schema.sql` and paste it into the editor

5. Click **Run** (or press Cmd+Enter)

You should see "Success. No rows returned" - that means it worked!

### Step 2: Enable Google Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**

2. Find **Google** and click to expand it

3. Toggle it **ON**

4. You'll need Google OAuth credentials:
   - Go to https://console.cloud.google.com/
   - Create a new project (or use existing)
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Choose **Web application**
   - Add these Authorized redirect URIs:
     ```
     https://bvfhzeoqnesbobqqcmks.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret**

5. Paste them into Supabase Google provider settings

6. Click **Save**

### Step 3: Deploy to Vercel

1. Create a GitHub repository and push this code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/content-calendar.git
   git push -u origin main
   ```

2. Go to https://vercel.com/new

3. Import your GitHub repository

4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://bvfhzeoqnesbobqqcmks.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_wgTqL590Vcq_WPifn5dlaw_jGa5G0ea`

5. Click **Deploy**

6. Once deployed, copy your Vercel URL (e.g., `content-calendar-xyz.vercel.app`)

### Step 4: Update Redirect URLs

1. Go back to Supabase > **Authentication** > **URL Configuration**

2. Update **Site URL** to your Vercel URL:
   ```
   https://your-app.vercel.app
   ```

3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```

4. Go to Google Cloud Console > Your OAuth Client

5. Add to Authorized redirect URIs:
   ```
   https://your-app.vercel.app/auth/callback
   ```

### Step 5: Regenerate Your Secret Key

Since your secret key was shared, regenerate it:

1. Supabase > **Settings** > **API Keys**
2. Click the three dots next to your secret key
3. Click **Regenerate**

---

## You're Done! 🎉

Your team can now:
1. Visit your Vercel URL
2. Click "Sign in with Google"
3. Start creating and scheduling content together

---

## Custom Domain (Optional)

Want `content.kinzey.xyz` instead of the Vercel URL?

1. In Vercel, go to your project > **Settings** > **Domains**
2. Add `content.kinzey.xyz`
3. Update your DNS records as instructed
4. Update Supabase Site URL and Redirect URLs
5. Update Google OAuth redirect URIs

---

## Features

- **Calendar, List, Kanban views** - See your content pipeline
- **X/Twitter, LinkedIn, Paragraph** - Web3-optimized channels
- **Content Pillars** - Organize by theme
- **Thread builder** - Create Twitter threads
- **Real-time sync** - Team sees updates instantly
- **Export to Notion/CSV** - Backup and share

---

## Troubleshooting

**"Invalid login credentials"**
- Check Google OAuth is enabled in Supabase
- Verify redirect URLs match exactly

**"No posts showing"**
- Run the schema.sql in Supabase SQL Editor
- Check RLS policies are created

**Changes not syncing**
- Verify realtime is enabled (last line of schema.sql)
- Check browser console for errors

---

## Need Help?

Open an issue or reach out. Happy scheduling! 📅
