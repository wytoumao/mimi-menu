import { NextResponse } from 'next/server'
import { getRequestPassword, verifyAccessPassword } from '../../../lib/auth'

export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  const password = getRequestPassword(req, body)

  if (!verifyAccessPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
