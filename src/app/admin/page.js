'use client'
import { useState, useEffect } from 'react'

export default function Admin() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [menu, setMenu] = useState({ categories: [], items: [] })
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('menu')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', category: '肉菜', price: '', description: '', image: '' })

  const login = () => {
    setAuthed(true)
    loadData()
  }

  const loadData = async () => {
    const m = await fetch('/api/menu').then(r => r.json())
    setMenu(m)
    const o = await fetch(`/api/order?password=${password}`).then(r => r.json())
    if (Array.isArray(o)) setOrders(o)
  }

  const saveItem = async () => {
    const action = editing ? 'update' : 'add'
    const item = { ...form, price: Number(form.price) }
    if (editing) item.id = editing
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, item, password })
    })
    setEditing(null)
    setForm({ name: '', category: '肉菜', price: '', description: '', image: '' })
    loadData()
  }

  const deleteItem = async (id) => {
    if (!confirm('确定删除？')) return
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', item: { id }, password })
    })
    loadData()
  }

  const editItem = (item) => {
    setEditing(item.id)
    setForm({ name: item.name, category: item.category, price: item.price, description: item.description || '', image: item.image || '' })
    setTab('menu')
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-bg-warm flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-80">
          <h1 className="text-xl font-bold text-center mb-4">🐱 管理后台</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="输入管理密码" className="w-full p-3 border rounded-xl mb-3 text-sm focus:outline-none focus:border-primary" onKeyDown={e => e.key === 'Enter' && login()} />
          <button onClick={login} className="w-full bg-primary text-white py-3 rounded-xl font-bold">进入</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-bg-warm p-4">
      <h1 className="text-xl font-bold text-center mb-4">🐱 咪咪菜单管理</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('menu')} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tab === 'menu' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}>菜品管理</button>
        <button onClick={() => { setTab('orders'); loadData() }} className={`flex-1 py-2 rounded-xl font-bold text-sm ${tab === 'orders' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}>订单历史</button>
      </div>

      {tab === 'menu' && (
        <>
          {/* Add/Edit form */}
          <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <h2 className="font-bold text-sm mb-3">{editing ? '编辑菜品' : '添加菜品'}</h2>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="菜名" className="p-2 border rounded-lg text-sm focus:outline-none" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-2 border rounded-lg text-sm">
                {menu.categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="价格(咪咪币)" type="number" className="p-2 border rounded-lg text-sm focus:outline-none" />
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="描述" className="p-2 border rounded-lg text-sm focus:outline-none" />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={saveItem} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">{editing ? '保存' : '添加'}</button>
              {editing && <button onClick={() => { setEditing(null); setForm({ name: '', category: '肉菜', price: '', description: '', image: '' }) }} className="text-gray-400 text-sm">取消</button>}
            </div>
          </div>

          {/* Item list */}
          {menu.items.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm mb-2 flex justify-between items-center">
              <div>
                <span className="font-bold text-sm">{item.name}</span>
                <span className="text-xs text-gray-400 ml-2">{item.category}</span>
                <span className="text-xs text-primary ml-2">{item.price}🐱</span>
                <span className="text-xs text-gray-300 ml-2">销量{item.sales}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editItem(item)} className="text-xs text-primary">编辑</button>
                <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400">删除</button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'orders' && (
        <div>
          {orders.length === 0 && <p className="text-center text-gray-400 py-8">暂无订单</p>}
          {orders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{new Date(order.time).toLocaleString('zh-CN')}</span>
                <span className="text-primary font-bold">{order.total}🐱</span>
              </div>
              {order.items.map((item, i) => (
                <div key={i} className="text-sm">{item.name} x{item.qty} = {item.price * item.qty}🐱</div>
              ))}
              {order.note && <div className="text-xs text-gray-400 mt-1">📝 {order.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
