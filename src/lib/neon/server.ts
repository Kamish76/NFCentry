import { cookies, headers } from 'next/headers'
import { query } from '@/lib/db'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { NeonQueryBuilder } from './query-builder'

export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const authHeader = headerStore.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null

  const activeToken = cookieToken || bearerToken

  return {
    from(table: string) {
      return new NeonQueryBuilder(table)
    },

    async rpc(fnName: string, args: Record<string, any> = {}) {
      try {
        const keys = Object.keys(args)
        const params: any[] = []
        let callSql = ''

        if (keys.length === 0) {
          callSql = `SELECT * FROM public."${fnName}"()`
        } else {
          const namedArgs = keys.map((key) => {
            params.push(args[key])
            return `"${key}" := $${params.length}`
          })
          callSql = `SELECT * FROM public."${fnName}"(${namedArgs.join(', ')})`
        }

        const res = await query(callSql, params)

        if (res.rowCount === 0) {
          return { data: null, error: null }
        }

        // If the function returns a single column or scalar/json
        const firstRow = res.rows[0]
        const rowKeys = Object.keys(firstRow)
        if (rowKeys.length === 1 && (rowKeys[0] === fnName || rowKeys[0] === 'res' || rowKeys[0] === 'result')) {
          return { data: firstRow[rowKeys[0]], error: null }
        }

        return { data: firstRow, error: null }
      } catch (err: any) {
        console.error(`[Neon RPC Error] ${fnName}:`, err)
        return { data: null, error: err }
      }
    },

    auth: {
      async getUser(tokenOverride?: string) {
        const token = tokenOverride || activeToken
        if (!token) {
          return { data: { user: null }, error: new Error('No session') }
        }

        const payload = await verifySessionToken(token)
        if (!payload) {
          return { data: { user: null }, error: new Error('Invalid token') }
        }

        const userRes = await query(
          `SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = $1 LIMIT 1`,
          [payload.id]
        )

        if (userRes.rowCount === 0) {
          return { data: { user: null }, error: new Error('User not found') }
        }

        const authUser = userRes.rows[0]

        // Fetch public.users profile
        const profileRes = await query(
          `SELECT id, name, user_type, tag_id, nfc_tag_id, qr_code_data, auth_provider, has_password FROM public.users WHERE id = $1 LIMIT 1`,
          [payload.id]
        )

        const profile = profileRes.rows[0] || null

        const userObj = {
          id: authUser.id,
          email: authUser.email,
          user_metadata: {
            name: profile?.name || authUser.raw_user_meta_data?.name || null,
            user_type: profile?.user_type || 'Student',
            provider: profile?.auth_provider || 'email',
          },
          app_metadata: {
            provider: profile?.auth_provider || 'email',
          },
        }

        return { data: { user: userObj }, error: null }
      },

      async getSession() {
        const token = activeToken
        if (!token) {
          return { data: { session: null }, error: null }
        }

        const payload = await verifySessionToken(token)
        if (!payload) {
          return { data: { session: null }, error: null }
        }

        return {
          data: {
            session: {
              access_token: token,
              user: {
                id: payload.id,
                email: payload.email,
              },
            },
          },
          error: null,
        }
      },
    },

    storage: {
      from(bucketId: string) {
        return {
          async upload(filePath: string, file: any, options?: any) {
            try {
              const fs = await import('fs/promises')
              const path = await import('path')
              const fullDir = path.join(process.cwd(), 'public', 'uploads', bucketId, path.dirname(filePath))
              await fs.mkdir(fullDir, { recursive: true })
              const fullPath = path.join(process.cwd(), 'public', 'uploads', bucketId, filePath)

              let buffer: Buffer
              if (file && typeof file.arrayBuffer === 'function') {
                const ab = await file.arrayBuffer()
                buffer = Buffer.from(ab)
              } else if (Buffer.isBuffer(file)) {
                buffer = file
              } else {
                buffer = Buffer.from(file)
              }
              await fs.writeFile(fullPath, buffer)
              return { data: { path: filePath }, error: null }
            } catch (err: any) {
              console.error('[Neon Storage Upload Error]', err)
              return { data: null, error: err }
            }
          },

          async createSignedUploadUrl(filePath: string) {
            const uploadUrl = `/api/storage/upload?bucket=${bucketId}&path=${encodeURIComponent(filePath)}`
            return {
              data: {
                signedUrl: uploadUrl,
                path: filePath,
                token: activeToken || 'neon-upload-token',
              },
              error: null,
            }
          },

          async createSignedUrl(filePath: string, expiresIn: number = 3600) {
            return {
              data: {
                signedUrl: `/uploads/${bucketId}/${filePath}`,
              },
              error: null,
            }
          },

          getPublicUrl(filePath: string) {
            return {
              data: {
                publicUrl: `/uploads/${bucketId}/${filePath}`,
              },
            }
          },

          async remove(paths: string[]) {
            try {
              const fs = await import('fs/promises')
              const path = await import('path')
              for (const p of paths) {
                const fullPath = path.join(process.cwd(), 'public', 'uploads', bucketId, p)
                await fs.unlink(fullPath).catch(() => {})
              }
              return { data: paths, error: null }
            } catch {
              return { data: paths, error: null }
            }
          },
        }
      },
    },
  }
}

export async function createServiceRoleClient() {
  return createClient()
}
