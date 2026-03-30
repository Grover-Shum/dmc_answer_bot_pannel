import https from 'node:https'
import { URL } from 'node:url'

type Json = Record<string, unknown>

async function postJson(url: string, input: { headers: Record<string, string>; body: Json }) {
  const u = new URL(url)
  const payload = JSON.stringify(input.body)

  return await new Promise<{ statusCode: number; json: unknown }>((resolve, reject) => {
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: 'POST',
        headers: {
          ...input.headers,
          'Content-Length': Buffer.byteLength(payload).toString(),
        },
      },
      (resp) => {
        let raw = ''
        resp.setEncoding('utf8')
        resp.on('data', (chunk) => {
          raw += chunk
        })
        resp.on('end', () => {
          let parsed: unknown = null
          try {
            parsed = raw ? JSON.parse(raw) : null
          } catch {
            parsed = raw
          }
          resolve({ statusCode: resp.statusCode ?? 500, json: parsed })
        })
      },
    )
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

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

    const upstream = await postJson('https://bot-open-api.bytedance.net/v1/workflow/run', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: { workflow_id: workflowId },
    })

    res.statusCode = upstream.statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(upstream.json ?? { code: upstream.statusCode, msg: 'Upstream error' }))
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ code: 500, msg: e instanceof Error ? e.message : 'Server error' }))
  }
}
