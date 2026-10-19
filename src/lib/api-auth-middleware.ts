import { NextRequest, NextResponse } from 'next/server'
import type { User as SupabaseAuthUser } from '@supabase/supabase-js'

import { createClient } from '@/lib/server'

type AuthenticatedContext = {
  request: NextRequest
  user: SupabaseAuthUser
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
      const supabase = await createClient()
      const authHeader = request.headers.get('authorization')
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : null

      console.log('[api-auth] request', {
        path: request.nextUrl.pathname,
        hasAuthHeader: Boolean(authHeader),
        hasBearerToken: Boolean(bearerToken),
      })

      const {
        data: { user },
        error: authError,
      } = bearerToken
        ? await supabase.auth.getUser(bearerToken)
        : await supabase.auth.getUser()

      if (authError || !user) {
        console.warn('[api-auth] unauthorized', {
          path: request.nextUrl.pathname,
          hasBearerToken: Boolean(bearerToken),
          error: authError?.message || 'No user',
        })
        return NextResponse.json(
          {
            error: 'Unauthorized',
          },
          { status: 401 }
        )
      }

      return await handler({ request, user }, params)
    } catch (error) {
      console.error('Error in auth middleware:', error)
      return NextResponse.json(
        {
          error: 'Internal server error',
        },
        { status: 500 }
      )
    }
  }
}
