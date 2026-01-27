import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { action, topic, hook, content, channel, feedback, currentScore } = await request.json()

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
      systemPrompt = `You are an expert Twitter/X thread writer who creates viral content optimized for the X "For You" feed algorithm.

X ALGORITHM SCORING (from open-sourced code):
The algorithm predicts engagement probabilities and combines them with weights:
Final Score = Σ (weight × P(action))

POSITIVE WEIGHT ACTIONS (content should maximize these):
- P(reply) — HIGH WEIGHT — replies signal deep engagement
- P(repost) — HIGH WEIGHT — amplification and endorsement
- P(quote) — HIGH WEIGHT — engagement + original take
- P(favorite) — MEDIUM WEIGHT — basic approval
- P(dwell) — MEDIUM WEIGHT — time spent reading
- P(click) — MEDIUM WEIGHT — curiosity
- P(follow_author) — MEDIUM WEIGHT — conversion

NEGATIVE WEIGHT ACTIONS (content should minimize these):
- P(not_interested) — penalizes irrelevant content
- P(block_author) — penalizes offensive content
- P(mute_author) — penalizes annoying content
- P(report) — heavily penalizes policy violations

Your threads must MAXIMIZE reply + repost + quote probability while MINIMIZING not_interested + block signals.`

      prompt = `Convert this blog content into a VIRAL Twitter/X thread optimized for the X For You algorithm:

TITLE: ${topic}
HOOK: ${hook}
CONTENT:
${content}

Create a 6-8 tweet thread that MAXIMIZES:
1. P(reply) — include controversial takes, questions, challenges that DEMAND responses
2. P(repost) — make insights so valuable people must share them
3. P(quote) — leave room for people to add their own take
4. P(dwell) — each tweet should take 5+ seconds to fully process
5. P(follow) — demonstrate unique expertise worth following

While MINIMIZING:
- P(not_interested) — stay relevant to Web3/AI audience
- P(block/mute) — avoid being annoying or spammy

THREAD STRUCTURE:
- Tweet 1: Scroll-stopping hook (controversial/counterintuitive)
- Tweets 2-5: Key insights (each should be reply-worthy)
- Tweet 6: Question or challenge to drive replies
- Tweet 7-8: CTA + link

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
      systemPrompt = `You are an expert content strategist who evaluates content using the X "For You" feed algorithm scoring system.

X ALGORITHM SCORING (from open-sourced Phoenix model):
The Grok-based transformer predicts probabilities for multiple actions, then combines them:

Final Score = Σ (weight × P(action))

POSITIVE WEIGHT PREDICTIONS:
├── P(reply) — HIGH POSITIVE WEIGHT
├── P(repost) — HIGH POSITIVE WEIGHT  
├── P(quote) — HIGH POSITIVE WEIGHT
├── P(favorite) — MEDIUM POSITIVE WEIGHT
├── P(click) — MEDIUM POSITIVE WEIGHT
├── P(dwell) — MEDIUM POSITIVE WEIGHT (time spent)
├── P(follow_author) — MEDIUM POSITIVE WEIGHT
└── P(share) — MEDIUM POSITIVE WEIGHT

NEGATIVE WEIGHT PREDICTIONS:
├── P(not_interested) — NEGATIVE WEIGHT
├── P(block_author) — HIGH NEGATIVE WEIGHT
├── P(mute_author) — HIGH NEGATIVE WEIGHT
└── P(report) — VERY HIGH NEGATIVE WEIGHT

Content ranks HIGH when it maximizes positive action probabilities while minimizing negative ones.`

      prompt = `Evaluate this content for X "For You" feed ranking potential:

TITLE: ${topic}
HOOK: ${hook}
CHANNEL: ${channel}
CONTENT:
${content?.substring(0, 3000)}

Score each X algorithm prediction factor from 0-100:

