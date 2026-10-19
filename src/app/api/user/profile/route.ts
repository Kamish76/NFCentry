import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth-middleware'
import { UserService } from '@/lib/services/user.service'

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export const GET = withAuth(async ({ user: authUser }) => {
  try {
    // Get user profile using auth user ID directly
    const user = await UserService.getUserById(authUser.id)

    if (!user) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
export const PUT = withAuth(async ({ request, user: authUser }) => {
  try {
    // Get user profile using auth user ID directly
    const existingUser = await UserService.getUserById(authUser.id)
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, user_type, nfc_tag_id, qr_code_data } = body

    // Validate input
    if (name && typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid name' },
        { status: 400 }
      )
    }

    if (user_type && !['Student', 'Faculty'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      )
    }

    // Check if NFC tag is available (use auth user ID)
    if (nfc_tag_id) {
      const isAvailable = await UserService.isNfcTagAvailable(nfc_tag_id, authUser.id)
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'NFC tag already in use' },
          { status: 400 }
        )
      }
    }

    // Update user using auth user ID directly
    const { user, error } = await UserService.updateUser(authUser.id, {
      name,
      user_type,
      nfc_tag_id,
      qr_code_data,
    })

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
