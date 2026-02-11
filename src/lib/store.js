import { kv } from '@vercel/kv'
import initialMenuData from '../../data/menu.json'

const MENU_KEY = 'mimi:menu:v1'
const ORDERS_KEY = 'mimi:orders:v1'

let memoryMenu = normalizeMenu(structuredClone(initialMenuData))
let memoryOrders = []

function normalizeMenu(menu) {
  if (!menu || !Array.isArray(menu.items)) {
    return { items: [] }
  }

  return {
    ...menu,
    items: menu.items.map((item) => ({
      ...item,
      sales: item.sales || 0,
      available: item.available !== false,
    })),
  }
}

async function kvGet(key) {
  try {
    return await kv.get(key)
  } catch (error) {
    return null
  }
}

async function kvSet(key, value) {
  try {
    await kv.set(key, value)
    return true
  } catch (error) {
    return false
  }
}

export async function getMenu() {
  const stored = await kvGet(MENU_KEY)
  if (stored) {
    return normalizeMenu(stored)
  }

  const base = normalizeMenu(structuredClone(initialMenuData))
  const saved = await kvSet(MENU_KEY, base)
  if (saved) return base

  return memoryMenu
}

export async function setMenu(menu) {
  const normalized = normalizeMenu(menu)
  const saved = await kvSet(MENU_KEY, normalized)
  if (!saved) {
    memoryMenu = normalized
  }
  return normalized
}

export async function getOrders() {
  const orders = await kvGet(ORDERS_KEY)
  if (Array.isArray(orders)) return orders
  return memoryOrders
}

export async function addOrder(order) {
  const orders = await getOrders()
  const nextOrders = [order, ...orders].slice(0, 200)

  const saved = await kvSet(ORDERS_KEY, nextOrders)
  if (!saved) {
    memoryOrders = nextOrders
  }

  return order
}
