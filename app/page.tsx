'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Calendar, Plus, X, Twitter, Linkedin, FileText, Copy, Check, 
  ChevronLeft, ChevronRight, Edit2, Trash2, Clock, Send, Sparkles, 
  Zap, RefreshCw, Eye, TrendingUp, Layers, BarChart3, 
  Download, ChevronDown, Loader2, LogOut, Users, Target, Flame,
  Share2, MessageCircle, AlertCircle, ArrowRight, Wand2, Rocket,
  ChevronUp, BookOpen, PenTool, ArrowDown
} from 'lucide-react'

const CHANNELS = {
  twitter: { name: 'X/Twitter', icon: Twitter, color: 'bg-zinc-800', charLimit: 280 },
  linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', charLimit: 3000 },
  paragraph: { name: 'Paragraph', icon: FileText, color: 'bg-violet-600', charLimit: null }
}

const CONTENT_PILLARS = [
  { id: 'thought-leadership', name: 'Thought Leadership', color: 'bg-amber-500', icon: '💡' },
  { id: 'industry-insights', name: 'Industry Insights', color: 'bg-blue-500', icon: '📊' },
  { id: 'personal-brand', name: 'Personal Brand', color: 'bg-rose-500', icon: '🎯' },
  { id: 'engagement', name: 'Engagement', color: 'bg-green-500', icon: '💬' },
  { id: 'promotional', name: 'Promotional', color: 'bg-purple-500', icon: '🚀' },
  { id: 'educational', name: 'Educational', color: 'bg-cyan-500', icon: '📚' }
]

