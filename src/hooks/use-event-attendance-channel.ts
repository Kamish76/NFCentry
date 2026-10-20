'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/client'

export type AttendanceRealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string
  new: Record<string, any>
  old: Record<string, any>
}

export type RealtimeConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error'

type EventCallback = (payload: AttendanceRealtimeEvent) => void
type StatusCallback = (status: RealtimeConnectionStatus) => void

interface ChannelEntry {
  channel: any
  eventSubscribers: Set<EventCallback>
  statusSubscribers: Set<StatusCallback>
  currentStatus: RealtimeConnectionStatus
}

// Global registry of active event channels keyed by eventId
// Multiplexes multiple components on the same page onto ONE channel
const activeEventChannels = new Map<string, ChannelEntry>()

/**
 * Hook to subscribe to real-time event attendance updates.
 * Multiplexes multiple components (e.g. AttendanceStats and AttendanceList)
 * onto a SINGLE channel per event, eliminating duplicate connections.
 */
export function useEventAttendanceChannel(
  eventId: string,
  onEvent?: EventCallback,
  onStatusChange?: StatusCallback
) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected')
  const eventCallbackRef = useRef(onEvent)
  const statusCallbackRef = useRef(onStatusChange)
  eventCallbackRef.current = onEvent
  statusCallbackRef.current = onStatusChange

  const initChannel = useCallback(() => {
    if (!eventId) return

    const client = createClient()
    const eventSub: EventCallback = (payload) => {
      eventCallbackRef.current?.(payload)
    }
    const statusSub: StatusCallback = (newStatus) => {
      setStatus(newStatus)
      statusCallbackRef.current?.(newStatus)
    }

    let entry = activeEventChannels.get(eventId)

    if (!entry) {
      entry = {
        channel: null,
        eventSubscribers: new Set([eventSub]),
        statusSubscribers: new Set([statusSub]),
        currentStatus: 'connected',
      }
      activeEventChannels.set(eventId, entry)

      const channel = client
        .channel(`event_attendance:${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_attendance',
            filter: `event_id=eq.${eventId}`,
          },
          (payload: any) => {
            const currentEntry = activeEventChannels.get(eventId)
            if (currentEntry) {
              currentEntry.eventSubscribers.forEach((cb) => {
                try {
                  cb({
                    eventType: payload.eventType || 'INSERT',
                    new: payload.new || {},
                    old: payload.old || {},
                  })
                } catch (err) {
                  console.error('Error in attendance realtime subscriber:', err)
                }
              })
            }
          }
        )
        .subscribe((subscriptionStatus: string) => {
          let nextStatus: RealtimeConnectionStatus = 'connected'
          if (subscriptionStatus === 'SUBSCRIBED') {
            nextStatus = 'connected'
          } else if (
            subscriptionStatus === 'CHANNEL_ERROR' ||
            subscriptionStatus === 'TIMED_OUT'
          ) {
            nextStatus = 'error'
          } else if (subscriptionStatus === 'CLOSED') {
            nextStatus = 'disconnected'
          }

          const currentEntry = activeEventChannels.get(eventId)
          if (currentEntry) {
            currentEntry.currentStatus = nextStatus
            currentEntry.statusSubscribers.forEach((cb) => {
              try {
                cb(nextStatus)
              } catch (err) {
                console.error('Error in status subscriber:', err)
              }
            })
          }
        })

      entry.channel = channel
      statusSub('connected')
    } else {
      entry.eventSubscribers.add(eventSub)
      entry.statusSubscribers.add(statusSub)
      statusSub(entry.currentStatus)
    }

    return () => {
      const currentEntry = activeEventChannels.get(eventId)
      if (currentEntry) {
        currentEntry.eventSubscribers.delete(eventSub)
        currentEntry.statusSubscribers.delete(statusSub)
        if (currentEntry.eventSubscribers.size === 0) {
          client.removeChannel(currentEntry.channel)
          activeEventChannels.delete(eventId)
        }
      }
    }
  }, [eventId])

  useEffect(() => {
    const cleanup = initChannel()
    return () => {
      cleanup?.()
    }
  }, [initChannel])

  return { status, reconnect: initChannel }
}
