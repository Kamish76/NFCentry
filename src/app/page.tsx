import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import Link from 'next/link'
import { Calendar, Radio, BarChart3 } from 'lucide-react'

export default async function Home() {
  // Hardened server-side verification using getUser() instead of unverified getSession() (Fixes Defect #14)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    }
  } catch {
    // If auth fails or env is unconfigured in development, proceed to render landing
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            NFCentry
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Automated event attendance and membership platform. Multi-channel
            check-ins via Web NFC, QR camera scanning, real-time live metrics, and
            geolocation gating.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3 bg-card hover:bg-muted text-primary font-medium rounded-lg border border-border transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Event Management
            </h3>
            <p className="text-muted-foreground text-sm">
              Create and manage events with organization role controls, attendance
              windows, and geolocation radius gating.
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Radio className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Web NFC & QR Entry
            </h3>
            <p className="text-muted-foreground text-sm">
              Unified UUID tag provisioning for physical NFC cards and digital QR
              codes, compatible across Android, iOS, and desktop.
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Real-time Analytics
            </h3>
            <p className="text-muted-foreground text-sm">
              Live Supabase Realtime attendance feeds, synthesized audio cues,
              and one-click Excel exports.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} NFCentry. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
