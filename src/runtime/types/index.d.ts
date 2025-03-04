import type { RouterMethod } from 'h3'

export interface PublicConfig {
  backendEnabled?: boolean
  authBaseUrl?: string
  baseUrl: string
  enableGlobalAuthMiddleware?: boolean
  loggedInFlagName?: string
  storage?: 'cookie' | 'localStorage'
  redirect: {
    login: string
    logout: string
    home: string
    callback?: string
    passwordReset?: string
    emailVerify?: string
  }
  endpoints?: {
    signIn?: { path?: string, method?: RouterMethod }
    signOut?: { path?: string, method?: RouterMethod } | false
    signUp?: { path?: string, method?: RouterMethod } | false
    getSession?: { path?: string, method?: RouterMethod }
    refresh?: { path?: string, method?: RouterMethod }
    requestPasswordReset?: { path?: string, method?: RouterMethod }
    resetPassword?: { path?: string, method?: RouterMethod }
    requestEmailVerify?: { path?: string, method?: RouterMethod }
    changePassword?: { path?: string, method?: RouterMethod }
  }
  accessToken: {
    responseTokenPointer: string
    type?: string
    cookieName?: string
    headerName?: string
    maxAge?: number
  }
  refreshToken: {
    responseTokenPointer: string
    refreshRequestTokenPointer?: string
    cookieName?: string
    maxAge?: number
  }
}

export type ModuleOptions = PublicConfig

export interface User {
  id: string | number
  [key: string]: any
}

export interface AuthSession {
  user: User | null
  loggedIn: boolean
  lastRefreshedAt?: number
}

export interface TokenMeta {
  token: string
  expiresAt: number
}

export interface SpringBootAuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresIn: number
}
