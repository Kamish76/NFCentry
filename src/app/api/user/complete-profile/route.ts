import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth-middleware'
import { UserService } from '@/lib/services/user.service'
import type { UserType } from '@/types/user'

/**
 * POST /api/user/complete-profile
 * Create user profile for authenticated user
 */
export const POST = withAuth(async ({ request, user: authUser }) => {
  try {
    // Check if profile already exists
    const existingUser = await UserService.getUserById(authUser.id)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, user_type, tag_id, nfc_tag_id, qr_code_data } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!user_type || !['Student', 'Faculty'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Valid user type is required (Student or Faculty)' },
        { status: 400 }
      )
    }

    const effectiveTagId = (tag_id || nfc_tag_id || '').trim() || null

    // Check if tag is available (if provided)
    if (effectiveTagId) {
      const isAvailable = await UserService.isNfcTagAvailable(effectiveTagId)
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'Tag already in use' },
          { status: 400 }
        )
      }
    }

    // Determine auth provider and password status
    const authProvider = UserService.getAuthProviderFromUser(authUser)
    const hasPassword = UserService.authUserHasPassword(authUser)

    // Create user profile with auth user ID as primary key
    const { user, error } = await UserService.createUser(authUser.id, {
      name: name.trim(),
      email: authUser.email!,
      user_type: user_type as UserType,
      auth_provider: authProvider,
      has_password: hasPassword,
      tag_id: effectiveTagId || undefined,
      nfc_tag_id: effectiveTagId || undefined,
      qr_code_data: effectiveTagId || undefined,
    })

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error completing profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
