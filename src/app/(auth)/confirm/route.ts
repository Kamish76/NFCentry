import { createClient } from '@/lib/server'
import { UserService } from '@/lib/services/user.service'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/dashboard'

  const client = await createClient()

  const {
    data: { user: authUser },
  } = await client.auth.getUser()

  if (authUser) {
    const userProfile = await UserService.getUserById(authUser.id)
    if (!userProfile || !userProfile.name) {
      redirect('/complete-profile')
    }
    redirect(next)
  }

  redirect('/login')
}
