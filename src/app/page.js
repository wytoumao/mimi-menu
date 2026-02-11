'use client'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [menu, setMenu] = useState({ categories: [], items: [] })
  const [cart, setCart] = useState({})
  const [activeCategory, setActiveCategory] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [note, setNote] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const sectionRefs = useRef({})

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(data => {
      setMenu(data)
      if (data.categories.length) setActiveCategory(data.categories[0])
    })
  }, [])

  const addToCart = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const removeFromCart = (id) => setCart(c => {
    const n = { ...c }
    if (n[id] > 1) n[id]--
    else delete n[id]
    return n
  })

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const item = menu.items.find(i => i.id === id)
    return item ? { ...item, qty } : null
  }).filter(Boolean)

  const totalPrice = cartItems.reduce((s, i) => s + i.price * i.qty, 0)
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0)

  const submitOrder = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
          note
        })
      })
      if (res.ok) {
        setOrderSuccess(true)
        setCart({})
        setNote('')
        setTimeout(() => {
          setOrderSuccess(false)
          setShowOrder(false)
          setShowCart(false)
        }, 2000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToCategory = (cat) => {
    setActiveCategory(cat)
    sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-bg-warm">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-white text-center rounded-b-2xl shadow-lg">
        <div className="text-3xl mb-1">🐱</div>
        <h1 className="text-xl font-bold">咪咪家庭菜单</h1>
        <p className="text-xs opacity-80 mt-1">新鲜现做 · 用心烹饪 · 咪咪币结算</p>
      </div>

      {/* Body: categories + items */}
      <div className="flex flex-1 overflow-hidden mt-2">
        {/* Left categories */}
        <div className="w-20 shrink-0 bg-white rounded-tr-xl overflow-y-auto hide-scrollbar">
          {menu.categories.map(cat => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={`w-full py-3 text-sm text-center border-l-3 transition-all ${
                activeCategory === cat
                  ? 'bg-bg-warm text-primary font-bold border-l-primary border-l-[3px]'
                  : 'text-gray-500 border-l-transparent border-l-[3px]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right items */}
        <div className="flex-1 overflow-y-auto px-3 pb-24 hide-scrollbar">
          {menu.categories.map(cat => {
            const catItems = menu.items.filter(i => i.category === cat && i.available)
            if (!catItems.length) return null
            return (
              <div key={cat} ref={el => sectionRefs.current[cat] = el}>
                <h2 className="text-sm font-bold text-gray-700 py-2 sticky top-0 bg-bg-warm z-10">{cat}</h2>
                {catItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-3 mb-2 flex gap-3 shadow-sm">
                    {/* Placeholder image */}
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-2xl shrink-0">
                      {item.category === '肉菜' ? '🥩' : item.category === '素菜' ? '🥬' : item.category === '主食' ? '🍚' : item.category === '水果' ? '🍎' : '🍮'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                      <p className="text-xs text-gray-300 mt-0.5">月售 {item.sales}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-bold text-sm">{item.price} 🐱</span>
                        <div className="flex items-center gap-2">
                          {cart[item.id] > 0 && (
                            <>
                              <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full border border-primary text-primary text-sm flex items-center justify-center">−</button>
                              <span className="text-sm font-bold w-4 text-center">{cart[item.id]}</span>
                            </>
                          )}
                          <button onClick={() => addToCart(item.id)} className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center shadow">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom cart bar */}
      {totalQty > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gray-800 text-white rounded-t-2xl p-3 flex items-center justify-between shadow-2xl z-50">
          <div onClick={() => setShowCart(!showCart)} className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <span className="text-2xl">🛒</span>
              <span className="absolute -top-1 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{totalQty}</span>
            </div>
            <span className="font-bold text-lg ml-2">{totalPrice} 🐱</span>
          </div>
          <button onClick={() => setShowOrder(true)} className="bg-primary px-6 py-2 rounded-full font-bold text-sm">
            去下单
          </button>
        </div>
      )}

      {/* Cart detail popup */}
      {showCart && totalQty > 0 && (
        <div className="fixed inset-0 z-40" onClick={() => setShowCart(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-16 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-2xl p-4 max-h-[50vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">已选菜品</h3>
              <button onClick={() => { setCart({}); setShowCart(false) }} className="text-xs text-gray-400">清空</button>
            </div>
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-primary ml-2">{item.price}🐱</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full border border-primary text-primary text-sm flex items-center justify-center">−</button>
                  <span className="text-sm w-4 text-center">{item.qty}</span>
                  <button onClick={() => addToCart(item.id)} className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order confirmation modal */}
      {showOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => !submitting && setShowOrder(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5" onClick={e => e.stopPropagation()}>
            {orderSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-lg font-bold text-gray-800">下单成功！</h3>
                <p className="text-sm text-gray-400 mt-1">咪咪正在准备你的美食~</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg text-gray-800 mb-3">确认订单</h3>
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between py-1.5 text-sm">
                    <span>{item.name} x{item.qty}</span>
                    <span className="text-primary">{item.price * item.qty} 🐱</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                  <span>合计</span>
                  <span className="text-primary">{totalPrice} 🐱</span>
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="备注（如：少辣、多饭...）"
                  className="w-full mt-3 p-3 border border-gray-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="w-full mt-3 bg-primary text-white py-3 rounded-xl font-bold text-base disabled:opacity-50"
                >
                  {submitting ? '提交中...' : `提交订单 · ${totalPrice} 🐱`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
