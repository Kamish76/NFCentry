import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import { Calendar, Users, Pencil, Download, FileIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AttendanceList } from '@/components/events/attendance-list'
import { AttendanceStats } from '@/components/events/attendance-stats'
import { getEventStatus, formatEventDate, formatEventTime } from '@/lib/utils'
import { MapPreviewWrapper } from '@/components/events/map-preview-wrapper'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>
}) {
  const { id: organizationId, eventId } = await params
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get event details with organization
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(`
      *,
      organizations!inner(id, name, tag),
      created_by_user:users!fk_created_by_user(id, name, email)
    `)
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    console.error('Error fetching event:', eventError)
    redirect(`/organizations/${organizationId}/events`)
  }

  // Transform organizations array to single object
  const organization = Array.isArray(event.organizations) 
    ? event.organizations[0] 
    : event.organizations

  // Verify user is a member of the organization
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (memberError || !membership) {
    redirect('/organizations')
  }

  // Get attendance summary using the view
  const { data: summary } = await supabase
    .from('event_attendance_summary')
    .select('*')
    .eq('event_id', eventId)
    .single()

  // Check if user can take attendance
  const { data: canTakeAttendanceResult, error: canTakeError } = await supabase
    .rpc('can_take_attendance', {
      p_event_id: eventId,
      p_user_id: user.id,
    })

  const canTakeAttendance = !canTakeError && canTakeAttendanceResult === true

  // Check if user can manage (edit/delete) this event
  const { data: canManage, error: canManageError } = await supabase
    .rpc('can_manage_event', {
      p_event_id: eventId,
      p_user_id: user.id,
    })

  const canManageEvent = !canManageError && canManage === true

  // Check if current user has attended
  const { data: hasAttended, error: attendedError } = await supabase
    .rpc('is_user_attended', {
      p_event_id: eventId,
      p_user_id: user.id,
    })

  const userAttended = !attendedError && hasAttended === true

  // Get event files
  const { data: eventFiles } = await supabase
    .from('event_files')
    .select('*')
    .eq('event_id', eventId)
    .order('uploaded_at', { ascending: false })

  const files = eventFiles || []

  // Resolve featured image URL (supports private buckets via signed URLs)
  let featuredImageUrl: string | null = null
  if (event.featured_image_storage_path) {
    const { data: signed, error: signedErr } = await supabase.storage
      .from('event-files')
      .createSignedUrl(event.featured_image_storage_path, 60 * 60)
    if (!signedErr && signed?.signedUrl) {
      featuredImageUrl = signed.signedUrl
    } else {
      const { data: pub } = await supabase.storage
        .from('event-files')
        .getPublicUrl(event.featured_image_storage_path)
      featuredImageUrl = pub?.publicUrl || null
    }
  } else if (event.featured_image_url) {
    const match = event.featured_image_url.match(/\/event-files\/(.+)$/)
    if (match) {
      const extractedPath = match[1]
      const { data: signed, error: signedErr } = await supabase.storage
        .from('event-files')
        .createSignedUrl(extractedPath, 60 * 60)
      if (!signedErr && signed?.signedUrl) {
        featuredImageUrl = signed.signedUrl
      } else {
        featuredImageUrl = event.featured_image_url
      }
    } else {
      featuredImageUrl = event.featured_image_url
    }
  }

  // Get event status
  const eventStatus = getEventStatus(event)

  // Format date
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  // Format attendance window times if available
  const hasAttendanceWindow = event.event_start && event.event_end
  const attendanceStartDate = hasAttendanceWindow ? formatEventDate(event.event_start) : null
  const attendanceStartTime = hasAttendanceWindow ? formatEventTime(event.event_start) : null
  const attendanceEndDate = hasAttendanceWindow ? formatEventDate(event.event_end) : null
  const attendanceEndTime = hasAttendanceWindow ? formatEventTime(event.event_end) : null

  const totalAttended = summary?.total_attended || 0
  const totalMembers = summary?.total_members || 0
  const attendancePercentage = summary?.attendance_percentage || 0
  const nfcScans = summary?.nfc_scans || 0
  const qrScans = summary?.qr_scans || 0
  const manualEntries = summary?.manual_entries || 0

  // Defect 5 Fix: Case-insensitive role check and canManageEvent check
  const roleLower = (membership.role || '').toLowerCase()
  const canViewFiles = userAttended || roleLower === 'owner' || roleLower === 'admin' || canManageEvent

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Link
            href={`/organizations/${organizationId}/events`}
            className="text-primary hover:underline mb-2 inline-block"
          >
            ← Back to Events
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {event.event_name}
                </h1>
                {eventStatus === 'ongoing' && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
                    Currently Happening
                  </span>
                )}
                {eventStatus === 'upcoming' && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold rounded-full">
                    Upcoming
                  </span>
                )}
                {eventStatus === 'past' && (
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-sm font-semibold rounded-full">
                    Past
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {organization.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canManageEvent && (
                <Link href={`/organizations/${organizationId}/events/${eventId}/edit`}>
                  <Button variant="outline" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit Event
                  </Button>
                </Link>
              )}
              {canTakeAttendance && (
                <Link href={`/organizations/${organizationId}/events/${eventId}/scanner`}>
                  <Button className="gap-2">
                    <Users className="h-4 w-4" />
                    Take Attendance
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Featured Image Hero */}
        {featuredImageUrl && (
          <div className="mb-6">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <img
                src={featuredImageUrl}
                alt={`${event.event_name} poster`}
                className="absolute top-0 left-0 w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>
          </div>
        )}

        {/* Event Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formattedDate} at {formattedTime}
                  </p>
                </div>
              </div>

              {/* Attendance Window */}
              {hasAttendanceWindow && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Attendance Window</p>
                    <p className="text-sm text-muted-foreground">
                      {attendanceStartDate} {attendanceStartTime} - {attendanceEndDate} {attendanceEndTime}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Map Preview */}
            {event.latitude != null && event.longitude != null && (
              <div className="pt-4 border-t border-border">
                <p className="font-medium text-foreground mb-2">Location</p>
                <p className="text-sm text-muted-foreground mb-3">{event.location || 'Pin on map'}</p>
                <div className="h-48 rounded-md overflow-hidden border border-border">
                  <MapPreviewWrapper
                    latitude={event.latitude}
                    longitude={event.longitude}
                    attendanceRadiusMeters={event.attendance_radius_meters ?? undefined}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="pt-4 border-t border-border">
                <p className="font-medium text-foreground mb-2">Description</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Files Card - Always show if files exist */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Event Files</span>
                {canViewFiles && !userAttended && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                    Viewing as {membership.role}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canViewFiles ? (
                <>
                  <div className="space-y-3">
                    {files.map((file) => {
                      const isImage = file.file_type === 'image'
                      const fileExtension = file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'
                      const fileSizeFormatted = 
                        file.file_size_bytes < 1024
                          ? `${file.file_size_bytes} B`
                          : file.file_size_bytes < 1024 * 1024
                          ? `${(file.file_size_bytes / 1024).toFixed(1)} KB`
                          : `${(file.file_size_bytes / 1024 / 1024).toFixed(1)} MB`

                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-4 bg-muted/50 rounded-md border border-input hover:border-primary/50 transition-colors"
                        >
                          {isImage ? (
                            <div className="flex-shrink-0">
                              <img
                                src={file.file_url}
                                alt={file.file_name}
                                className="h-16 w-16 object-cover rounded border border-input"
                              />
                            </div>
                          ) : (
                            <FileIcon className="h-8 w-8 text-primary flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fileSizeFormatted} • {fileExtension}
                              {file.uploaded_at && (
                                <> • Uploaded {new Date(file.uploaded_at).toLocaleDateString()}</>
                              )}
                            </p>
                          </div>
                          <a
                            href={file.file_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                              <Download className="h-4 w-4" />
                              Download
                            </button>
                          </a>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    {files.length} file{files.length !== 1 ? 's' : ''} available for this event
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {files.length} file{files.length !== 1 ? 's' : ''} available
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    You must be recorded as attending this event to access the files.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attendance Statistics with Real-time Updates */}
        <div className="mb-6">
          <AttendanceStats 
            eventId={eventId} 
            initialStats={{
              total_attended: totalAttended,
              total_members: totalMembers,
              attendance_percentage: attendancePercentage,
              nfc_scans: nfcScans,
              qr_scans: qrScans,
              manual_entries: manualEntries,
              member_count: summary?.member_count || 0,
              non_member_count: summary?.non_member_count || 0,
            }}
          />
        </div>

        {/* Attendance List with Real-time Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceList eventId={eventId} organizationId={organizationId} userRole={membership.role} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
