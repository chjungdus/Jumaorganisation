export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API-Key nicht konfiguriert' })

  const { imageBase64, mediaType = 'image/jpeg' } = req.body || {}
  if (!imageBase64) return res.status(400).json({ error: 'Kein Bild übermittelt' })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: 'Schätze die Makronährstoffe für die gesamte abgebildete Portion Essen. Antworte NUR mit diesem JSON ohne Markdown oder Erklärungen:\n{"kcal":450,"protein":35,"carbs":40,"fat":15,"beschreibung":"Hähnchen mit Reis"}\nFalls kein Essen erkennbar: {"error":"Kein Essen erkannt"}',
          },
        ],
      }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return res.status(502).json({ error: err.error?.message || 'Claude API Fehler' })
  }

  const data = await response.json()
  const text = data.content?.[0]?.text?.trim() || ''

  try {
    const macros = JSON.parse(text)
    return res.status(200).json(macros)
  } catch {
    return res.status(200).json({ error: 'Antwort konnte nicht gelesen werden', raw: text })
  }
}
