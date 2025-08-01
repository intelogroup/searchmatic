import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { errorLogger } from './error-logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create the base Supabase client
const baseSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Enhanced Supabase client with comprehensive error logging
class EnhancedSupabaseClient {
  private client = baseSupabase

  // Proxy all methods to the base client while adding error logging
  get auth() {
    return this.client.auth
  }

  get storage() {
    return this.client.storage
  }

  get realtime() {
    return this.client.realtime
  }

  from<T extends keyof Database['public']['Tables']>(table: T) {
    const originalFrom = this.client.from(table)
    
    // Enhance query methods with error logging
    return {
      ...originalFrom,
      select: async (...args: Parameters<typeof originalFrom.select>) => {
        const startTime = performance.now()
        try {
          const result = await originalFrom.select(...args)
          const duration = performance.now() - startTime
          
          if (result.error) {
            errorLogger.logSupabaseError(`SELECT from ${String(table)}`, result.error, {
              action: 'select',
              metadata: { table, args, duration }
            })
          } else {
            errorLogger.logPerformance(`Supabase SELECT from ${String(table)}`, duration, {
              feature: 'supabase',
              action: 'select',
              metadata: { table, recordCount: result.data?.length }
            })
          }
          
          return result
        } catch (error) {
          const duration = performance.now() - startTime
          errorLogger.logSupabaseError(`SELECT from ${String(table)}`, error, {
            action: 'select',
            metadata: { table, args, duration, caught: true }
          })
          throw error
        }
      },

      insert: async (...args: Parameters<typeof originalFrom.insert>) => {
        const startTime = performance.now()
        try {
          const result = await originalFrom.insert(...args)
          const duration = performance.now() - startTime
          
          if (result.error) {
            errorLogger.logSupabaseError(`INSERT into ${String(table)}`, result.error, {
              action: 'insert',
              metadata: { table, args, duration }
            })
          } else {
            errorLogger.logPerformance(`Supabase INSERT into ${String(table)}`, duration, {
              feature: 'supabase',
              action: 'insert',
              metadata: { table, recordCount: Array.isArray(args[0]) ? args[0].length : 1 }
            })
          }
          
          return result
        } catch (error) {
          const duration = performance.now() - startTime
          errorLogger.logSupabaseError(`INSERT into ${String(table)}`, error, {
            action: 'insert',
            metadata: { table, args, duration, caught: true }
          })
          throw error
        }
      },

      update: async (...args: Parameters<typeof originalFrom.update>) => {
        const startTime = performance.now()
        try {
          const result = await originalFrom.update(...args)
          const duration = performance.now() - startTime
          
          if (result.error) {
            errorLogger.logSupabaseError(`UPDATE ${String(table)}`, result.error, {
              action: 'update',
              metadata: { table, args, duration }
            })
          } else {
            errorLogger.logPerformance(`Supabase UPDATE ${String(table)}`, duration, {
              feature: 'supabase',
              action: 'update',
              metadata: { table }
            })
          }
          
          return result
        } catch (error) {
          const duration = performance.now() - startTime
          errorLogger.logSupabaseError(`UPDATE ${String(table)}`, error, {
            action: 'update',
            metadata: { table, args, duration, caught: true }
          })
          throw error
        }
      },

      delete: async (...args: Parameters<typeof originalFrom.delete>) => {
        const startTime = performance.now()
        try {
          const result = await originalFrom.delete(...args)
          const duration = performance.now() - startTime
          
          if (result.error) {
            errorLogger.logSupabaseError(`DELETE from ${String(table)}`, result.error, {
              action: 'delete',
              metadata: { table, args, duration }
            })
          } else {
            errorLogger.logPerformance(`Supabase DELETE from ${String(table)}`, duration, {
              feature: 'supabase',
              action: 'delete',
              metadata: { table }
            })
          }
          
          return result
        } catch (error) {
          const duration = performance.now() - startTime
          errorLogger.logSupabaseError(`DELETE from ${String(table)}`, error, {
            action: 'delete',
            metadata: { table, args, duration, caught: true }
          })
          throw error
        }
      },

      upsert: async (...args: Parameters<typeof originalFrom.upsert>) => {
        const startTime = performance.now()
        try {
          const result = await originalFrom.upsert(...args)
          const duration = performance.now() - startTime
          
          if (result.error) {
            errorLogger.logSupabaseError(`UPSERT into ${String(table)}`, result.error, {
              action: 'upsert',
              metadata: { table, args, duration }
            })
          } else {
            errorLogger.logPerformance(`Supabase UPSERT into ${String(table)}`, duration, {
              feature: 'supabase',
              action: 'upsert',
              metadata: { table, recordCount: Array.isArray(args[0]) ? args[0].length : 1 }
            })
          }
          
          return result
        } catch (error) {
          const duration = performance.now() - startTime
          errorLogger.logSupabaseError(`UPSERT into ${String(table)}`, error, {
            action: 'upsert',
            metadata: { table, args, duration, caught: true }
          })
          throw error
        }
      }
    }
  }

  // RPC calls with error logging
  async rpc(functionName: string, params?: Record<string, unknown>) {
    const startTime = performance.now()
    try {
      const result = await this.client.rpc(functionName, params)
      const duration = performance.now() - startTime
      
      if (result.error) {
        errorLogger.logSupabaseError(`RPC ${functionName}`, result.error, {
          action: 'rpc',
          metadata: { functionName, params, duration }
        })
      } else {
        errorLogger.logPerformance(`Supabase RPC ${functionName}`, duration, {
          feature: 'supabase',
          action: 'rpc',
          metadata: { functionName }
        })
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      errorLogger.logSupabaseError(`RPC ${functionName}`, error, {
        action: 'rpc',
        metadata: { functionName, params, duration, caught: true }
      })
      throw error
    }
  }
}

export const supabase = new EnhancedSupabaseClient()

// For backwards compatibility, also export the base client
export const baseSupabaseClient = baseSupabase