const STATUS_CONFIG = {
  idea: { label: 'Idea', color: 'bg-zinc-700 text-zinc-300', dot: 'bg-zinc-400' },
  draft: { label: 'Draft', color: 'bg-amber-900/50 text-amber-300', dot: 'bg-amber-400' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-900/50 text-blue-300', dot: 'bg-blue-400' },
  published: { label: 'Published', color: 'bg-emerald-900/50 text-emerald-300', dot: 'bg-emerald-400' }
}

const EVM_TOPICS = [
  { id: 1, title: "The End of the Retrieval Era", hook: "We are moving from a world where humans search for information to a world where agents execute on intent—transforming the Internet from a library into a workforce.", pillar: "thought-leadership" },
  { id: 2, title: "Why Your AI Needs a Wallet, Not a Subscription", hook: "To move beyond 'chatbots,' AI must become an economic actor capable of negotiating fees and paying for its own compute on sovereign rails.", pillar: "industry-insights" },
  { id: 3, title: "Trustware: The Safety Rail for Autonomous Software", hook: "Closed 'black box' AI is too risky for finance; Ethereum is the necessary substrate for verifiable agent identity and reputation.", pillar: "educational" },
  { id: 4, title: "The Machine-to-Machine (M2M) Economy", hook: "Why the future of commerce isn't B2B or B2C, but Agent-to-Agent (A2A), where software consumes data and transactions at a scale humans can't match.", pillar: "thought-leadership" },
  { id: 5, title: "Death of the UI: Protocol-First Design", hook: "As agents become the primary consumers of the web, the 'Front End' will disappear in favor of APIs, SDKs, and command-line coordination.", pillar: "industry-insights" },
  { id: 6, title: "The Agent Substrate: Ethereum for AI Payment Rails", hook: "Moving past 'crypto' labels to position blockchain as the un-censorable payment and coordination layer required for autonomous agents.", pillar: "educational" },
  { id: 7, title: "The 5-Year Agentic Forecast", hook: "A visionary roadmap predicting the shift from 'tools' to 'digital colleagues' and how 'Agentic Headcount' will define the next decade.", pillar: "thought-leadership" },
  { id: 8, title: "Markets Over Benchmarks: Solving AI Hallucination", hook: "Why synthetic evals fail and how decentralized prediction markets will create a real-world 'challenge layer' for AI intelligence.", pillar: "industry-insights" },
  { id: 9, title: "Sovereign Intelligence vs. The API Tax", hook: "A critique of closed AI 'gatekeepers' and the argument for open-source Edge OSS that allows institutions to own their intelligence.", pillar: "thought-leadership" },
  { id: 10, title: "The AI-Native Studio: A New Blueprint", hook: "How EVM Systems is dogfooding its own agentic operations to build a faster, leaner, and more autonomous venture incubator.", pillar: "personal-brand" }
]

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
  virality_score?: number
  hook?: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [view, setView] = useState('calendar')
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterPillar, setFilterPillar] = useState('all')
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    title: '', content: '', channel: 'twitter', scheduled_date: '', scheduled_time: '09:00',
    status: 'draft', hashtags: '', notes: '', pillar: '', is_thread: false, thread_posts: [''], hook: ''
  })
  
  // AI Generator state
  const [showGenerator, setShowGenerator] = useState(false)
  const [genStep, setGenStep] = useState(1)
  const [genTopic, setGenTopic] = useState('')
  const [genHook, setGenHook] = useState('')
  const [genPillar, setGenPillar] = useState('thought-leadership')
  const [genBlog, setGenBlog] = useState('')
  const [genThread, setGenThread] = useState<string[]>([])
  const [genLinkedin, setGenLinkedin] = useState('')
  const [genScore, setGenScore] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [genStatus, setGenStatus] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
      if (data) {
        setPosts(data)
        setTeamMembers([...new Set(data.map(p => p.created_by_email).filter(Boolean))] as string[])
      }
    }
    load()
    const channel = supabase.channel('posts').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const signIn = () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  const signOut = () => supabase.auth.signOut()

  // AI Generation
  const generateBlog = async () => {
    setGenerating(true)
    setGenStatus('Writing blog post...')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_blog', topic: genTopic, hook: genHook })
      })
      const data = await res.json()
      if (data.result) {
        setGenBlog(data.result)
        setGenStep(3)
        await scoreContent(data.result)
      }
    } catch (e) { console.error(e) }
    setGenerating(false)
    setGenStatus('')
  }

  const scoreContent = async (content: string) => {
    setGenStatus('Scoring virality...')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'score_virality', topic: genTopic, hook: genHook, content, channel: 'paragraph' })
      })
      const data = await res.json()
      if (data.result) setGenScore(data.result)
    } catch (e) { console.error(e) }
    setGenStatus('')
  }

  const generateWaterfall = async () => {
    setGenerating(true)
    setGenStatus('Generating Twitter thread...')
    try {
      const threadRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_thread', topic: genTopic, hook: genHook, content: genBlog })
      })
      const threadData = await threadRes.json()
      if (Array.isArray(threadData.result)) setGenThread(threadData.result)

      setGenStatus('Generating LinkedIn post...')
      const liRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_linkedin', topic: genTopic, hook: genHook, content: genBlog })
      })
      const liData = await liRes.json()
      if (liData.result) setGenLinkedin(liData.result)

      setGenStep(5)
    } catch (e) { console.error(e) }
    setGenerating(false)
    setGenStatus('')
  }

  const scheduleAll = async () => {
    if (!user || !scheduleDate) return
    setGenerating(true)
    setGenStatus('Scheduling posts...')

    const base = new Date(scheduleDate)
    
    // Blog - Tuesday 10 AM
    await supabase.from('posts').insert([{
      title: genTopic, content: genBlog, channel: 'paragraph',
      scheduled_date: scheduleDate, scheduled_time: '10:00', status: 'scheduled',
      hashtags: '', notes: 'AI Generated', pillar: genPillar, is_thread: false, thread_posts: [],
      created_by: user.id, created_by_email: user.email, virality_score: genScore?.overall || null, hook: genHook
    }])

    // Thread - Same day 5 PM
    await supabase.from('posts').insert([{
      title: `${genTopic} (Thread)`, content: genThread[0] || '', channel: 'twitter',
      scheduled_date: scheduleDate, scheduled_time: '17:00', status: 'scheduled',
      hashtags: '#Web3 #AI', notes: 'AI Generated - Waterfall', pillar: genPillar,
      is_thread: true, thread_posts: genThread,
      created_by: user.id, created_by_email: user.email, virality_score: genScore?.overall || null, hook: genHook
    }])

    // LinkedIn - Thursday 8 AM
    const liDate = new Date(base)
    liDate.setDate(liDate.getDate() + 2)
    await supabase.from('posts').insert([{
      title: `${genTopic} (LinkedIn)`, content: genLinkedin, channel: 'linkedin',
      scheduled_date: liDate.toISOString().split('T')[0], scheduled_time: '08:00', status: 'scheduled',
      hashtags: '#Web3 #AI #Innovation', notes: 'AI Generated - Waterfall', pillar: genPillar,
      is_thread: false, thread_posts: [],
      created_by: user.id, created_by_email: user.email, virality_score: genScore?.overall || null, hook: genHook
    }])

    setGenerating(false)
    resetGenerator()
  }

  const resetGenerator = () => {
    setShowGenerator(false)
    setGenStep(1)
    setGenTopic('')
    setGenHook('')
    setGenPillar('thought-leadership')
    setGenBlog('')
    setGenThread([])
    setGenLinkedin('')
    setGenScore(null)
    setScheduleDate('')
    setGenStatus('')
  }

  const selectTopic = (t: typeof EVM_TOPICS[0]) => {
    setGenTopic(t.title)
    setGenHook(t.hook)
    setGenPillar(t.pillar)
  }

  // Helpers
  const getScoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : s >= 40 ? 'text-orange-400' : 'text-red-400'
  const getScoreBg = (s: number) => s >= 80 ? 'bg-emerald-500/20 border-emerald-500/50' : s >= 60 ? 'bg-amber-500/20 border-amber-500/50' : s >= 40 ? 'bg-orange-500/20 border-orange-500/50' : 'bg-red-500/20 border-red-500/50'
  const getScoreLabel = (s: number) => s >= 80 ? '🔥 High Viral Potential' : s >= 60 ? '📈 Good Engagement' : s >= 40 ? '⚡ Moderate Reach' : '🎯 Needs Work'

  const getDays = (date: Date) => {
    const y = date.getFullYear(), m = date.getMonth()
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < first.getDay(); i++) days.push(null)
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i))
    return days
  }

  const getPostsFor = (d: Date | null) => {
    if (!d) return []
    const ds = d.toISOString().split('T')[0]
    return posts.filter(p => p.scheduled_date === ds && (filterChannel === 'all' || p.channel === filterChannel) && (filterPillar === 'all' || p.pillar === filterPillar))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const data = { ...formData, created_by: user.id, created_by_email: user.email }
    if (editingPost) await supabase.from('posts').update(data).eq('id', editingPost.id)
    else await supabase.from('posts').insert([data])
    resetForm()
  }

  const resetForm = () => {
    setFormData({ title: '', content: '', channel: 'twitter', scheduled_date: '', scheduled_time: '09:00', status: 'draft', hashtags: '', notes: '', pillar: '', is_thread: false, thread_posts: [''], hook: '' })
    setEditingPost(null)
    setShowModal(false)
  }

  const editPost = (p: Post) => {
    setFormData({ title: p.title, content: p.content, channel: p.channel, scheduled_date: p.scheduled_date || '', scheduled_time: p.scheduled_time, status: p.status, hashtags: p.hashtags, notes: p.notes, pillar: p.pillar, is_thread: p.is_thread, thread_posts: p.thread_posts || [''], hook: p.hook || '' })
    setEditingPost(p)
    setShowModal(true)
  }

  const deletePost = async (id: string) => { if (confirm('Delete?')) await supabase.from('posts').delete().eq('id', id) }

  const copyText = (t: string, l: string) => { navigator.clipboard.writeText(t); setCopied(l); setTimeout(() => setCopied(null), 2000) }

  const exportCSV = () => {
    const rows = [['Title', 'Channel', 'Date', 'Status', 'Score'], ...posts.map(p => [p.title, p.channel, p.scheduled_date || '', p.status, p.virality_score || ''])]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `content-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const days = getDays(currentDate)
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const avgScore = posts.filter(p => p.virality_score).length ? Math.round(posts.filter(p => p.virality_score).reduce((s, p) => s + (p.virality_score || 0), 0) / posts.filter(p => p.virality_score).length) : 0

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>

  if (!user) return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl flex items-center justify-center"><Rocket className="w-8 h-8" /></div>
        <h1 className="text-2xl font-bold mb-2">Content Waterfall Studio</h1>
        <p className="text-zinc-500 mb-8">AI-Powered Content Generation</p>
        <button onClick={signIn} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-zinc-900 rounded-xl font-medium hover:bg-zinc-100">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl"><Rocket className="w-6 h-6" /></div>
              <div>
                <h1 className="text-xl font-semibold">Content Waterfall Studio</h1>
                <p className="text-sm text-zinc-500">AI-Powered • Topic → Blog → Thread → LinkedIn</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <div className="px-3 py-1.5 bg-zinc-800 rounded-full">{posts.length} posts</div>
              <div className="px-3 py-1.5 bg-blue-900/30 rounded-full text-blue-300">{posts.filter(p => p.status === 'scheduled').length} scheduled</div>
              {avgScore > 0 && <div className={`px-3 py-1.5 rounded-full border ${getScoreBg(avgScore)}`}><Flame className="w-3 h-3 inline mr-1" />{avgScore}%</div>}
              <div className="px-3 py-1.5 bg-violet-900/30 rounded-full text-violet-300"><Users className="w-3 h-3 inline mr-1" />{teamMembers.length}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 hidden md:block">{user.email}</span>
              <button onClick={signOut} className="p-2 hover:bg-zinc-800 rounded-lg"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm">
              <option value="all">All Channels</option>
              {Object.entries(CHANNELS).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
            </select>
            <select value={filterPillar} onChange={e => setFilterPillar(e.target.value)} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm">
              <option value="all">All Pillars</option>
              {CONTENT_PILLARS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
            </select>
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              {['calendar', 'list', 'board'].map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-2 text-sm capitalize ${view === v ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{v}</button>
              ))}
            </div>
            <div className="flex-1" />
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-700"><Download className="w-4 h-4" /></button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-700"><Plus className="w-4 h-4" /> Manual</button>
            <button onClick={() => setShowGenerator(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg text-sm font-medium hover:opacity-90"><Wand2 className="w-4 h-4" /> AI Generate</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {copied && <div className="fixed top-20 right-6 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"><Check className="w-4 h-4 inline mr-2" />Copied!</div>}

        {/* Calendar */}
        {view === 'calendar' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-zinc-800 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-lg font-semibold">{monthYear}</h2>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-zinc-800 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 border-b border-zinc-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="p-3 text-center text-sm font-medium text-zinc-500">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                const dp = getPostsFor(d)
                const today = d && d.toDateString() === new Date().toDateString()
                return (
                  <div key={i} className={`min-h-[100px] p-2 border-b border-r border-zinc-800/50 ${!d ? 'bg-zinc-950' : 'hover:bg-zinc-800/30'} ${today ? 'bg-violet-900/20' : ''}`}>
                    {d && <>
                      <div className={`text-sm mb-1 ${today ? 'font-bold text-violet-400' : 'text-zinc-500'}`}>{d.getDate()}</div>
                      <div className="space-y-1">
                        {dp.slice(0, 3).map(p => {
                          const C = CHANNELS[p.channel as keyof typeof CHANNELS]
                          const I = C?.icon || FileText
                          return <div key={p.id} onClick={() => editPost(p)} className={`flex items-center gap-1 p-1 rounded text-xs cursor-pointer ${C?.color} text-white`}><I className="w-3 h-3" /><span className="truncate">{p.title || 'Untitled'}</span>{p.virality_score && p.virality_score >= 70 && <Flame className="w-3 h-3 text-amber-400" />}</div>
                        })}
                        {dp.length > 3 && <div className="text-xs text-zinc-500">+{dp.length - 3}</div>}
                      </div>
                    </>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* List */}
        {view === 'list' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
            {posts.length === 0 ? (
              <div className="p-16 text-center">
                <Wand2 className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-500 mb-4">No posts yet</p>
                <button onClick={() => setShowGenerator(true)} className="px-4 py-2 bg-violet-600 rounded-lg text-sm"><Wand2 className="w-4 h-4 inline mr-2" />AI Generate</button>
              </div>
            ) : posts.filter(p => (filterChannel === 'all' || p.channel === filterChannel) && (filterPillar === 'all' || p.pillar === filterPillar)).map(p => {
              const C = CHANNELS[p.channel as keyof typeof CHANNELS]
              const I = C?.icon || FileText
              const pl = CONTENT_PILLARS.find(x => x.id === p.pillar)
              const st = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]
              return (
                <div key={p.id} className="p-4 hover:bg-zinc-800/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${C?.color}`}><I className="w-4 h-4 text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-sm">{p.title || 'Untitled'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${st?.color}`}>{st?.label}</span>
                          {pl && <span className={`px-2 py-0.5 rounded-full text-xs ${pl.color} text-white`}>{pl.icon}</span>}
                          {p.virality_score && <span className={`px-2 py-0.5 rounded-full text-xs border ${getScoreBg(p.virality_score)}`}><Flame className="w-3 h-3 inline" /> {p.virality_score}%</span>}
                          {p.is_thread && <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-700"><Layers className="w-3 h-3 inline" /> {p.thread_posts?.length}</span>}
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-1">{p.is_thread ? p.thread_posts?.[0] : p.content}</p>
                        {p.scheduled_date && <p className="text-xs text-zinc-600 mt-1"><Clock className="w-3 h-3 inline mr-1" />{p.scheduled_date} {p.scheduled_time}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => editPost(p)} className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deletePost(p.id)} className="p-2 hover:bg-red-900/50 rounded-lg text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Board */}
        {view === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(STATUS_CONFIG).map(([k, c]) => {
              const sp = posts.filter(p => p.status === k && (filterChannel === 'all' || p.channel === filterChannel))
              return (
                <div key={k} className="bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${c.dot}`} /><span className="font-medium text-sm">{c.label}</span></div>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{sp.length}</span>
                  </div>
                  <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
                    {sp.map(p => {
                      const C = CHANNELS[p.channel as keyof typeof CHANNELS]
                      const I = C?.icon || FileText
                      return (
                        <div key={p.id} onClick={() => editPost(p)} className="p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 rounded ${C?.color}`}><I className="w-3 h-3 text-white" /></div>
                            {p.virality_score && p.virality_score >= 70 && <Flame className="w-3 h-3 text-amber-400" />}
                          </div>
                          <h4 className="text-sm font-medium line-clamp-2">{p.title || 'Untitled'}</h4>
                          {p.scheduled_date && <p className="text-xs text-zinc-500 mt-2"><Clock className="w-3 h-3 inline mr-1" />{p.scheduled_date}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-5xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600"><Wand2 className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-semibold">AI Content Generator</h2>
                  <p className="text-xs text-zinc-500">Topic → Blog → Score → Waterfall → Schedule</p>
                </div>
              </div>
              <button onClick={resetGenerator} className="p-2 hover:bg-zinc-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Progress */}
            <div className="px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                {[{ s: 1, l: 'Topic' }, { s: 2, l: 'Generate' }, { s: 3, l: 'Review & Score' }, { s: 4, l: 'Waterfall' }, { s: 5, l: 'Schedule' }].map((x, i) => (
                  <div key={x.s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${genStep >= x.s ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      {genStep > x.s ? <Check className="w-4 h-4" /> : x.s}
                    </div>
                    <span className={`ml-2 text-sm hidden sm:block ${genStep >= x.s ? 'text-white' : 'text-zinc-500'}`}>{x.l}</span>
                    {i < 4 && <div className={`w-8 lg:w-16 h-0.5 mx-2 ${genStep > x.s ? 'bg-violet-600' : 'bg-zinc-700'}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Topic */}
              {genStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Select from Your Topics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                      {EVM_TOPICS.map(t => (
                        <button key={t.id} onClick={() => selectTopic(t)} className={`text-left p-3 rounded-lg border transition-all ${genTopic === t.title ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}>
                          <div className="text-xs text-zinc-500 mb-1">#{t.id}</div>
                          <div className="font-medium text-sm">{t.title}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-zinc-800 pt-6 space-y-4">
                    <h3 className="font-medium">Or Enter Custom Topic</h3>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Topic / Title</label>
                      <input type="text" value={genTopic} onChange={e => setGenTopic(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" placeholder="The End of the Retrieval Era" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Hook / Log Line</label>
                      <textarea value={genHook} onChange={e => setGenHook(e.target.value)} rows={2} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" placeholder="The one-line summary that grabs attention..." />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Content Pillar</label>
                      <div className="flex flex-wrap gap-2">
                        {CONTENT_PILLARS.map(p => (
                          <button key={p.id} type="button" onClick={() => setGenPillar(p.id)} className={`px-3 py-1.5 rounded-lg text-sm ${genPillar === p.id ? `${p.color} text-white` : 'bg-zinc-800 text-zinc-400'}`}>{p.icon} {p.name}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Generating */}
              {genStep === 2 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin text-violet-500 mb-4" />
                  <p className="text-lg font-medium">{genStatus || 'Generating...'}</p>
                  <p className="text-sm text-zinc-500 mt-2">This takes 20-40 seconds</p>
                </div>
              )}

              {/* Step 3: Review Blog + Score */}
              {genStep === 3 && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Generated Blog</h3>
                      <button onClick={() => copyText(genBlog, 'blog')} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                    </div>
                    <textarea value={genBlog} onChange={e => setGenBlog(e.target.value)} rows={18} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-mono" />
                  </div>
                  <div className="space-y-4">
                    {genScore && (
                      <>
                        <div className={`p-6 rounded-xl border ${getScoreBg(genScore.overall)}`}>
                          <div className="text-center">
                            <div className="text-5xl font-bold mb-1"><span className={getScoreColor(genScore.overall)}>{genScore.overall}</span><span className="text-xl text-zinc-500">%</span></div>
                            <p className="text-sm">{getScoreLabel(genScore.overall)}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-zinc-800/50 rounded-xl">
                          <h4 className="font-medium mb-3 text-sm">Breakdown</h4>
                          <div className="space-y-2">
                            {Object.entries(genScore.scores || {}).map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400 capitalize">{k}</span>
                                <span className={getScoreColor(v as number)}>{v as number}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {genScore.feedback?.length > 0 && (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <h4 className="font-medium mb-2 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-400" /> Tips</h4>
                            <ul className="text-sm text-zinc-300 space-y-1">
                              {genScore.feedback.map((f: string, i: number) => <li key={i}>• {f}</li>)}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                    {generating && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-500" /><p className="text-sm text-zinc-500 mt-2">{genStatus}</p></div>}
                  </div>
                </div>
              )}

              {/* Step 4: Generating Waterfall */}
              {genStep === 4 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mb-4" />
                  <p className="text-lg font-medium">{genStatus || 'Generating waterfall...'}</p>
                  <p className="text-sm text-zinc-500 mt-2">Creating thread and LinkedIn post</p>
                </div>
              )}

              {/* Step 5: Review Waterfall + Schedule */}
              {genStep === 5 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-zinc-800/30 rounded-xl border border-zinc-700 overflow-hidden">
                      <div className="p-3 border-b border-zinc-700 flex items-center justify-between">
                        <div className="flex items-center gap-2"><Twitter className="w-4 h-4" /><span className="font-medium text-sm">Twitter Thread</span></div>
                        <span className="text-xs text-zinc-500">{genThread.length} tweets</span>
                      </div>
                      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                        {genThread.map((t, i) => <div key={i} className="p-2 bg-zinc-800/50 rounded-lg text-sm"><span className="text-zinc-500 text-xs">{i + 1}/</span> {t}</div>)}
                      </div>
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl border border-blue-500/30 overflow-hidden">
                      <div className="p-3 border-b border-zinc-700 flex items-center gap-2"><Linkedin className="w-4 h-4 text-blue-400" /><span className="font-medium text-sm">LinkedIn Post</span></div>
                      <div className="p-3 max-h-[300px] overflow-y-auto"><p className="text-sm whitespace-pre-line">{genLinkedin}</p></div>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                    <h3 className="font-medium mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400" /> Schedule Waterfall</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-2">Blog Publish Date (Tuesday recommended)</label>
                        <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" />
                      </div>
                      <div className="text-sm text-zinc-400 pt-6">
                        <p className="flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> Blog: {scheduleDate || '—'} @ 10:00 AM</p>
                        <p className="flex items-center gap-2 mt-2"><Twitter className="w-4 h-4" /> Thread: {scheduleDate || '—'} @ 5:00 PM</p>
                        <p className="flex items-center gap-2 mt-2"><Linkedin className="w-4 h-4 text-blue-400" /> LinkedIn: {scheduleDate ? new Date(new Date(scheduleDate).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '—'} @ 8:00 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-zinc-800">
              <button onClick={() => genStep > 1 && !generating && setGenStep(genStep === 3 ? 1 : genStep - 1)} disabled={genStep === 1 || generating} className="px-4 py-2 text-zinc-400 hover:text-white disabled:opacity-50">Back</button>
              <div className="flex items-center gap-3">
                {genScore && genStep >= 3 && <span className={`px-3 py-1 rounded-full text-sm border ${getScoreBg(genScore.overall)}`}><Flame className="w-3 h-3 inline mr-1" />{genScore.overall}%</span>}
                {genStep === 1 && (
                  <button onClick={() => { setGenStep(2); generateBlog() }} disabled={!genTopic || !genHook || generating} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl font-medium disabled:opacity-50">
                    Generate Blog <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {genStep === 3 && (
                  <button onClick={() => { setGenStep(4); generateWaterfall() }} disabled={generating} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl font-medium disabled:opacity-50">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />} Generate Waterfall
                  </button>
                )}
                {genStep === 5 && (
                  <button onClick={scheduleAll} disabled={!scheduleDate || generating} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-medium disabled:opacity-50">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Schedule All 3 Posts
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-3xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">{editingPost ? 'Edit Post' : 'Manual Post'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-zinc-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Channel</label>
                <div className="flex gap-2">
                  {Object.entries(CHANNELS).map(([k, c]) => {
                    const I = c.icon
                    return <button key={k} type="button" onClick={() => setFormData({ ...formData, channel: k })} className={`flex items-center gap-2 px-4 py-2 rounded-xl flex-1 ${formData.channel === k ? `${c.color} text-white` : 'bg-zinc-800 text-zinc-400'}`}><I className="w-4 h-4" /> {c.name}</button>
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Content</label>
                <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={8} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Date</label>
                  <input type="date" value={formData.scheduled_date} onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl">
                    {Object.entries(STATUS_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-zinc-400">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-violet-600 rounded-xl font-medium">{editingPost ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
