import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ORDERS_PATH = path.join(process.cwd(), 'data', 'orders.json')
const MENU_PATH = path.join(process.cwd(), 'data', 'menu.json')

function readOrders() {
  return JSON.parse(fs.readFileSync(ORDERS_PATH, 'utf-8'))
}

function writeOrders(data) {
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(data, null, 2))
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(readOrders())
}

export async function POST(req) {
  const { items, note } = await req.json()
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Empty order' }, { status: 400 })
  }

  // Read menu to get item details
  const menu = JSON.parse(fs.readFileSync(MENU_PATH, 'utf-8'))

  const orderItems = items.map(({ id, qty }) => {
    const menuItem = menu.items.find(i => i.id === id)
    return menuItem ? { name: menuItem.name, price: menuItem.price, qty } : null
  }).filter(Boolean)

  const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0)

  const order = {
    id: Date.now().toString(),
    items: orderItems,
    total,
    note: note || '',
    time: new Date().toISOString(),
    status: 'pending'
  }

  // Update sales
  items.forEach(({ id, qty }) => {
    const idx = menu.items.findIndex(i => i.id === id)
    if (idx >= 0) menu.items[idx].sales = (menu.items[idx].sales || 0) + qty
  })
  fs.writeFileSync(MENU_PATH, JSON.stringify(menu, null, 2))

  const orders = readOrders()
  orders.unshift(order)
  writeOrders(orders)

  // Discord webhook
  if (process.env.DISCORD_WEBHOOK_URL) {
    const itemList = orderItems.map(i => `  ${i.name} x${i.qty} = ${i.price * i.qty}🐱`).join('\n')
    const msg = `🐱 **新订单！**\n${itemList}\n💰 总计：${total} 咪咪币\n${note ? `📝 备注：${note}\n` : ''}🕐 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
    try {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg })
      })
    } catch (e) {
      console.error('Discord webhook error:', e)
    }
  }

  return NextResponse.json({ ok: true, order })
}
