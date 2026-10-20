import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const body = await request.json().catch(() => ({}))
    const client = await createClient()
    const result = await client.rpc(name, body)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[Neon RPC API Error]', err)
    return NextResponse.json({ data: null, error: { message: err.message || 'RPC execution error' } }, { status: 500 })
  }
}
