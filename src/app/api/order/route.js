import { NextResponse } from 'next/server'
import { addOrder, getMenu, getOrders, setMenu } from '../../../lib/store'
import { getClientIp, getRequestPassword, verifyAccessPassword, verifyAdminPassword } from '../../../lib/auth'

const WINDOW_MS = 60 * 1000
const MAX_ORDERS_PER_WINDOW = 3

const rateLimitStore = globalThis.__mimiRateLimitStore || new Map()
globalThis.__mimiRateLimitStore = rateLimitStore

function checkOrderRateLimit(ip) {
  const now = Date.now()
  const history = rateLimitStore.get(ip) || []
  const recent = history.filter((time) => now - time < WINDOW_MS)

  if (recent.length >= MAX_ORDERS_PER_WINDOW) {
    return false
  }

  recent.push(now)
  rateLimitStore.set(ip, recent)
  return true
}

export async function GET(req) {
  const password = getRequestPassword(req)
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(await getOrders())
}

export async function POST(req) {
  const body = await req.json()
  const password = getRequestPassword(req, body)

  if (!verifyAccessPassword(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(req)
  if (!checkOrderRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many orders, 请稍后再试~' }, { status: 429 })
  }

  const { items, note } = body
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Empty order' }, { status: 400 })
  }

  const menu = await getMenu()

  const orderItems = items
    .map(({ id, qty }) => {
      const menuItem = menu.items.find((i) => i.id === id)
      return menuItem ? { name: menuItem.name, price: menuItem.price, qty } : null
    })
    .filter(Boolean)

  if (orderItems.length === 0) {
    return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
  }

  const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0)

  const order = {
    id: Date.now().toString(),
    items: orderItems,
    total,
    note: note || '',
    time: new Date().toISOString(),
    status: 'pending',
  }

  items.forEach(({ id, qty }) => {
    const idx = menu.items.findIndex((i) => i.id === id)
    if (idx >= 0) menu.items[idx].sales = (menu.items[idx].sales || 0) + qty
  })
  await setMenu(menu)

  await addOrder(order)

  if (process.env.DISCORD_WEBHOOK_URL) {
    const itemList = orderItems.map((i) => `  ${i.name} x${i.qty} = ${i.price * i.qty}🐱`).join('\n')
    const msg = `🐱 **新订单！**\n${itemList}\n💰 总计：${total} 咪咪币\n${note ? `📝 备注：${note}\n` : ''}🕐 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
    try {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg }),
      })
    } catch (e) {
      console.error('Discord webhook error:', e)
    }
  }

  return NextResponse.json({ ok: true, order })
}
