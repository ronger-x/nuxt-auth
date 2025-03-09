import type { RouterMethod } from 'h3'

export interface PublicConfig {
  backendEnabled?: boolean
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
    enabled?: boolean
    responseTokenPointer: string
    refreshRequestTokenPointer?: string
    cookieName?: string
    maxAge?: number
  }
  session: {
    responseSessionPointer: string
  }
}

export type ModuleOptions = PublicConfig

export interface TokenMeta {
  token: string
  expires: number
}

export interface ResponseMeta<T> {
  code: number
  data: T
  message: string
}

export interface AuthTokenResponse {
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
