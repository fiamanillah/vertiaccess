import Cookies from 'js-cookie'

const ACCESS_TOKEN_KEY = 'v_access_token'
const ID_TOKEN_KEY = 'v_id_token'
const REFRESH_TOKEN_KEY = 'v_refresh_token'

interface CookieOptions {
  expires?: number | Date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'Strict' | 'lax' | 'Lax' | 'none' | 'None'
}

const defaultOptions: CookieOptions = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
}

export const setAuthCookies = (tokens: {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
}) => {
  // expiresIn is usually in seconds. js-cookie 'expires' is in days.
  // Converting seconds to days: expiresIn / (24 * 60 * 60)
  const expires = tokens.expiresIn / 86400

  Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, {
    ...defaultOptions,
    expires,
  })
  Cookies.set(ID_TOKEN_KEY, tokens.idToken, { ...defaultOptions, expires })
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, {
    ...defaultOptions,
    expires: 30, // Refresh token usually lasts longer, default to 30 days
  })
}

export const clearAuthCookies = () => {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' })
  Cookies.remove(ID_TOKEN_KEY, { path: '/' })
  Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' })
}

export const getAccessToken = () => Cookies.get(ACCESS_TOKEN_KEY)
export const getIdToken = () => Cookies.get(ID_TOKEN_KEY)
export const getRefreshToken = () => Cookies.get(REFRESH_TOKEN_KEY)
