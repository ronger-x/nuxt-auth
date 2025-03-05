import type { Storage } from 'unstorage'
import type { PublicConfig } from '../types'
import { useRuntimeConfig } from '#app'
import { createStorage, prefixStorage } from 'unstorage'
import localStorageDriver from 'unstorage/drivers/localstorage'
import memoryDriver from 'unstorage/drivers/memory'

let _storage: Storage | null = null

/**
 * 获取统一的认证存储系统
 */
export function useAuthStorage(): Storage {
  if (!_storage) {
    const config = useRuntimeConfig().public.auth as PublicConfig
    let baseStorage = createStorage({
      driver: memoryDriver()
    })
    // 客户端根据配置使用 localStorage
    if (process.client) {
      if (config.storage === 'localStorage') {
        try {
          // 使用 localStorage
          baseStorage = createStorage({
            driver: localStorageDriver({ base: 'app' })
          })
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
        catch (e) {
          // 如果 localStorage 不可用（如隐私模式），回退到内存存储
          console.warn('localStorage not available, falling back to memory storage')
          baseStorage = createStorage({
            driver: memoryDriver()
          })
        }
      }
    }
    _storage = prefixStorage(baseStorage, 'auth')
    return _storage
  }
  else {
    return _storage
  }
}

/**
 * 创建一个带有特定前缀的存储命名空间
 */
export function createNamespacedStorage(namespace: string): Storage {
  const storage = useAuthStorage()
  return prefixStorage(storage, `${namespace}:`)
}
