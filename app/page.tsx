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
  ChevronUp, BookOpen, PenTool, ArrowDown, Brain, CheckCircle2,
  CalendarDays, Megaphone, Link2, MessageSquare, Newspaper
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

const CONTENT_TYPES = {
  engagement: { name: 'Monday Engagement', day: 'Monday', icon: MessageCircle, color: 'bg-green-600', description: 'Community interaction post' },
  thread: { name: 'Tuesday Thread', day: 'Tuesday', icon: Layers, color: 'bg-violet-600', description: 'Core thesis (6-8 tweets)' },
  supporting: { name: 'Wednesday Supporting', day: 'Wednesday', icon: MessageSquare, color: 'bg-cyan-600', description: 'Expand on thesis' },
  blog: { name: 'Thursday Blog', day: 'Thursday', icon: FileText, color: 'bg-amber-600', description: 'Full article on Paragraph' },
  roundup: { name: 'Friday Roundup', day: 'Friday', icon: Newspaper, color: 'bg-rose-600', description: 'Weekly industry review' }
}

const STATUS_CONFIG = {
  idea: { label: 'Idea', color: 'bg-zinc-700 text-zinc-300', dot: 'bg-zinc-400' },
  draft: { label: 'Draft', color: 'bg-amber-900/50 text-amber-300', dot: 'bg-amber-400' },
  review: { label: 'In Review', color: 'bg-purple-900/50 text-purple-300', dot: 'bg-purple-400' },
  approved: { label: 'Approved', color: 'bg-emerald-900/50 text-emerald-300', dot: 'bg-emerald-400' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-900/50 text-blue-300', dot: 'bg-blue-400' },
  published: { label: 'Published', color: 'bg-emerald-900/50 text-emerald-300', dot: 'bg-emerald-400' }
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
  virality_score?: number
  hook?: string
  approved?: boolean
  approved_by?: string
  approved_at?: string
  content_type?: string
}

type BrainDumpIdea = {
  topic: string
  hook: string
  keyPoints: string[]
  contentType: string
  pillar: string
  priority: string
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
    status: 'draft', hashtags: '', notes: '', pillar: '', is_thread: false, thread_posts: [''], hook: '', content_type: ''
  })
  
  // AI Generator state
  const [showGenerator, setShowGenerator] = useState(false)
  const [genMode, setGenMode] = useState<'braindump' | 'draft' | 'weekly'>('braindump')
  const [genStep, setGenStep] = useState(1)
  const [genTopic, setGenTopic] = useState('')
  const [genHook, setGenHook] = useState('')
  const [genDraft, setGenDraft] = useState('')
  const [genBrainDump, setGenBrainDump] = useState('')
  const [genPillar, setGenPillar] = useState('thought-leadership')
  const [genBlog, setGenBlog] = useState('')
  const [genThread, setGenThread] = useState<string[]>([])
  const [genLinkedin, setGenLinkedin] = useState('')
  const [genEngagement, setGenEngagement] = useState('')
  const [genSupporting, setGenSupporting] = useState('')
  const [genRoundup, setGenRoundup] = useState<string[]>([])
  const [genScore, setGenScore] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [genStatus, setGenStatus] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [optimizeAttempts, setOptimizeAttempts] = useState(0)
  const [extractedIdeas, setExtractedIdeas] = useState<BrainDumpIdea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<BrainDumpIdea | null>(null)
  const [weeklyTheme, setWeeklyTheme] = useState('')
  
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

  // Process Brain Dump
  const processBrainDump = async () => {
    setGenerating(true)
    setGenStatus('Analyzing brain dump...')
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_braindump', brainDump: genBrainDump })
      })
      const data = await res.json()
      if (data.result?.ideas) {
        setExtractedIdeas(data.result.ideas)
        setWeeklyTheme(data.result.weeklyAngle || '')
        setGenStep(2)
      }
    } catch (e) { console.error(e) }
    setGenerating(false)
    setGenStatus('')
  }

  // Generate content for selected idea
  const generateFromIdea = async (idea: BrainDumpIdea) => {
    setSelectedIdea(idea)
    setGenTopic(idea.topic)
    setGenHook(idea.hook)
    setGenPillar(idea.pillar)
    setGenStep(3)
    await generateBlog(idea.topic, idea.hook)
  }

  // AI Generation
  const generateBlog = async (topic?: string, hook?: string) => {
    setGenerating(true)
    setGenStatus('Writing blog post...')
    setOptimizeAttempts(0)
    
    const useTopic = topic || genTopic
    const useHook = hook || genHook
    
    try {
      if (genDraft.trim()) {
        setGenBlog(genDraft)
        setGenStep(4)
        await scoreAndOptimize(genDraft)
      } else {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate_blog', topic: useTopic, hook: useHook })
        })
        const data = await res.json()
        if (data.result) {
          setGenBlog(data.result)
          setGenStep(4)
          await scoreAndOptimize(data.result)
        }
      }
    } catch (e) { console.error(e) }
    setGenerating(false)
    setGenStatus('')
  }

  const scoreAndOptimize = async (content: string, attempt = 0) => {
    setGenStatus(`Scoring virality... ${attempt > 0 ? `(Attempt ${attempt})` : ''}`)
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'score_virality', topic: genTopic, hook: genHook, content, channel: 'paragraph' })
      })
      const data = await res.json()
      
      if (data.result) {
        setGenScore(data.result)
        
        if (data.result.overall < 95 && attempt < 3) {
          setGenStatus(`Score: ${data.result.overall}% — Optimizing...`)
          setOptimizeAttempts(attempt + 1)
          
          const optimizeRes = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'optimize_content', 
              topic: genTopic, 
              hook: genHook, 
              content,
              feedback: data.result.feedback,
              currentScore: data.result.overall
            })
          })
          const optimizeData = await optimizeRes.json()
          
          if (optimizeData.result) {
            setGenBlog(optimizeData.result)
            await scoreAndOptimize(optimizeData.result, attempt + 1)
          }
        }
      }
    } catch (e) { console.error(e) }
    setGenStatus('')
  }

  const generateWeeklyContent = async () => {
    setGenerating(true)
    
    // Generate Monday Engagement
    setGenStatus('Creating Monday engagement post...')
    try {
      const engRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_engagement', topic: weeklyTheme || genTopic, hook: genHook })
      })
      const engData = await engRes.json()
      if (engData.result) setGenEngagement(engData.result)
    } catch (e) { console.error(e) }

    // Generate Tuesday Thread
    setGenStatus('Creating Tuesday thread...')
    try {
      const threadRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_thread', topic: genTopic, hook: genHook, content: genBlog })
      })
      const threadData = await threadRes.json()
      if (Array.isArray(threadData.result)) setGenThread(threadData.result)
    } catch (e) { console.error(e) }

    // Generate Wednesday Supporting
    setGenStatus('Creating Wednesday supporting tweet...')
    try {
      const supRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_supporting', topic: genTopic, hook: genHook, content: genBlog })
      })
      const supData = await supRes.json()
      if (supData.result) setGenSupporting(supData.result)
    } catch (e) { console.error(e) }

    // Generate LinkedIn for Thursday
    setGenStatus('Creating Thursday LinkedIn post...')
    try {
      const liRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_linkedin', topic: genTopic, hook: genHook, content: genBlog })
      })
      const liData = await liRes.json()
      if (liData.result) setGenLinkedin(liData.result)
    } catch (e) { console.error(e) }

    // Generate Friday Roundup
    setGenStatus('Creating Friday roundup...')
    try {
      const roundRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_roundup', topic: weeklyTheme || genTopic, hook: genHook })
      })
      const roundData = await roundRes.json()
      if (Array.isArray(roundData.result)) setGenRoundup(roundData.result)
    } catch (e) { console.error(e) }

    setGenStep(5)
    setGenerating(false)
    setGenStatus('')
  }

  const scheduleWeek = async () => {
    if (!user || !scheduleDate) return
    setGenerating(true)
    setGenStatus('Scheduling week...')

    const monday = new Date(scheduleDate)
    // Adjust to Monday if not already
    const dayOfWeek = monday.getDay()
    if (dayOfWeek !== 1) {
      monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    }
    
    const getDateStr = (daysToAdd: number) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + daysToAdd)
      return d.toISOString().split('T')[0]
    }

    // Monday - Engagement
    if (genEngagement) {
      await supabase.from('posts').insert([{
        title: `${weeklyTheme || genTopic} - Engagement`, content: genEngagement, channel: 'twitter',
        scheduled_date: getDateStr(0), scheduled_time: '09:00', status: 'review',
        pillar: genPillar, is_thread: false, thread_posts: [], content_type: 'engagement',
        created_by: user.id, created_by_email: user.email, hook: genHook
      }])
    }

    // Tuesday - Thread
    if (genThread.length > 0) {
      await supabase.from('posts').insert([{
        title: `${genTopic} - Thread`, content: genThread[0], channel: 'twitter',
        scheduled_date: getDateStr(1), scheduled_time: '10:00', status: 'review',
        pillar: genPillar, is_thread: true, thread_posts: genThread, content_type: 'thread',
        created_by: user.id, created_by_email: user.email, virality_score: genScore?.overall, hook: genHook
      }])
    }

    // Wednesday - Supporting
    if (genSupporting) {
      await supabase.from('posts').insert([{
        title: `${genTopic} - Supporting`, content: genSupporting, channel: 'twitter',
        scheduled_date: getDateStr(2), scheduled_time: '12:00', status: 'review',
        pillar: genPillar, is_thread: false, thread_posts: [], content_type: 'supporting',
        created_by: user.id, created_by_email: user.email, hook: genHook
      }])
    }

    // Thursday - Blog + LinkedIn
    if (genBlog) {
      await supabase.from('posts').insert([{
        title: genTopic, content: genBlog, channel: 'paragraph',
        scheduled_date: getDateStr(3), scheduled_time: '10:00', status: 'review',
        pillar: genPillar, is_thread: false, thread_posts: [], content_type: 'blog',
        created_by: user.id, created_by_email: user.email, virality_score: genScore?.overall, hook: genHook
      }])
    }
    if (genLinkedin) {
      await supabase.from('posts').insert([{
        title: `${genTopic} - LinkedIn`, content: genLinkedin, channel: 'linkedin',
        scheduled_date: getDateStr(3), scheduled_time: '11:00', status: 'review',
        pillar: genPillar, is_thread: false, thread_posts: [], content_type: 'blog',
        created_by: user.id, created_by_email: user.email, hook: genHook
      }])
    }

    // Friday - Roundup
    if (genRoundup.length > 0) {
      await supabase.from('posts').insert([{
        title: `Weekly Roundup - ${weeklyTheme || genTopic}`, content: genRoundup[0], channel: 'twitter',
        scheduled_date: getDateStr(4), scheduled_time: '14:00', status: 'review',
        pillar: genPillar, is_thread: true, thread_posts: genRoundup, content_type: 'roundup',
        created_by: user.id, created_by_email: user.email, hook: genHook
      }])
    }

    setGenerating(false)
    resetGenerator()
  }

  const approvePost = async (postId: string) => {
    if (!user) return
    await supabase.from('posts').update({
      approved: true,
      approved_by: user.email,
      approved_at: new Date().toISOString(),
      status: 'approved'
    }).eq('id', postId)
  }

  const unapprovePost = async (postId: string) => {
    await supabase.from('posts').update({
      approved: false,
      approved_by: null,
      approved_at: null,
      status: 'review'
    }).eq('id', postId)
  }

  const resetGenerator = () => {
    setShowGenerator(false)
    setGenMode('braindump')
    setGenStep(1)
    setGenTopic('')
    setGenHook('')
    setGenDraft('')
    setGenBrainDump('')
    setGenPillar('thought-leadership')
    setGenBlog('')
    setGenThread([])
    setGenLinkedin('')
    setGenEngagement('')
    setGenSupporting('')
    setGenRoundup([])
    setGenScore(null)
    setScheduleDate('')
    setGenStatus('')
    setOptimizeAttempts(0)
    setExtractedIdeas([])
    setSelectedIdea(null)
    setWeeklyTheme('')
  }

  // Helpers
  const getScoreColor = (s: number) => s >= 95 ? 'text-emerald-400' : s >= 80 ? 'text-lime-400' : s >= 60 ? 'text-amber-400' : 'text-orange-400'
  const getScoreBg = (s: number) => s >= 95 ? 'bg-emerald-500/20 border-emerald-500/50' : s >= 80 ? 'bg-lime-500/20 border-lime-500/50' : s >= 60 ? 'bg-amber-500/20 border-amber-500/50' : 'bg-orange-500/20 border-orange-500/50'
  const getScoreLabel = (s: number) => s >= 95 ? '🔥 Viral Ready!' : s >= 80 ? '📈 High Potential' : s >= 60 ? '⚡ Good' : '🎯 Needs Work'

  const copyText = (t: string, label: string) => { 
    navigator.clipboard.writeText(t)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000) 
  }

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
    setFormData({ title: '', content: '', channel: 'twitter', scheduled_date: '', scheduled_time: '09:00', status: 'draft', hashtags: '', notes: '', pillar: '', is_thread: false, thread_posts: [''], hook: '', content_type: '' })
    setEditingPost(null)
    setShowModal(false)
  }

  const editPost = (p: Post) => {
    setFormData({ title: p.title, content: p.content, channel: p.channel, scheduled_date: p.scheduled_date || '', scheduled_time: p.scheduled_time, status: p.status, hashtags: p.hashtags, notes: p.notes, pillar: p.pillar, is_thread: p.is_thread, thread_posts: p.thread_posts || [''], hook: p.hook || '', content_type: p.content_type || '' })
    setEditingPost(p)
    setShowModal(true)
  }

  const deletePost = async (id: string) => { if (confirm('Delete?')) await supabase.from('posts').delete().eq('id', id) }

  const exportCSV = () => {
    const rows = [['Title', 'Channel', 'Date', 'Status', 'Approved', 'Score'], ...posts.map(p => [p.title, p.channel, p.scheduled_date || '', p.status, p.approved ? 'Yes' : 'No', p.virality_score || ''])]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `content-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const days = getDays(currentDate)
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const pendingApproval = posts.filter(p => p.status === 'review' && !p.approved).length
  const approvedCount = posts.filter(p => p.approved).length

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>

  if (!user) return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl flex items-center justify-center"><Rocket className="w-8 h-8" /></div>
        <h1 className="text-2xl font-bold mb-2">Content Waterfall Studio</h1>
        <p className="text-zinc-500 mb-8">AI-Powered Weekly Content Engine</p>
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
                <p className="text-sm text-zinc-500">Brain Dump → Weekly Content → Approval → Publish</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <div className="px-3 py-1.5 bg-zinc-800 rounded-full">{posts.length} posts</div>
              {pendingApproval > 0 && <div className="px-3 py-1.5 bg-purple-900/30 rounded-full text-purple-300"><Clock className="w-3 h-3 inline mr-1" />{pendingApproval} pending</div>}
              <div className="px-3 py-1.5 bg-emerald-900/30 rounded-full text-emerald-300"><CheckCircle2 className="w-3 h-3 inline mr-1" />{approvedCount} approved</div>
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
            <button onClick={() => setShowGenerator(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg text-sm font-medium hover:opacity-90"><Brain className="w-4 h-4" /> AI Generate</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {copied && <div className="fixed top-20 right-6 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"><Check className="w-4 h-4 inline mr-2" />Copied!</div>}

        {/* Calendar View */}
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
                          const ct = CONTENT_TYPES[p.content_type as keyof typeof CONTENT_TYPES]
                          return (
                            <div key={p.id} onClick={() => editPost(p)} className={`flex items-center gap-1 p-1 rounded text-xs cursor-pointer ${ct?.color || C?.color} text-white`}>
                              <I className="w-3 h-3" />
                              <span className="truncate flex-1">{p.title || 'Untitled'}</span>
                              {p.approved && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                              {p.virality_score && p.virality_score >= 80 && <Flame className="w-3 h-3 text-amber-400" />}
                            </div>
                          )
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

        {/* List View */}
        {view === 'list' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
            {posts.length === 0 ? (
              <div className="p-16 text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-500 mb-4">No posts yet</p>
                <button onClick={() => setShowGenerator(true)} className="px-4 py-2 bg-violet-600 rounded-lg text-sm"><Brain className="w-4 h-4 inline mr-2" />Start with Brain Dump</button>
              </div>
            ) : posts.filter(p => (filterChannel === 'all' || p.channel === filterChannel) && (filterPillar === 'all' || p.pillar === filterPillar)).map(p => {
              const C = CHANNELS[p.channel as keyof typeof CHANNELS]
              const I = C?.icon || FileText
              const pl = CONTENT_PILLARS.find(x => x.id === p.pillar)
              const st = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]
              const ct = CONTENT_TYPES[p.content_type as keyof typeof CONTENT_TYPES]
              return (
                <div key={p.id} className="p-4 hover:bg-zinc-800/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${ct?.color || C?.color}`}><I className="w-4 h-4 text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-sm">{p.title || 'Untitled'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${st?.color}`}>{st?.label}</span>
                          {ct && <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-700">{ct.day}</span>}
                          {pl && <span className={`px-2 py-0.5 rounded-full text-xs ${pl.color} text-white`}>{pl.icon}</span>}
                          {p.virality_score && <span className={`px-2 py-0.5 rounded-full text-xs border ${getScoreBg(p.virality_score)}`}><Flame className="w-3 h-3 inline" /> {p.virality_score}%</span>}
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-1">{p.content}</p>
                        {p.scheduled_date && <p className="text-xs text-zinc-600 mt-1"><Clock className="w-3 h-3 inline mr-1" />{p.scheduled_date} {p.scheduled_time}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => copyText(p.content, p.id)} className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-500" title="Copy content"><Copy className="w-4 h-4" /></button>
                      {!p.approved ? (
                        <button onClick={() => approvePost(p.id)} className="p-2 hover:bg-emerald-900/50 rounded-lg text-zinc-500 hover:text-emerald-400" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => unapprovePost(p.id)} className="p-2 bg-emerald-900/30 rounded-lg text-emerald-400" title="Approved"><CheckCircle2 className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => editPost(p)} className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deletePost(p.id)} className="p-2 hover:bg-red-900/50 rounded-lg text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Board View */}
        {view === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(CONTENT_TYPES).map(([k, ct]) => {
              const Icon = ct.icon
              const typePosts = posts.filter(p => p.content_type === k)
              return (
                <div key={k} className="bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className={`p-3 border-b border-zinc-800 ${ct.color} rounded-t-xl`}>
                    <div className="flex items-center gap-2 text-white">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{ct.day}</span>
                    </div>
                    <p className="text-xs text-white/70 mt-1">{ct.description}</p>
                  </div>
                  <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                    {typePosts.map(p => {
                      const C = CHANNELS[p.channel as keyof typeof CHANNELS]
                      const ChIcon = C?.icon || FileText
                      return (
                        <div key={p.id} onClick={() => editPost(p)} className="p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 rounded ${C?.color}`}><ChIcon className="w-3 h-3 text-white" /></div>
                            {p.approved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            {p.virality_score && p.virality_score >= 80 && <Flame className="w-3 h-3 text-amber-400" />}
                          </div>
                          <h4 className="text-sm font-medium line-clamp-2">{p.title || 'Untitled'}</h4>
                          {p.scheduled_date && <p className="text-xs text-zinc-500 mt-2">{p.scheduled_date}</p>}
                        </div>
                      )
                    })}
                    {typePosts.length === 0 && <p className="text-xs text-zinc-600 text-center py-4">No {ct.day} posts</p>}
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
                <div className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600"><Brain className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-semibold">AI Content Generator</h2>
                  <p className="text-xs text-zinc-500">Brain Dump → Extract Ideas → Generate Week → Schedule</p>
                </div>
              </div>
              <button onClick={resetGenerator} className="p-2 hover:bg-zinc-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Mode Selection */}
            {genStep === 1 && (
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <button onClick={() => setGenMode('braindump')} className={`p-6 rounded-xl border-2 text-left transition-all ${genMode === 'braindump' ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}>
                    <Brain className="w-8 h-8 mb-3 text-violet-400" />
                    <h3 className="font-semibold mb-1">Brain Dump Mode</h3>
                    <p className="text-sm text-zinc-400">Paste raw notes from FigJam or meetings. AI extracts structured content ideas.</p>
                  </button>
                  <button onClick={() => setGenMode('draft')} className={`p-6 rounded-xl border-2 text-left transition-all ${genMode === 'draft' ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}>
                    <FileText className="w-8 h-8 mb-3 text-cyan-400" />
                    <h3 className="font-semibold mb-1">Draft Mode</h3>
                    <p className="text-sm text-zinc-400">Paste existing content for virality scoring and optimization.</p>
                  </button>
                </div>

                {genMode === 'braindump' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Paste your brain dump</label>
                      <textarea value={genBrainDump} onChange={e => setGenBrainDump(e.target.value)} rows={10} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm" placeholder="Paste raw notes, ideas, meeting transcripts, FigJam content..." />
                    </div>
                    <button onClick={processBrainDump} disabled={!genBrainDump.trim() || generating} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl font-medium disabled:opacity-50">
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Extract Ideas
                    </button>
                  </div>
                )}

                {genMode === 'draft' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Topic / Title</label>
                      <input type="text" value={genTopic} onChange={e => setGenTopic(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" placeholder="What's this content about?" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Hook / Log Line</label>
                      <textarea value={genHook} onChange={e => setGenHook(e.target.value)} rows={2} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" placeholder="One sentence that grabs attention..." />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Content Draft</label>
                      <textarea value={genDraft} onChange={e => setGenDraft(e.target.value)} rows={8} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm" placeholder="Paste your existing content for scoring..." />
                    </div>
                    <button onClick={() => generateBlog()} disabled={!genTopic || !genHook || generating} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl font-medium disabled:opacity-50">
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} {genDraft ? 'Score Content' : 'Generate Blog'}
                    </button>
                  </div>
                )}

                {generating && <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500" /><p className="text-sm text-zinc-500 mt-2">{genStatus}</p></div>}
              </div>
            )}

            {/* Step 2: Review Extracted Ideas */}
            {genStep === 2 && (
              <div className="p-6">
                <h3 className="font-semibold mb-4">Extracted Content Ideas</h3>
                {weeklyTheme && <div className="mb-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg"><span className="text-sm text-violet-300">Weekly Theme: {weeklyTheme}</span></div>}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {extractedIdeas.map((idea, i) => {
                    const ct = CONTENT_TYPES[idea.contentType as keyof typeof CONTENT_TYPES]
                    const pl = CONTENT_PILLARS.find(p => p.id === idea.pillar)
                    return (
                      <div key={i} className="p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 cursor-pointer" onClick={() => generateFromIdea(idea)}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{idea.topic}</h4>
                              {ct && <span className={`px-2 py-0.5 rounded text-xs ${ct.color} text-white`}>{ct.day}</span>}
                              {pl && <span className={`px-2 py-0.5 rounded text-xs ${pl.color} text-white`}>{pl.icon}</span>}
                              <span className={`px-2 py-0.5 rounded text-xs ${idea.priority === 'high' ? 'bg-red-500/20 text-red-300' : idea.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-700 text-zinc-400'}`}>{idea.priority}</span>
                            </div>
                            <p className="text-sm text-zinc-400 mb-2">{idea.hook}</p>
                            <div className="flex flex-wrap gap-1">
                              {idea.keyPoints.slice(0, 3).map((kp, j) => <span key={j} className="text-xs px-2 py-1 bg-zinc-700 rounded">• {kp}</span>)}
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-zinc-500" />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-4">
                  <button onClick={() => setGenStep(1)} className="px-4 py-2 text-zinc-400 hover:text-white">Back</button>
                </div>
              </div>
            )}

            {/* Step 3: Generating */}
            {genStep === 3 && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-violet-500 mb-4" />
                <p className="text-lg font-medium">{genStatus || 'Generating blog post...'}</p>
                <p className="text-sm text-zinc-500 mt-2">This takes 20-40 seconds</p>
              </div>
            )}

            {/* Step 4: Review Blog + Score */}
            {genStep === 4 && (
              <div className="p-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{genDraft ? 'Your Content' : 'Generated Blog'}</h3>
                      <button onClick={() => copyText(genBlog, 'blog')} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                    </div>
                    <textarea value={genBlog} onChange={e => setGenBlog(e.target.value)} rows={16} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-mono" />
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
                        {genScore.feedback?.length > 0 && genScore.overall < 95 && (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <h4 className="font-medium mb-2 text-sm">Improvements</h4>
                            <ul className="text-sm text-zinc-300 space-y-1">
                              {genScore.feedback.map((f: string, i: number) => <li key={i}>• {f}</li>)}
                            </ul>
                          </div>
                        )}
                        {genScore.overall >= 95 && (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                            <h4 className="font-medium mb-2 text-sm flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Ready for Weekly Content</h4>
                          </div>
                        )}
                      </>
                    )}
                    {generating && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-500" /><p className="text-sm text-zinc-500 mt-2">{genStatus}</p></div>}
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setGenStep(genMode === 'braindump' ? 2 : 1)} className="px-4 py-2 text-zinc-400 hover:text-white">Back</button>
                  <button onClick={generateWeeklyContent} disabled={generating || (genScore?.overall < 95)} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl font-medium disabled:opacity-50">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />} Generate Week
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Weekly Content Preview */}
            {genStep === 5 && (
              <div className="p-6">
                <h3 className="font-semibold mb-4">Weekly Content Preview</h3>
                <div className="grid md:grid-cols-5 gap-3 mb-6">
                  {/* Monday */}
                  <div className="bg-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-2 bg-green-600 text-white text-xs font-medium">Monday</div>
                    <div className="p-3">
                      <p className="text-xs text-zinc-400 mb-2">Engagement</p>
                      <p className="text-sm line-clamp-4">{genEngagement || 'Generating...'}</p>
                      {genEngagement && <button onClick={() => copyText(genEngagement, 'mon')} className="mt-2 text-xs text-violet-400"><Copy className="w-3 h-3 inline mr-1" />Copy</button>}
                    </div>
                  </div>
                  {/* Tuesday */}
                  <div className="bg-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-2 bg-violet-600 text-white text-xs font-medium">Tuesday</div>
                    <div className="p-3">
                      <p className="text-xs text-zinc-400 mb-2">Thread ({genThread.length} tweets)</p>
                      <p className="text-sm line-clamp-4">{genThread[0] || 'Generating...'}</p>
                      {genThread.length > 0 && <button onClick={() => copyText(genThread.join('\n\n'), 'tue')} className="mt-2 text-xs text-violet-400"><Copy className="w-3 h-3 inline mr-1" />Copy</button>}
                    </div>
                  </div>
                  {/* Wednesday */}
                  <div className="bg-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-2 bg-cyan-600 text-white text-xs font-medium">Wednesday</div>
                    <div className="p-3">
                      <p className="text-xs text-zinc-400 mb-2">Supporting</p>
                      <p className="text-sm line-clamp-4">{genSupporting || 'Generating...'}</p>
                      {genSupporting && <button onClick={() => copyText(genSupporting, 'wed')} className="mt-2 text-xs text-violet-400"><Copy className="w-3 h-3 inline mr-1" />Copy</button>}
                    </div>
                  </div>
                  {/* Thursday */}
                  <div className="bg-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-2 bg-amber-600 text-white text-xs font-medium">Thursday</div>
                    <div className="p-3">
                      <p className="text-xs text-zinc-400 mb-2">Blog + LinkedIn</p>
                      <p className="text-sm line-clamp-4">{genLinkedin?.substring(0, 100) || 'Generating...'}...</p>
                      {genLinkedin && <button onClick={() => copyText(genLinkedin, 'thu')} className="mt-2 text-xs text-violet-400"><Copy className="w-3 h-3 inline mr-1" />Copy LI</button>}
                    </div>
                  </div>
                  {/* Friday */}
                  <div className="bg-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-2 bg-rose-600 text-white text-xs font-medium">Friday</div>
                    <div className="p-3">
                      <p className="text-xs text-zinc-400 mb-2">Roundup ({genRoundup.length} tweets)</p>
                      <p className="text-sm line-clamp-4">{genRoundup[0] || 'Generating...'}</p>
                      {genRoundup.length > 0 && <button onClick={() => copyText(genRoundup.join('\n\n'), 'fri')} className="mt-2 text-xs text-violet-400"><Copy className="w-3 h-3 inline mr-1" />Copy</button>}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <h4 className="font-medium mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-violet-400" /> Schedule Week</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-zinc-400 mb-2">Week starting (Monday)</label>
                      <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl" />
                    </div>
                    <button onClick={scheduleWeek} disabled={!scheduleDate || generating} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-medium disabled:opacity-50">
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Schedule All
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Posts will be added to calendar as "In Review" status for approval</p>
                </div>

                <div className="flex justify-between mt-4">
                  <button onClick={() => setGenStep(4)} className="px-4 py-2 text-zinc-400 hover:text-white">Back</button>
                </div>
              </div>
            )}

            {generating && genStep !== 3 && genStep !== 4 && (
              <div className="p-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {genStatus}
                </div>
              </div>
            )}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Channel</label>
                  <div className="flex gap-2">
                    {Object.entries(CHANNELS).map(([k, c]) => {
                      const I = c.icon
                      return <button key={k} type="button" onClick={() => setFormData({ ...formData, channel: k })} className={`flex items-center gap-1 px-3 py-2 rounded-lg flex-1 text-xs ${formData.channel === k ? `${c.color} text-white` : 'bg-zinc-800 text-zinc-400'}`}><I className="w-3 h-3" /></button>
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Content Type</label>
                  <select value={formData.content_type} onChange={e => setFormData({ ...formData, content_type: e.target.value })} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm">
                    <option value="">None</option>
                    {Object.entries(CONTENT_TYPES).map(([k, ct]) => <option key={k} value={k}>{ct.day} - {ct.name}</option>)}
                  </select>
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
