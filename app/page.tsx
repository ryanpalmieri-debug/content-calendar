'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Calendar, Plus, X, Twitter, Linkedin, FileText, Copy, Check, 
  ChevronLeft, ChevronRight, Edit2, Trash2, Clock, Send, Sparkles, 
  Zap, RefreshCw, Eye, Hash, TrendingUp, Layers, BarChart3, 
  Download, ChevronDown, Loader2, LogOut, Users
} from 'lucide-react'

const CHANNELS = {
  twitter: { 
    name: 'X/Twitter', 
    icon: Twitter, 
    color: 'bg-zinc-900', 
    accent: '#1DA1F2',
    charLimit: 280,
    bestTimes: ['7:00 AM', '12:00 PM', '5:00 PM', '9:00 PM'],
    web3Times: ['9:00 AM EST', '2:00 PM EST', '8:00 PM EST'],
    tips: 'Hook in first line. Use line breaks. End with CTA or question.'
  },
  linkedin: { 
    name: 'LinkedIn', 
    icon: Linkedin, 
    color: 'bg-blue-700',
    accent: '#0A66C2', 
    charLimit: 3000,
    bestTimes: ['7:30 AM', '12:00 PM', '5:30 PM'],
    web3Times: ['8:00 AM EST', '12:00 PM EST', '6:00 PM EST'],
    tips: 'Strong hook. Personal story + insight. Professional but human.'
  },
  paragraph: { 
    name: 'Paragraph', 
    icon: FileText, 
    color: 'bg-violet-600',
    accent: '#7C3AED', 
    charLimit: null,
    bestTimes: ['Tuesday 10 AM', 'Thursday 10 AM'],
    web3Times: ['Tuesday/Thursday morning EST'],
    tips: 'Long-form essays. Web3 native audience. Can include token-gating.'
  }
}

const CONTENT_PILLARS = [
  { id: 'thought-leadership', name: 'Thought Leadership', color: 'bg-amber-500', icon: '💡' },
  { id: 'industry-insights', name: 'Industry Insights', color: 'bg-blue-500', icon: '📊' },
  { id: 'personal-brand', name: 'Personal Brand', color: 'bg-rose-500', icon: '🎯' },
  { id: 'engagement', name: 'Engagement/Community', color: 'bg-green-500', icon: '💬' },
  { id: 'promotional', name: 'Promotional', color: 'bg-purple-500', icon: '🚀' },
  { id: 'educational', name: 'Educational', color: 'bg-cyan-500', icon: '📚' }
]

