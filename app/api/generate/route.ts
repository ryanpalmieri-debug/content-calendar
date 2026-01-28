import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { action, topic, hook, content, channel, feedback, currentScore, brainDump, contentType } = await request.json()

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    let prompt = ''
    let systemPrompt = ''

    if (action === 'process_braindump') {
      systemPrompt = `You are an expert content strategist who extracts actionable content ideas from raw brainstorming notes. You identify themes, key insights, and potential hooks from messy, unstructured text.`

      prompt = `Process this raw brain dump from a content planning session and extract structured content ideas:

RAW BRAIN DUMP:
${brainDump}

Extract and organize into content ideas. For each idea, provide:
1. A clear topic/title
2. A compelling hook (one sentence that grabs attention)
3. Key points to cover
4. Suggested content type (engagement, thread, supporting, blog, roundup)
5. Suggested pillar (thought-leadership, industry-insights, personal-brand, engagement, promotional, educational)

Respond in this exact JSON format:
{
  "ideas": [
    {
      "topic": "Clear topic title",
      "hook": "One sentence hook that grabs attention",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "contentType": "thread|blog|engagement|supporting|roundup",
      "pillar": "thought-leadership|industry-insights|personal-brand|engagement|promotional|educational",
      "priority": "high|medium|low"
    }
  ],
  "themes": ["theme 1", "theme 2"],
  "weeklyAngle": "Suggested overarching theme for the week"
}

Only output the JSON, nothing else.`

    } else if (action === 'generate_blog') {
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
      systemPrompt = `You are an expert Twitter/X thread writer who creates viral content optimized for the X "For You" feed algorithm.

X ALGORITHM SCORING (from open-sourced code):
Final Score = Σ (weight × P(action))

POSITIVE WEIGHT ACTIONS:
- P(reply) — HIGH WEIGHT
- P(repost) — HIGH WEIGHT
- P(quote) — HIGH WEIGHT
- P(favorite) — MEDIUM WEIGHT
- P(dwell) — MEDIUM WEIGHT

NEGATIVE WEIGHT ACTIONS:
- P(not_interested) — penalizes irrelevant content
- P(block_author) — penalizes offensive content
- P(mute_author) — penalizes annoying content`

      prompt = `Convert this blog content into a VIRAL Twitter/X thread:

TITLE: ${topic}
HOOK: ${hook}
CONTENT:
${content}

Create a 6-8 tweet thread that MAXIMIZES reply, repost, and quote probability.

Format as JSON array:
["tweet 1", "tweet 2", ...]

Only output the JSON array, nothing else.`

    } else if (action === 'generate_linkedin') {
      systemPrompt = `You are an expert LinkedIn content creator who writes viral posts for tech executives and thought leaders.`

      prompt = `Convert this blog content into a LinkedIn post:

TITLE: ${topic}
HOOK: ${hook}
CONTENT:
${content}

Create a LinkedIn post (1200-1500 chars) with:
1. Strong opening hook
2. 3-4 key insights (numbered)
3. Engagement question at the end
4. Relevant hashtags

Write the LinkedIn post now. Do not include any explanations.`

    } else if (action === 'generate_engagement') {
      systemPrompt = `You are an expert at creating engaging, community-focused social media posts that spark conversation and build audience connection.`

      prompt = `Create a Monday engagement post for Twitter/X:

THEME: ${topic}
CONTEXT: ${hook}

This is a "What are you excited about this week?" style post to kick off the week and get followers interacting.

Create a post that:
1. Opens with an engaging question or prompt
2. Shares something the team is excited about
3. Invites followers to share their own thoughts
4. Uses a conversational, approachable tone
5. Max 280 characters

Write just the tweet, nothing else.`

    } else if (action === 'generate_supporting') {
      systemPrompt = `You are an expert at creating supporting Twitter content that expands on a main thesis while maintaining engagement.`

      prompt = `Create a Wednesday supporting tweet that expands on Tuesday's thread:

MAIN TOPIC: ${topic}
ORIGINAL HOOK: ${hook}
THREAD CONTENT SUMMARY:
${content?.substring(0, 1000)}

This tweet should:
1. Reference the earlier thread subtly
2. Add a new angle or insight
3. Drive people back to the main content
4. Encourage discussion
5. Max 280 characters

Write just the tweet, nothing else.`

    } else if (action === 'generate_roundup') {
      systemPrompt = `You are an expert at creating weekly roundup content that summarizes industry news and drives traffic to owned content.`

      prompt = `Create a Friday weekly roundup thread:

WEEK'S THEME: ${topic}
OUR BLOG LINK: [Blog URL]
CONTEXT: ${hook}

Create a 4-5 tweet thread that:
1. Opens with "This week in [industry]..." hook
2. Highlights 3-4 key industry developments
3. Ties it back to your perspective/thesis
4. Ends with CTA to read the full blog
5. Includes relevant hashtags

Format as JSON array:
["tweet 1", "tweet 2", ...]

Only output the JSON array, nothing else.`

    } else if (action === 'score_virality') {
      systemPrompt = `You are an expert content strategist who evaluates content using the X "For You" feed algorithm scoring system.

X ALGORITHM SCORING (from open-sourced Phoenix model):
Final Score = Σ (weight × P(action))

POSITIVE WEIGHT PREDICTIONS:
├── P(reply) — HIGH POSITIVE WEIGHT
├── P(repost) — HIGH POSITIVE WEIGHT  
├── P(quote) — HIGH POSITIVE WEIGHT
├── P(favorite) — MEDIUM POSITIVE WEIGHT
├── P(dwell) — MEDIUM POSITIVE WEIGHT

NEGATIVE WEIGHT PREDICTIONS:
├── P(not_interested) — NEGATIVE WEIGHT
├── P(block_author) — HIGH NEGATIVE WEIGHT
├── P(mute_author) — HIGH NEGATIVE WEIGHT`

      prompt = `Evaluate this content for X "For You" feed ranking:

TITLE: ${topic}
HOOK: ${hook}
CHANNEL: ${channel}
CONTENT:
${content?.substring(0, 3000)}

Score each factor from 0-100:

1. P(reply) - 20% weight
2. P(repost) - 18% weight
3. P(quote) - 12% weight
4. P(favorite) - 15% weight
5. P(dwell) - 10% weight
6. P(follow) - 5% weight
7. Relevance - 10% weight
8. Non-annoying - 10% weight

Respond in JSON:
{
  "scores": {
    "reply_probability": <0-100>,
    "repost_probability": <0-100>,
    "quote_probability": <0-100>,
    "favorite_probability": <0-100>,
    "dwell_probability": <0-100>,
    "follow_probability": <0-100>,
    "relevance": <0-100>,
    "non_annoying": <0-100>
  },
  "overall": <weighted average>,
  "feedback": ["improvement 1", "improvement 2", "improvement 3"],
  "strengths": ["strength 1", "strength 2"]
}

Only output JSON.`

    } else if (action === 'optimize_content') {
      systemPrompt = `You are an expert content optimizer who rewrites content to achieve 95%+ scores on the X algorithm.`

      prompt = `REWRITE this content to score 95%+:

CURRENT SCORE: ${currentScore}%
FEEDBACK:
${feedback?.join('\n- ')}

TOPIC: ${topic}
HOOK: ${hook}
CONTENT:
${content}

Optimize for P(reply), P(repost), P(quote) while maintaining quality.

Write the FULL optimized blog post with ## headers.`
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

    // Parse JSON responses
    if (action === 'process_braindump' || action === 'generate_thread' || action === 'generate_roundup' || action === 'score_virality') {
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
