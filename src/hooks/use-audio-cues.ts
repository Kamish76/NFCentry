'use client'

import { useRef, useCallback } from 'react'

/**
 * Zero-Asset Web Audio Synthesizer hook.
 * Uses browser-native AudioContext to generate crisp acoustic signals
 * without downloading any external .mp3 or audio files.
 */
export function useAudioCues() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  /**
   * Play ascending success chime (587.33 Hz D5 -> 880.00 Hz A5, Sine wave)
   */
  const playSuccess = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12) // A5

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.18)
    } catch (e) {
      console.warn('Audio playback not permitted or failed:', e)
    }
  }, [getAudioContext])

  /**
   * Play duplicate alert (440.00 Hz A4, Triangle wave, double pulse)
   */
  const playDuplicate = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime

      // First beep
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(440.0, now)
      gain1.gain.setValueAtTime(0.25, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.08)

      // Second beep
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(440.0, now + 0.1)
      gain2.gain.setValueAtTime(0.25, now + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.1)
      osc2.stop(now + 0.18)
    } catch (e) {
      console.warn('Audio playback failed:', e)
    }
  }, [getAudioContext])

  /**
   * Play warning/error buzz (180.00 Hz, Sawtooth wave, 250ms)
   */
  const playError = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180.0, now)
      osc.frequency.linearRampToValueAtTime(140.0, now + 0.25)

      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.25)
    } catch (e) {
      console.warn('Audio playback failed:', e)
    }
  }, [getAudioContext])

  return {
    playSuccess,
    playDuplicate,
    playError,
  }
}
