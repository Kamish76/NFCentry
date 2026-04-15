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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
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