const STATUS_CONFIG = {
  idea: { label: 'Idea', color: 'bg-zinc-700 text-zinc-300', dot: 'bg-zinc-400' },
  draft: { label: 'Draft', color: 'bg-amber-900/50 text-amber-300', dot: 'bg-amber-400' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-900/50 text-blue-300', dot: 'bg-blue-400' },
  published: { label: 'Published', color: 'bg-emerald-900/50 text-emerald-300', dot: 'bg-emerald-400' }
}

const WEB3_HASHTAGS = {
  twitter: ['#Web3', '#AI', '#Crypto', '#DeFi', '#NFTs', '#Blockchain', '#BuildInPublic', '#AIAgents', '#LLMs', '#DAOs'],
  linkedin: ['#Web3', '#ArtificialIntelligence', '#Innovation', '#FutureOfWork', '#Blockchain', '#DigitalTransformation'],
  paragraph: []
}

type Post = {
  id: string
  title: string
  content: string
  channel: string
  scheduled_date: string | null
  scheduled_time: string
  status: string
  hashtags: string
  notes: string
  pillar: string
  is_thread: boolean
  thread_posts: string[]
  created_by: string
  created_by_email: string
  created_at: string
  updated_at: string
}

const emptyForm = {
  title: '',
  content: '',
  channel: 'twitter',
  scheduled_date: '',
  scheduled_time: '09:00',
  status: 'draft',
  hashtags: '',
  notes: '',
  pillar: '',
  is_thread: false,
  thread_posts: ['']
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState('calendar')
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterPillar, setFilterPillar] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('compose')
  const [formData, setFormData] = useState(emptyForm)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  
  const supabase = createClient()

  // Check auth state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load posts from Supabase
  useEffect(() => {
    if (!user) return
    
    const loadPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setPosts(data)
    }
    
    loadPosts()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadPosts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Load team members
  useEffect(() => {
    if (!user) return
    
    const loadTeam = async () => {
      const { data } = await supabase
        .from('posts')
        .select('created_by_email')
      
      if (data) {
        const unique = [...new Set(data.map(p => p.created_by_email))]
        setTeamMembers(unique)
      }
    }
    
    loadTeam()
  }, [user, posts])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const getPostsForDate = (date: Date | null) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return posts.filter(post => {
      const matchesDate = post.scheduled_date === dateStr
      const matchesChannel = filterChannel === 'all' || post.channel === filterChannel
      const matchesPillar = filterPillar === 'all' || post.pillar === filterPillar
      return matchesDate && matchesChannel && matchesPillar
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const postData = {
      title: formData.title,
      content: formData.content,
      channel: formData.channel,
      scheduled_date: formData.scheduled_date || null,
      scheduled_time: formData.scheduled_time,
      status: formData.status,
      hashtags: formData.hashtags,
      notes: formData.notes,
      pillar: formData.pillar,
      is_thread: formData.is_thread,
      thread_posts: formData.thread_posts,
      created_by: user.id,
      created_by_email: user.email
    }

    if (editingPost) {
      await supabase
        .from('posts')
        .update(postData)
        .eq('id', editingPost.id)
    } else {
      await supabase
        .from('posts')
        .insert([postData])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingPost(null)
    setShowModal(false)
    setActiveTab('compose')
  }

  const editPost = (post: Post) => {
    setFormData({
      title: post.title,
      content: post.content,
      channel: post.channel,
      scheduled_date: post.scheduled_date || '',
      scheduled_time: post.scheduled_time,
      status: post.status,
      hashtags: post.hashtags,
      notes: post.notes,
      pillar: post.pillar,
      is_thread: post.is_thread,
      thread_posts: post.thread_posts || ['']
    })
    setEditingPost(post)
    setShowModal(true)
  }

  const deletePost = async (id: string) => {
    if (confirm('Delete this post?')) {
      await supabase.from('posts').delete().eq('id', id)
    }
  }

  const duplicatePost = async (post: Post) => {
    if (!user) return
    
    await supabase.from('posts').insert([{
      title: `${post.title} (copy)`,
      content: post.content,
      channel: post.channel,
      scheduled_date: null,
      scheduled_time: post.scheduled_time,
      status: 'draft',
      hashtags: post.hashtags,
      notes: post.notes,
      pillar: post.pillar,
      is_thread: post.is_thread,
      thread_posts: post.thread_posts,
      created_by: user.id,
      created_by_email: user.email
    }])
  }

  const exportToNotion = () => {
    const markdown = `# Content Calendar Export
_Exported: ${new Date().toLocaleDateString()}_

---

${posts.map(post => {
  const pillarObj = CONTENT_PILLARS.find(p => p.id === post.pillar)
  return `## ${post.title || 'Untitled'}

| Property | Value |
|----------|-------|
| Channel | ${CHANNELS[post.channel as keyof typeof CHANNELS]?.name || post.channel} |
| Status | ${STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG]?.label || post.status} |
| Date | ${post.scheduled_date || 'Not scheduled'} ${post.scheduled_time || ''} |
| Pillar | ${pillarObj?.name || 'None'} ${pillarObj?.icon || ''} |
| Created by | ${post.created_by_email} |
${post.hashtags ? `| Hashtags | ${post.hashtags} |` : ''}

### Content
${post.is_thread ? post.thread_posts?.map((t: string, i: number) => `**Tweet ${i + 1}:** ${t}`).join('\n\n') : post.content}

${post.notes ? `### Notes\n${post.notes}` : ''}

---
`
}).join('\n')}`
    
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportCSV = () => {
    const headers = ['Title', 'Content', 'Channel', 'Date', 'Time', 'Status', 'Pillar', 'Hashtags', 'Created By', 'Notes']
    const rows = posts.map(post => [
      post.title,
      post.is_thread ? post.thread_posts?.join(' | ') : post.content.replace(/"/g, '""'),
      CHANNELS[post.channel as keyof typeof CHANNELS]?.name || post.channel,
      post.scheduled_date || '',
      post.scheduled_time,
      STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG]?.label || post.status,
      CONTENT_PILLARS.find(p => p.id === post.pillar)?.name || '',
      post.hashtags,
      post.created_by_email,
      post.notes
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content-calendar-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const days = getDaysInMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const charCount = formData.is_thread 
    ? formData.thread_posts.reduce((sum, t) => sum + (t?.length || 0), 0)
    : formData.content.length
  const channelConfig = CHANNELS[formData.channel as keyof typeof CHANNELS]
  const charLimit = channelConfig?.charLimit
  const isOverLimit = charLimit && !formData.is_thread && charCount > charLimit
  const ChannelIcon = channelConfig?.icon || FileText

  // Stats
  const totalPosts = posts.length
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length
  const publishedPosts = posts.filter(p => p.status === 'published').length
  const thisWeekPosts = posts.filter(p => {
    if (!p.scheduled_date) return false
    const postDate = new Date(p.scheduled_date)
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return postDate >= now && postDate <= weekFromNow
  }).length

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  // Auth screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Content Calendar</h1>
            <p className="text-zinc-500">Web3 • AI • Thought Leadership</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-lg font-semibold mb-4 text-center">Sign in to continue</h2>
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-zinc-900 rounded-xl font-medium hover:bg-zinc-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <p className="mt-6 text-center text-sm text-zinc-500">
              Team members will see the shared calendar once they sign in
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main app
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Content Calendar</h1>
                <p className="text-sm text-zinc-500">Web3 • AI • Thought Leadership</p>
              </div>
            </div>
            
            {/* Stats Pills */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <div className="px-3 py-1.5 bg-zinc-800 rounded-full flex items-center gap-2">
                <span className="text-zinc-400">Total</span>
                <span className="font-medium">{totalPosts}</span>
              </div>
              <div className="px-3 py-1.5 bg-blue-900/30 rounded-full flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span className="text-blue-300">{scheduledPosts} scheduled</span>
              </div>
              <div className="px-3 py-1.5 bg-emerald-900/30 rounded-full flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-300">{publishedPosts} published</span>
              </div>
              <div className="px-3 py-1.5 bg-violet-900/30 rounded-full flex items-center gap-2">
                <Users className="w-3 h-3 text-violet-400" />
                <span className="text-violet-300">{teamMembers.length} contributors</span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">{user.email}</span>
              <button
                onClick={signOut}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">All Channels</option>
              {Object.entries(CHANNELS).map(([key, ch]) => (
                <option key={key} value={key}>{ch.name}</option>
              ))}
            </select>
            
            <select
              value={filterPillar}
              onChange={(e) => setFilterPillar(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">All Pillars</option>
              {CONTENT_PILLARS.map(pillar => (
                <option key={pillar.id} value={pillar.id}>{pillar.icon} {pillar.name}</option>
              ))}
            </select>
            
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              {['calendar', 'list', 'board'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-2 text-sm capitalize transition-colors ${
                    view === v 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div id="export-menu" className="hidden absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
                  <button onClick={exportToNotion} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Copy for Notion
                  </button>
                  <button onClick={exportCSV} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg hover:opacity-90 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {copied && (
          <div className="fixed top-20 right-6 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
            <Check className="w-4 h-4" /> Copied to clipboard!
          </div>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">{monthYear}</h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-zinc-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-zinc-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayPosts = getPostsForDate(day)
                const isToday = day && day.toDateString() === new Date().toDateString()
                
                return (
                  <div
                    key={idx}
                    className={`min-h-[120px] p-2 border-b border-r border-zinc-800/50 transition-colors ${
                      !day ? 'bg-zinc-950' : 'hover:bg-zinc-800/30'
                    } ${isToday ? 'bg-violet-900/20' : ''}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm mb-2 ${isToday ? 'font-bold text-violet-400' : 'text-zinc-500'}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayPosts.slice(0, 3).map(post => {
                            const Channel = CHANNELS[post.channel as keyof typeof CHANNELS]
                            const Icon = Channel?.icon || FileText
                            return (
                              <div
                                key={post.id}
                                onClick={() => editPost(post)}
                                className={`flex items-center gap-1.5 p-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${Channel?.color || 'bg-zinc-700'} text-white`}
                              >
                                <Icon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate flex-1">{post.title || 'Untitled'}</span>
                                {post.is_thread && <Layers className="w-3 h-3 flex-shrink-0 opacity-70" />}
                              </div>
                            )
                          })}
                          {dayPosts.length > 3 && (
                            <div className="text-xs text-zinc-500 pl-1">+{dayPosts.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {posts.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500">No posts yet. Click "New Post" to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {posts
                  .filter(p => filterChannel === 'all' || p.channel === filterChannel)
                  .filter(p => filterPillar === 'all' || p.pillar === filterPillar)
                  .sort((a, b) => new Date(a.scheduled_date || '9999').getTime() - new Date(b.scheduled_date || '9999').getTime())
                  .map(post => {
                    const Channel = CHANNELS[post.channel as keyof typeof CHANNELS]
                    const Icon = Channel?.icon || FileText
                    const pillar = CONTENT_PILLARS.find(p => p.id === post.pillar)
                    const status = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG]
                    
                    return (
                      <div key={post.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`p-2.5 rounded-xl ${Channel?.color || 'bg-zinc-700'} text-white`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-medium truncate">{post.title || 'Untitled'}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${status?.color || 'bg-zinc-700'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${status?.dot || 'bg-zinc-400'}`}></span>
                                  {status?.label || post.status}
                                </span>
                                {pillar && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${pillar.color} text-white`}>
                                    {pillar.icon} {pillar.name}
                                  </span>
                                )}
                                {post.is_thread && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-700 text-zinc-300 flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> Thread ({post.thread_posts?.length || 0})
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-zinc-400 line-clamp-2 mb-2">
                                {post.is_thread ? post.thread_posts?.[0] : post.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-zinc-500">
                                {post.scheduled_date && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {post.scheduled_date} {post.scheduled_time}
                                  </span>
                                )}
                                <span>by {post.created_by_email}</span>
                                {post.hashtags && (
                                  <span className="text-violet-400 truncate max-w-[200px]">{post.hashtags}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => duplicatePost(post)}
                              className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-white transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editPost(post)}
                              className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="p-2 hover:bg-red-900/50 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* Board View (Kanban) */}
        {view === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(STATUS_CONFIG).map(([statusKey, statusConfig]) => {
              const statusPosts = posts
                .filter(p => p.status === statusKey)
                .filter(p => filterChannel === 'all' || p.channel === filterChannel)
                .filter(p => filterPillar === 'all' || p.pillar === filterPillar)
              
              return (
                <div key={statusKey} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                  <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                      <span className="font-medium text-sm">{statusConfig.label}</span>
                    </div>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {statusPosts.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                    {statusPosts.map(post => {
                      const Channel = CHANNELS[post.channel as keyof typeof CHANNELS]
                      const Icon = Channel?.icon || FileText
                      const pillar = CONTENT_PILLARS.find(p => p.id === post.pillar)
                      
                      return (
                        <div
                          key={post.id}
                          onClick={() => editPost(post)}
                          className="p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 rounded ${Channel?.color || 'bg-zinc-600'}`}>
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                            {pillar && <span className="text-xs">{pillar.icon}</span>}
                            {post.is_thread && <Layers className="w-3 h-3 text-zinc-500" />}
                          </div>
                          <h4 className="text-sm font-medium mb-1 line-clamp-2">{post.title || 'Untitled'}</h4>
                          <p className="text-xs text-zinc-500 line-clamp-2">
                            {post.is_thread ? post.thread_posts?.[0] : post.content}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            {post.scheduled_date && (
                              <div className="text-xs text-zinc-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.scheduled_date}
                              </div>
                            )}
                            <div className="text-xs text-zinc-600 truncate max-w-[80px]">
                              {post.created_by_email?.split('@')[0]}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {statusPosts.length === 0 && (
                      <div className="p-4 text-center text-xs text-zinc-600">
                        No posts
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${channelConfig?.color || 'bg-zinc-700'}`}>
                  <ChannelIcon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold">{editingPost ? 'Edit Post' : 'Create Post'}</h2>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-zinc-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-800">
              {[
                { id: 'compose', label: 'Compose', icon: Edit2 },
                { id: 'schedule', label: 'Schedule', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-violet-500 text-white' 
                      : 'border-transparent text-zinc-500 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                {/* Compose Tab */}
                {activeTab === 'compose' && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">Title</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            placeholder="Give your post a title..."
                          />
                        </div>

                        {/* Channel Selection */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">Channel</label>
                          <div className="flex gap-2">
                            {Object.entries(CHANNELS).map(([key, ch]) => {
                              const Icon = ch.icon
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, channel: key, is_thread: key === 'twitter' ? formData.is_thread : false })}
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all flex-1 ${
                                    formData.channel === key 
                                      ? `${ch.color} text-white border-transparent` 
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                  <span className="text-sm">{ch.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Content Pillar */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">Content Pillar</label>
                          <div className="flex flex-wrap gap-2">
                            {CONTENT_PILLARS.map(pillar => (
                              <button
                                key={pillar.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, pillar: formData.pillar === pillar.id ? '' : pillar.id })}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                  formData.pillar === pillar.id 
                                    ? `${pillar.color} text-white` 
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                              >
                                {pillar.icon} {pillar.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Thread Toggle (Twitter only) */}
                        {formData.channel === 'twitter' && (
                          <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-zinc-400" />
                              <span className="text-sm">Create as Thread</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ 
                                ...formData, 
                                is_thread: !formData.is_thread,
                                thread_posts: formData.is_thread ? [''] : [formData.content || '']
                              })}
                              className={`w-12 h-6 rounded-full transition-colors relative ${
                                formData.is_thread ? 'bg-violet-600' : 'bg-zinc-700'
                              }`}
                            >
                              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                formData.is_thread ? 'translate-x-7' : 'translate-x-1'
                              }`}></span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div>
                        {formData.is_thread ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-zinc-400">Thread Posts</label>
                              <span className="text-xs text-zinc-500">{formData.thread_posts.length} tweets</span>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                              {formData.thread_posts.map((tweet, idx) => (
                                <div key={idx} className="relative">
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs text-zinc-500 mt-3 w-6">{idx + 1}/</span>
                                    <div className="flex-1">
                                      <textarea
                                        value={tweet}
                                        onChange={(e) => {
                                          const newThreads = [...formData.thread_posts]
                                          newThreads[idx] = e.target.value
                                          setFormData({ ...formData, thread_posts: newThreads })
                                        }}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                        placeholder={idx === 0 ? "Hook tweet (most important!)..." : "Continue the thread..."}
                                      />
                                      <div className="flex items-center justify-between mt-1">
                                        <span className={`text-xs ${tweet.length > 280 ? 'text-red-400' : 'text-zinc-500'}`}>
                                          {tweet.length}/280
                                        </span>
                                        {formData.thread_posts.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newThreads = formData.thread_posts.filter((_, i) => i !== idx)
                                              setFormData({ ...formData, thread_posts: newThreads })
                                            }}
                                            className="text-xs text-red-400 hover:text-red-300"
                                          >
                                            Remove
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ 
                                ...formData, 
                                thread_posts: [...formData.thread_posts, '']
                              })}
                              className="mt-3 w-full py-2 border border-dashed border-zinc-700 rounded-lg text-sm text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
                            >
                              + Add Tweet
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-zinc-400">Content</label>
                              {charLimit && (
                                <span className={`text-xs ${isOverLimit ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
                                  {charCount}/{charLimit}
                                </span>
                              )}
                            </div>
                            <textarea
                              value={formData.content}
                              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                              rows={10}
                              className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                                isOverLimit ? 'border-red-500 bg-red-900/10' : 'border-zinc-700'
                              }`}
                              placeholder={channelConfig?.tips}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-zinc-400">Hashtags</label>
                        <button
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            hashtags: WEB3_HASHTAGS[formData.channel as keyof typeof WEB3_HASHTAGS]?.slice(0, 5).join(' ') || ''
                          })}
                          className="text-xs text-violet-400 hover:text-violet-300"
                        >
                          + Add Web3 defaults
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.hashtags}
                        onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="#Web3 #AI #Crypto..."
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Internal Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="Links, references, follow-up ideas..."
                      />
                    </div>
                  </>
                )}

                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
                        <input
                          type="date"
                          value={formData.scheduled_date}
                          onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Time</label>
                        <input
                          type="time"
                          value={formData.scheduled_time}
                          onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Status</label>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData({ ...formData, status: key })}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                              formData.status === key 
                                ? `${config.color} border-transparent` 
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
                            {config.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optimal Times */}
                    <div className="p-4 bg-zinc-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="font-medium">Optimal Posting Times for {channelConfig?.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-zinc-500 mb-2">General Best Times</p>
                          <div className="flex flex-wrap gap-2">
                            {channelConfig?.bestTimes.map(time => (
                              <span key={time} className="px-2 py-1 bg-zinc-700 rounded text-xs">{time}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-2">Web3 Audience</p>
                          <div className="flex flex-wrap gap-2">
                            {channelConfig?.web3Times.map(time => (
                              <span key={time} className="px-2 py-1 bg-violet-900/50 text-violet-300 rounded text-xs">{time}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-900/50">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  {editingPost && (
                    <button
                      type="button"
                      onClick={() => deletePost(editingPost.id)}
                      className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isOverLimit}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {editingPost ? 'Update' : 'Save'} Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
