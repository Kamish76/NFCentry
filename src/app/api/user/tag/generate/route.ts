import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth-middleware';
import { UserService } from '@/lib/services/user.service';

/**
 * POST /api/user/tag/generate
 * Generate a new tag for the current user
 * 
 * Authentication: Required
 * 
 * Response:
 * {
 *   success: boolean;
 *   tag_id: string;
 *   write_record_id: string;
 *   written_at: string;
 * }
 */
export const POST = withAuth(async ({ user }) => {
  try {
    // Generate new tag (will throw error if cooldown not elapsed)
    const result = await UserService.generateTag(user.id);

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('Error generating tag:', error);

    // Check if it's a cooldown error
    if (error.message.includes('Cooldown period not elapsed')) {
      // Extract next available date from error message
      const match = error.message.match(/Next available: (.+)/);
      const nextAvailable = match ? match[1] : 'unknown';

      return NextResponse.json(
        {
          error: 'Tag generation cooldown period not elapsed',
          message: error.message,
          next_available_date: nextAvailable
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate tag' },
      { status: 500 }
    );
  }
})
