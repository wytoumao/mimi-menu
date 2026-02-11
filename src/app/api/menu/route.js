import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'data', 'menu.json')

function readMenu() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
}

function writeMenu(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

export async function GET() {
  const menu = readMenu()
  return NextResponse.json(menu)
}

export async function POST(req) {
  const { action, item, password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const menu = readMenu()

  if (action === 'add') {
    item.id = Date.now().toString()
    item.sales = 0
    item.available = true
    menu.items.push(item)
  } else if (action === 'update') {
    const idx = menu.items.findIndex(i => i.id === item.id)
    if (idx >= 0) menu.items[idx] = { ...menu.items[idx], ...item }
  } else if (action === 'delete') {
    menu.items = menu.items.filter(i => i.id !== item.id)
  }

  writeMenu(menu)
  return NextResponse.json({ ok: true })
}
