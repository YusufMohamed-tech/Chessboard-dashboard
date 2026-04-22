export function summarizeContext(visits, shoppers, locations) {
  // We want to pass a compact representation of the data to the LLM to save tokens.
  const summary = []

  if (visits && visits.length > 0) {
    summary.push('--- Visits (Recent 20) ---')
    // Get the latest 20 visits to avoid blowing up the token limit
    const recentVisits = [...visits].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)
    recentVisits.forEach((v) => {
      const shopperName = shoppers?.find(s => s.id === v.assignedShopperId)?.name || 'Unknown'
      const officeName = v.officeName || locations?.find(l => l.id === v.locationId)?.name || 'Unknown'
      summary.push(`- ID: ${v.id}, Shopper: ${shopperName}, Location: ${officeName} (${v.city}), Date: ${v.date}, Status: ${v.status}, Score: ${v.percentage}%`)
    })
  }

  if (shoppers && shoppers.length > 0) {
    summary.push('\n--- Shoppers Overview ---')
    const activeShoppers = shoppers.filter(s => s.status === 'نشط').length
    summary.push(`Total Shoppers: ${shoppers.length}, Active: ${activeShoppers}`)
  }

  return summary.join('\n')
}

export async function askAiChatbot(messages, contextStr) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      context: contextStr
    })
  })

  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch response')
  }

  return data.answer
}
