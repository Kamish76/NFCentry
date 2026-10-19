'use client'

import { useState, useCallback, useEffect } from 'react'
import { haversineDistanceMeters } from '@/lib/utils'

export interface GeolocationCoords {
  latitude: number
  longitude: number
  accuracy?: number
}

export function useGeolocation() {
  const [coords, setCoords] = useState<GeolocationCoords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshPosition = useCallback(async (): Promise<GeolocationCoords | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return null
    }

    setIsLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords: GeolocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setCoords(newCoords)
          setIsLoading(false)
          resolve(newCoords)
        },
        (err) => {
          let message = 'Failed to get location'
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Location permission denied. Please allow location access.'
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = 'Location information is unavailable.'
          } else if (err.code === err.TIMEOUT) {
            message = 'Location request timed out.'
          }
          setError(message)
          setIsLoading(false)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000,
        }
      )
    })
  }, [])

  const checkDistance = useCallback(
    (targetLat: number, targetLng: number): number | null => {
      if (!coords) return null
      return haversineDistanceMeters(
        coords.latitude,
        coords.longitude,
        targetLat,
        targetLng
      )
    },
    [coords]
  )

  const isWithinRadius = useCallback(
    (
      targetLat: number,
      targetLng: number,
      radiusMeters: number
    ): { within: boolean; distance: number } | null => {
      if (!coords) return null
      const distance = haversineDistanceMeters(
        coords.latitude,
        coords.longitude,
        targetLat,
        targetLng
      )
      return {
        within: distance <= radiusMeters,
        distance: Math.round(distance),
      }
    },
    [coords]
  )

  useEffect(() => {
    refreshPosition()
  }, [refreshPosition])

  return {
    coords,
    error,
    isLoading,
    refreshPosition,
    checkDistance,
    isWithinRadius,
  }
}
