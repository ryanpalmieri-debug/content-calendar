import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { action, topic, hook, content, channel } = await request.json()

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    let prompt = ''
    let systemPrompt = ''

    if (action === 'generate_blog') {
      systemPrompt = `You are an expert content writer specializing in Web3, AI, and technology thought leadership. You write for sophisticated audiences who appreciate nuanced analysis and bold perspectives. Your style is clear and direct, uses concrete examples, balances technical depth with accessibility, and writes in a confident, authoritative voice.`

      prompt = `Write a long-form blog post for Paragraph (a Web3 publishing platform) on the following topic:

TOPIC: ${topic}
HOOK/LOG LINE: ${hook}

Structure the post with:
1. A compelling opening that expands on the hook
2. 4-6 main sections with clear headers
3. Concrete examples, data points, or case studies where relevant
4. A strong conclusion with implications and/or call to action

Target length: 1500-2500 words
Tone: Authoritative but accessible, thought leadership for Web3/AI audience

Write the full blog post now. Use markdown formatting with ## for headers.`

    } else if (action === 'generate_thread') {
      systemPrompt = `You are an expert Twitter/X thread writer who creates viral content in the Web3 and AI space. Your threads start with an irresistible hook, use short punchy sentences, include strategic line breaks, and end with engagement drivers.`

      prompt = `Convert this blog content into a compelling Twitter/X thread:

TITLE: ${topic}
HOOK: ${hook}
CONTENT:
${content}

Create a 6-8 tweet thread that:
1. Opens with a scroll-stopping hook
2. Distills the key insights into tweet-sized chunks
3. Uses emojis strategically (not excessively)
4. Ends with a CTA (repost, follow, link to full post)

Format your response as a JSON array of strings, each string being one tweet (max 280 chars each):
["tweet 1", "tweet 2", ...]

Only output the JSON array, nothing else.`

    } else if (action === 'generate_linkedin') {
      systemPrompt = `You are an expert LinkedIn content creator who writes viral posts for tech executives and thought leaders. Your posts open with bold attention-grabbing lines, use strategic formatting, and end with engagement questions.`

      prompt = `Convert this blog content into a LinkedIn post:

TITLE: ${topic}
HOOK: ${hook}
CONTENT:
${content}

Create a LinkedIn post that:
1. Opens with the hook or an even stronger opening line
2. Tells a brief narrative or sets up the problem
3. Delivers 3-4 key insights (use numbered formatting)
4. Ends with a takeaway and engagement question
5. Includes relevant hashtags at the end

Target length: 1200-1500 characters

Write the LinkedIn post now. Do not include any explanations, just the post content.`

    } else if (action === 'score_virality') {
      systemPrompt = `You are an expert content strategist who evaluates content for viral potential. You assess content across 7 key criteria and provide actionable feedback.`

      prompt = `Evaluate this content for viral potential:

TITLE: ${topic}
HOOK: ${hook}
CHANNEL: ${channel}
CONTENT:
${content?.substring(0, 2000)}

Score each criterion from 0-100:

1. HOOK STRENGTH (20% weight): Does the opening create curiosity?
2. EMOTIONAL TRIGGER (18% weight): Does it provoke fear, aspiration, controversy, or excitement?
3. SHAREABILITY (15% weight): Would someone tag a friend or share this?
4. NOVELTY FACTOR (15% weight): Is this a fresh take or recycled narrative?
5. CLARITY (12% weight): Can a smart 15-year-old understand the core idea?
6. TIMING RELEVANCE (10% weight): Is this topic trending or culturally relevant?
7. CALL TO ACTION (10% weight): Does it invite engagement?

Respond in this exact JSON format:
{
  "scores": {
    "hook": <number>,
    "emotion": <number>,
    "shareability": <number>,
    "novelty": <number>,
    "clarity": <number>,
    "timing": <number>,
    "cta": <number>
  },
  "overall": <weighted average as integer>,
  "feedback": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "strengths": ["<strength 1>", "<strength 2>"]
}

Only output the JSON, nothing else.`
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const data = await response.json()
    const generatedContent = data.content[0].text

    if (action === 'generate_thread' || action === 'score_virality') {
      try {
        let jsonStr = generatedContent
        if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        }
        const parsed = JSON.parse(jsonStr.trim())
        return NextResponse.json({ result: parsed })
      } catch (e) {
        console.error('JSON parse error:', e)
        return NextResponse.json({ result: generatedContent })
      }
    }

    return NextResponse.json({ result: generatedContent })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