POSITIVE FACTORS (these boost ranking):
1. P(reply) - 20% weight: Will people NEED to respond? Controversial? Challenges beliefs?
2. P(repost) - 18% weight: Is this valuable enough to share with followers?
3. P(quote) - 12% weight: Does this invite people to add their own take?
4. P(favorite) - 15% weight: Will people like this?
5. P(dwell) - 10% weight: Will people spend time reading/thinking about this?
6. P(follow) - 5% weight: Does this demonstrate expertise worth following?

NEGATIVE FACTORS (these hurt ranking):
7. P(not_interested) - INVERSE 10% weight: How relevant is this to target audience?
8. P(block/mute) - INVERSE 10% weight: Is this annoying, spammy, or offensive?

BE STRICT: 
- 95+ = Genuinely viral potential (rare)
- 80-94 = Strong engagement likely
- 60-79 = Decent performance
- Below 60 = Needs significant work

Respond in this exact JSON format:
{
  "scores": {
    "reply_probability": <0-100>,
    "repost_probability": <0-100>,
    "quote_probability": <0-100>,
    "favorite_probability": <0-100>,
    "dwell_probability": <0-100>,
    "follow_probability": <0-100>,
    "relevance": <0-100 - inverse of not_interested>,
    "non_annoying": <0-100 - inverse of block/mute probability>
  },
  "overall": <weighted average as integer>,
  "feedback": ["<specific actionable improvement 1>", "<specific actionable improvement 2>", "<specific actionable improvement 3>"],
  "strengths": ["<strength 1>", "<strength 2>"]
}

Only output the JSON, nothing else.`

    } else if (action === 'optimize_content') {
      systemPrompt = `You are an expert content optimizer who rewrites content to achieve 95%+ scores on the X "For You" algorithm.

X ALGORITHM OPTIMIZATION (from open-sourced Phoenix model):
To rank high, content must MAXIMIZE:
- P(reply): Controversial takes, questions, challenges that demand responses
- P(repost): Insights so valuable people must share them
- P(quote): Room for others to add their take
- P(favorite): Generally likeable/agreeable core message
- P(dwell): Depth that requires time to process

While MINIMIZING:
- P(not_interested): Stay relevant to target audience
- P(block/mute): Don't be annoying, spammy, or preachy
- P(report): No policy violations

KEY TACTICS:
1. Open with a pattern interrupt (counterintuitive claim)
2. Include at least one "hot take" that demands a reply
3. Add specific numbers/data (increases credibility + shareability)
4. Use rhetorical questions (increases dwell time)
5. Leave room for disagreement (increases quote-tweets)
6. End with a question or challenge (maximizes replies)`

      prompt = `REWRITE this content to score 95%+ on the X algorithm:

CURRENT SCORE: ${currentScore}%
FEEDBACK TO ADDRESS:
${feedback?.join('\n- ')}

ORIGINAL TOPIC: ${topic}
ORIGINAL HOOK: ${hook}
ORIGINAL CONTENT:
${content}

OPTIMIZATION REQUIREMENTS:
1. MAXIMIZE P(reply): Add controversial takes, direct challenges, questions
2. MAXIMIZE P(repost): Make insights concrete, actionable, and shareable
3. MAXIMIZE P(quote): Leave gaps for readers to add their perspective
4. MAXIMIZE P(dwell): Add depth, specifics, and thought-provoking angles
5. MINIMIZE P(not_interested): Stay laser-focused on Web3/AI audience
6. MINIMIZE P(block/mute): Avoid being preachy, repetitive, or annoying

SPECIFIC TACTICS TO APPLY:
- Open with a counterintuitive claim that challenges conventional wisdom
- Include at least 2-3 "reply bait" moments (hot takes, challenges)
- Add specific numbers, examples, or predictions
- Use rhetorical questions that make readers pause
- End sections with cliffhangers or provocative statements
- Vary sentence length for better rhythm and dwell time

Write the FULL optimized blog post now. Use markdown formatting with ## for headers.
Target: 95%+ algorithm score.`
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
