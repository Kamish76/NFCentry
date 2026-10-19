'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { NDEFReadingEvent } from '@/types/tag'

export interface UseWebNfcOptions {
  debounceMs?: number
  onReading?: (serialNumber: string, textPayload: string) => Promise<void> | void
  onError?: (error: Error) => void
}

export function useWebNfc(options: UseWebNfcOptions = {}) {
  const { debounceMs = 1500, onReading, onError } = options

  const [isSupported, setIsSupported] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isProcessingRef = useRef(false)
  const lastProcessedTimeRef = useRef(0)

  // Feature detection
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setIsSupported(true)
    } else {
      setIsSupported(false)
    }
  }, [])

  // Auto-cleanup on unmount (Fixes Defect #10 antenna leak)
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const stopScanning = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScanning = useCallback(async () => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      const err = new Error('Web NFC is not supported on this device/browser')
      setError(err.message)
      onError?.(err)
      return
    }

    // Abort any previous scan session before starting new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setError(null)

    try {
      const NDEF = window.NDEFReader as unknown as new () => {
        scan: (opts?: { signal?: AbortSignal }) => Promise<void>
        onreading: ((event: NDEFReadingEvent) => void) | null
        onreadingerror: ((event: Event) => void) | null
      }
      const ndef = new NDEF()

      await ndef.scan({ signal: controller.signal })
      setIsScanning(true)

      ndef.onreading = async (event: NDEFReadingEvent) => {
        const now = Date.now()

        // Immediate synchronous ref-based lock (Fixes Defect #11 race condition)
        if (
          isProcessingRef.current ||
          now - lastProcessedTimeRef.current < debounceMs
        ) {
          return
        }

        isProcessingRef.current = true
        lastProcessedTimeRef.current = now

        try {
          const serialNumber = event.serialNumber || ''
          let textPayload = ''

          if (event.message?.records && event.message.records.length > 0) {
            for (const record of event.message.records) {
              if (record.recordType === 'text' && record.data) {
                const decoder = new TextDecoder(record.encoding || 'utf-8')
                textPayload = decoder.decode(record.data)
                break
              }
            }
          }

          if (onReading) {
            await onReading(serialNumber, textPayload)
          }
        } catch (err: unknown) {
          const readingError =
            err instanceof Error ? err : new Error(String(err))
          onError?.(readingError)
        } finally {
          isProcessingRef.current = false
        }
      }

      ndef.onreadingerror = () => {
        const readErr = new Error('Could not read tag. Try holding steady.')
        setError(readErr.message)
        onError?.(readErr)
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        return
      }
      const scanErr = err instanceof Error ? err : new Error(String(err))
      setError(scanErr.message)
      setIsScanning(false)
      onError?.(scanErr)
    }
  }, [debounceMs, onError, onReading])

  const writeTag = useCallback(
    async (textPayload: string): Promise<boolean> => {
      if (typeof window === 'undefined' || !('NDEFReader' in window)) {
        throw new Error('Web NFC is not supported on this device/browser')
      }

      const NDEF = window.NDEFReader as unknown as new () => {
        write: (
          message: unknown,
          opts?: { signal?: AbortSignal }
        ) => Promise<void>
      }
      const ndef = new NDEF()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        await ndef.write(
          {
            records: [
              {
                recordType: 'text',
                data: textPayload,
              },
            ],
          },
          { signal: controller.signal }
        )
        return true
      } finally {
        clearTimeout(timeoutId)
      }
    },
    []
  )

  return {
    isSupported,
    isScanning,
    error,
    startScanning,
    stopScanning,
    writeTag,
  }
}
