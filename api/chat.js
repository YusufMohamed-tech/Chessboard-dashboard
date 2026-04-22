import OpenAI from 'openai'

export const config = {
  api: {
    bodyParser: true,
  },
}

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://chessboard-dashboard.vercel.app',
    'X-Title': 'Chessboard Dashboard'
  }
})

const SYSTEM_PROMPT = `أنت مساعد ذكي احترافي للوحة تحكم "تشيسبورد" (Chessboard) الخاصة بمتابعة المتسوقين السريين (Mystery Shoppers).
مهمتك هي الإجابة على أسئلة المستخدم (سواء كان مدير نظام، مدير عمليات، أو متسوق سري) بناءً على سياق البيانات المرفق.
قواعد هامة:
1. أجب باللغة العربية بأسلوب احترافي ومباشر.
2. اعتمد فقط على البيانات الموجودة في قسم "Context". لا تخترع بيانات غير موجودة.
3. إذا سُئلت عن شيء غير موجود في السياق، قل "عذراً، لا تتوفر لدي معلومات حول هذا الموضوع في البيانات الحالية."
4. يمكنك استخدام التنسيق (Markdown) لتوضيح البيانات كقوائم أو جداول إذا كان ذلك مناسباً.
5. الإجابات يجب أن تكون دقيقة وموجزة.
`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { messages, context } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Messages are required' })
    }

    const contextMessage = {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\n[Context Data]\n${context}\n[/Context Data]`
    }

    const apiMessages = [contextMessage, ...messages]

    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: apiMessages,
      temperature: 0.2,
      max_tokens: 1000,
    })

    return res.status(200).json({
      success: true,
      answer: response.choices[0]?.message?.content || 'لم أتمكن من صياغة إجابة.',
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return res.status(500).json({ success: false, error: error.message || 'Internal error' })
  }
}
