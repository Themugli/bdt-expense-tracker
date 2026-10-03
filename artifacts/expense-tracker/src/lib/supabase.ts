import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.')
}

const LOG = '[supabase-realtime]'
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempt = 0

/**
 * Reconnects the Realtime WebSocket with exponential backoff + jitter.
 * Only reconnects while there are active channels, so an intentional
 * disconnect (no subscribers left) doesn't spin up a socket for nothing.
 */
function scheduleReconnect(client: SupabaseClient, reason: string) {
  if (reconnectTimer) return
  const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempt) + Math.random() * 1_000
  reconnectAttempt += 1
  console.warn(`${LOG} heartbeat ${reason}; reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempt})`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (client.getChannels().length === 0) return
    if (client.realtime.isConnected()) {
      reconnectAttempt = 0
      return
    }
    try {
      client.realtime.connect()
    } catch (error) {
      console.error(`${LOG} reconnect failed`, error)
      scheduleReconnect(client, 'reconnect-error')
    }
  }, delay)
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    realtime: {
      // Runs the heartbeat in a Web Worker so background tabs aren't
      // throttled by the browser (which would otherwise drop the socket).
      worker: true,
      heartbeatCallback: (status) => {
        if (status === 'ok') {
          reconnectAttempt = 0
          return
        }
        if (status === 'timeout' || status === 'disconnected' || status === 'error') {
          scheduleReconnect(supabase, status)
        }
      },
    },
  },
)
