import { NextResponse } from 'next/server'
import { getMenu, setMenu } from '../../../lib/store'
import { getRequestPassword, verifyAdminPassword } from '../../../lib/auth'

export async function GET() {
  const menu = await getMenu()
  return NextResponse.json(menu)
}

async function mutateMenu(req, action, reqItem, parsedBody = null) {
  const body = parsedBody || {}
  const password = getRequestPassword(req, body)
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const menu = await getMenu()
  const item = reqItem || body.item

  if (action === 'add') {
    item.id = Date.now().toString()
    item.sales = 0
    item.available = true
    menu.items.push(item)
  } else if (action === 'update') {
    const idx = menu.items.findIndex((i) => i.id === item.id)
    if (idx >= 0) menu.items[idx] = { ...menu.items[idx], ...item }
  } else if (action === 'delete') {
    menu.items = menu.items.filter((i) => i.id !== item.id)
  }

  await setMenu(menu)
  return NextResponse.json({ ok: true })
}

export async function POST(req) {
  const body = await req.json()
  return mutateMenu(req, body.action, body.item, body)
}

export async function PUT(req) {
  const body = await req.json()
  return mutateMenu(req, 'update', body.item, body)
}

export async function DELETE(req) {
  const body = await req.json().catch(() => ({}))
  return mutateMenu(req, 'delete', body.item, body)
}
