'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Loader2, WifiOff, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEventAttendanceChannel } from '@/hooks/use-event-attendance-channel'

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error'

interface AttendanceStats {
  total_attended: number
  total_members: number
  attendance_percentage: number
  nfc_scans: number
  qr_scans: number
  manual_entries: number
  member_count: number
  non_member_count: number
}

interface AttendanceStatsProps {
  eventId: string
  initialStats: AttendanceStats
}

export function AttendanceStats({ eventId, initialStats }: AttendanceStatsProps) {
  const [stats, setStats] = useState<AttendanceStats>(initialStats)
  
  // Stabilize client reference to prevent subscription issues on re-renders
  const supabase = useMemo(() => createClient(), [])

  // Fetch updated stats from the summary view
  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase
      .from('event_attendance_summary')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (!error && data) {
      setStats({
        total_attended: data.total_attended || 0,
        total_members: data.total_members || 0,
        attendance_percentage: data.attendance_percentage || 0,
        nfc_scans: data.nfc_scans || 0,
        qr_scans: data.qr_scans || 0,
        manual_entries: data.manual_entries || 0,
        member_count: data.member_count || 0,
        non_member_count: data.non_member_count || 0,
      })
    }
  }, [eventId, supabase])

  // Multiplexed realtime subscription via useEventAttendanceChannel (Fixes Defect #12)
  const { status: connectionStatus, reconnect: retrySubscription } = useEventAttendanceChannel(
    eventId,
    useCallback(() => {
      fetchStats()
    }, [fetchStats])
  )

  const { total_attended, total_members, attendance_percentage, nfc_scans, qr_scans, manual_entries } = stats

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total Attended */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {total_attended} / {total_members}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {total_members > 0 ? `${total_members} total members` : 'No members'}
            </p>
          </CardContent>
        </Card>

        {/* Attendance Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-foreground">
                {attendance_percentage}%
              </div>
              <TrendingUp className={`h-4 w-4 ${attendance_percentage >= 75 ? 'text-green-600' : attendance_percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {attendance_percentage >= 75 ? 'Excellent' : attendance_percentage >= 50 ? 'Good' : 'Low'}
            </p>
          </CardContent>
        </Card>

        {/* NFC Scans */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NFC Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {nfc_scans}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              via NFC tag
            </p>
          </CardContent>
        </Card>

        {/* QR + Manual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              QR + Manual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {qr_scans + manual_entries}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {qr_scans} QR, {manual_entries} manual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Connection Status Indicator */}
      <div className="text-center">
        {connectionStatus === 'connected' && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-muted-foreground">
              Stats updating live
            </p>
          </div>
        )}
        
        {connectionStatus === 'reconnecting' && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
            <p className="text-xs text-muted-foreground">
              Reconnecting...
            </p>
          </div>
        )}
        
        {connectionStatus === 'disconnected' && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <WifiOff className="h-3 w-3 text-gray-400" />
            <p className="text-xs text-muted-foreground">
              Stats offline
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={retrySubscription}
              className="h-6 px-2 text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        )}
        
        {connectionStatus === 'error' && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <AlertCircle className="h-3 w-3 text-red-500" />
            <p className="text-xs text-destructive">
              Connection error
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={retrySubscription}
              className="h-6 px-2 text-xs gap-1 text-destructive hover:text-destructive"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
