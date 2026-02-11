import { NextResponse } from 'next/server'
import { getMenu, setMenu } from '../../../lib/store'

export async function GET() {
  const menu = await getMenu()
  return NextResponse.json(menu)
}

export async function POST(req) {
  const { action, item, password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const menu = await getMenu()

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
