declare const process: { env: Record<string, string | undefined> }

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ code: 405, msg: 'Method Not Allowed' }))
      return
    }

    const token = (process.env.BYTEDANCE_BEARER_TOKEN ?? '').trim()
    const workflowId = (process.env.BYTEDANCE_WORKFLOW_ID ?? '').trim()
    const url = typeof req?.url === 'string' ? req.url : '/'
    let debug = false
    try {
      debug = new URL(url, 'https://x').searchParams.get('debug') === '1'
    } catch {
      debug = false
    }

    if (!token) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          code: 500,
          msg: 'Missing BYTEDANCE_BEARER_TOKEN',
          hasWorkflowId: Boolean(workflowId),
        }),
      )
      return
    }
    if (!workflowId) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          code: 500,
          msg: 'Missing BYTEDANCE_WORKFLOW_ID',
          hasToken: true,
        }),
      )
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    const upstream = await fetch('https://api.coze.cn/v1/workflow/run', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workflow_id: workflowId }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    const text = await upstream.text()
    let parsed: unknown = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = text
    }

    res.statusCode = upstream.status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    const preview = text.slice(0, 240)
    const body =
      parsed && typeof parsed === 'object'
        ? parsed
        : {
            code: upstream.status,
            msg: 'Upstream response is not JSON',
            rawPreview: preview,
          }
    const out =
      debug && body && typeof body === 'object'
        ? {
            ...(body as Record<string, unknown>),
            _debug: {
              upstreamStatus: upstream.status,
              hasToken: true,
              hasWorkflowId: true,
            },
          }
        : body
    res.end(JSON.stringify(out ?? { code: upstream.status, msg: 'Upstream error' }))
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(
      JSON.stringify({
        code: 500,
        msg: e instanceof Error ? e.message : 'Server error',
        hasToken: Boolean((process.env.BYTEDANCE_BEARER_TOKEN ?? '').trim()),
        hasWorkflowId: Boolean((process.env.BYTEDANCE_WORKFLOW_ID ?? '').trim()),
      }),
    )
  }
}
