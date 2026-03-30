export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ code: 405, msg: 'Method Not Allowed' }))
    return
  }

  const token = (process.env.BYTEDANCE_BEARER_TOKEN ?? '').trim()
  const workflowId = (process.env.BYTEDANCE_WORKFLOW_ID ?? '').trim()

  if (!token) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ code: 500, msg: 'Missing BYTEDANCE_BEARER_TOKEN' }))
    return
  }
  if (!workflowId) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ code: 500, msg: 'Missing BYTEDANCE_WORKFLOW_ID' }))
    return
  }

  const upstream = await fetch('https://bot-open-api.bytedance.net/v1/workflow/run', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workflow_id: workflowId }),
  })

  const json = await upstream.json().catch(() => null)
  res.statusCode = upstream.status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(json ?? { code: upstream.status, msg: 'Upstream error' }))
}

