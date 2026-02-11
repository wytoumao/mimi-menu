export function getRequestPassword(req, body = null) {
  const headerPassword = req.headers.get('x-access-password')
  if (headerPassword) return headerPassword

  const { searchParams } = new URL(req.url)
  const queryPassword = searchParams.get('password') || searchParams.get('accessPassword')
  if (queryPassword) return queryPassword

  if (body && typeof body === 'object') {
    if (body.accessPassword) return body.accessPassword
    if (body.password) return body.password
  }

  return ''
}

export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

export function verifyAccessPassword(password) {
  const expected = process.env.ACCESS_PASSWORD
  if (!expected) return false
  return password === expected
}

export function verifyAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return password === expected
}
