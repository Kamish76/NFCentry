import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export type AuthUser = {
  id: string
  email?: string
  user_metadata?: {
    name?: string | null
    user_type?: string
    provider?: string
  }
}

type AuthenticatedContext = {
  request: NextRequest
  user: AuthUser
}

type AuthenticatedHandler<TParams = unknown> = (
  context: AuthenticatedContext,
  params: TParams
) => Promise<Response> | Response

export function withAuth<TParams = unknown>(
  handler: AuthenticatedHandler<TParams>
) {
  return async (request: NextRequest, params: TParams): Promise<Response> => {
    try {
      const client = await createClient()
      const authHeader = request.headers.get('authorization')
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : undefined

      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser(bearerToken)

      if (authError || !user) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
          },
          { status: 401 }
        )
      }

      return await handler({ request, user: user as AuthUser }, params)
    } catch (error) {
      console.error('[Neon Auth Middleware Error]:', error)
      return NextResponse.json(
        {
          error: 'Internal server error',
        },
        { status: 500 }
      )
    }
  }
}
