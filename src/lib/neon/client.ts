'use client'

type AuthStateChangeCallback = (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'INITIAL_SESSION', session: any) => void

const authListeners = new Set<AuthStateChangeCallback>()

export function createClient() {
  return {
    from(tableName: string) {
      let selectCols = '*'
      const filters: any[] = []

      return {
        select(cols: string = '*') {
          selectCols = cols
          return this
        },
        eq(col: string, val: any) {
          filters.push({ col, val })
          return this
        },
        order() {
          return this
        },
        limit() {
          return this
        },
        async single(): Promise<{ data: any; error: any }> {
          const res = await this.execute()
          return { data: Array.isArray(res.data) ? res.data[0] || null : res.data, error: res.error }
        },
        async maybeSingle(): Promise<{ data: any; error: any }> {
          const res = await this.execute()
          return { data: Array.isArray(res.data) ? res.data[0] || null : res.data, error: res.error }
        },
        async execute(): Promise<{ data: any; error: any }> {
          return { data: [] as any[], error: null }
        },
        then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any): Promise<any> {
          return this.execute().then(onfulfilled, onrejected)
        },
      }
    },

    async rpc(fnName: string, args: Record<string, any> = {}) {
      try {
        const res = await fetch(`/api/rpc/${fnName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        })
        const json = await res.json()
        return json
      } catch (err: any) {
        return { data: null, error: err }
      }
    },

    auth: {
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const data = await res.json()
          if (!res.ok) {
            return { data: { user: null, session: null }, error: new Error(data.error || 'Login failed') }
          }

          authListeners.forEach((cb) => cb('SIGNED_IN', data.session))
          return { data, error: null }
        } catch (err: any) {
          return { data: { user: null, session: null }, error: err }
        }
      },

      async signInWithOAuth({ provider = 'google', options }: { provider?: string; options?: { redirectTo?: string; [key: string]: any } }) {
        try {
          let target = options?.redirectTo || '/dashboard'
          if (target.startsWith('http://') || target.startsWith('https://')) {
            try {
              const url = new URL(target)
              if (typeof window !== 'undefined' && url.origin === window.location.origin) {
                target = url.pathname + url.search + url.hash
              }
            } catch {
              // fallback to target
            }
          }
          const next = encodeURIComponent(target)
          window.location.href = `/api/auth/oauth/${provider}?next=${next}`
          return { data: null, error: null }
        } catch (err: any) {
          return { data: null, error: err }
        }
      },

      async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
        try {
          const res = await fetch('/api/auth/sign-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              name: options?.data?.name || null,
              user_type: options?.data?.user_type || 'Student',
            }),
          })

          const data = await res.json()
          if (!res.ok) {
            return { data: { user: null, session: null }, error: new Error(data.error || 'Sign up failed') }
          }

          authListeners.forEach((cb) => cb('SIGNED_IN', data.session))
          return { data, error: null }
        } catch (err: any) {
          return { data: { user: null, session: null }, error: err }
        }
      },

      async signOut() {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
          authListeners.forEach((cb) => cb('SIGNED_OUT', null))
          return { error: null }
        } catch (err: any) {
          return { error: err }
        }
      },

      async getUser() {
        try {
          const res = await fetch('/api/auth/session')
          const data = await res.json()
          return { data: { user: data.user }, error: null }
        } catch (err: any) {
          return { data: { user: null }, error: err }
        }
      },

      async getSession() {
        try {
          const res = await fetch('/api/auth/session')
          const data = await res.json()
          return { data: { session: data.session }, error: null }
        } catch (err: any) {
          return { data: { session: null }, error: err }
        }
      },

      onAuthStateChange(callback: AuthStateChangeCallback) {
        authListeners.add(callback)
        // Check current session
        fetch('/api/auth/session')
          .then((res) => res.json())
          .then((data) => {
            if (data.session) {
              callback('INITIAL_SESSION', data.session)
            }
          })
          .catch(() => {})

        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback)
              },
            },
          },
        }
      },

      async resetPasswordForEmail(email: string, options?: any) {
        return { data: {}, error: null }
      },

      async updateUser(attributes: any) {
        try {
          const res = await fetch('/api/auth/update-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attributes),
          })
          const data = await res.json()
          if (!res.ok) {
            return { data: null, error: new Error(data.error || 'Failed to update user') }
          }
          return { data, error: null }
        } catch (err: any) {
          return { data: null, error: err }
        }
      },
    },

    channel(channelName: string) {
      let pollInterval: any = null
      const eventHandlers: Array<(payload: any) => void> = []

      return {
        on(event: string, filter: any, callback: (payload: any) => void) {
          eventHandlers.push(callback)
          return this
        },

        subscribe(statusCallback?: (status: string) => void) {
          statusCallback?.('SUBSCRIBED')
          return this
        },

        unsubscribe() {
          if (pollInterval) clearInterval(pollInterval)
        },
      }
    },

    removeChannel(channel: any) {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe()
      }
    },

    storage: {
      from(bucketId: string) {
        return {
          async upload(filePath: string, file: Blob | File) {
            try {
              const formData = new FormData()
              formData.append('file', file)
              formData.append('path', filePath)
              formData.append('bucket', bucketId)

              const res = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData,
              })

              const data = await res.json()
              if (!res.ok) {
                return { data: null, error: new Error(data.error || 'Upload failed') }
              }
              return { data: { path: filePath }, error: null }
            } catch (err: any) {
              return { data: null, error: err }
            }
          },

          getPublicUrl(filePath: string) {
            return {
              data: {
                publicUrl: `/uploads/${bucketId}/${filePath}`,
              },
            }
          },
        }
      },
    },
  }
}
