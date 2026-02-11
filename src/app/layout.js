import './globals.css'

export const metadata = {
  title: '咪咪家庭菜单',
  description: '咪咪家的外卖点单系统 🐱',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-bg-warm">{children}</body>
    </html>
  )
}
