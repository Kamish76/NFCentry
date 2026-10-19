export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          user_type: 'Student' | 'Faculty'
          tag_id: string | null
          nfc_tag_id: string | null
          qr_code_data: string | null
          auth_provider: 'email' | 'google' | 'github' | 'azure' | 'facebook'
          has_password: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          user_type: 'Student' | 'Faculty'
          tag_id?: string | null
          nfc_tag_id?: string | null
          qr_code_data?: string | null
          auth_provider?: 'email' | 'google' | 'github' | 'azure' | 'facebook'
          has_password?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          user_type?: 'Student' | 'Faculty'
          tag_id?: string | null
          nfc_tag_id?: string | null
          qr_code_data?: string | null
          auth_provider?: 'email' | 'google' | 'github' | 'azure' | 'facebook'
          has_password?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          tag: string | null
          owner_user_id: string
          logo_url: string | null
          logo_storage_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          tag?: string | null
          owner_user_id: string
          logo_url?: string | null
          logo_storage_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          tag?: string | null
          owner_user_id?: string
          logo_url?: string | null
          logo_storage_path?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'Owner' | 'Admin' | 'Attendance Taker' | 'Member'
          joined_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'Owner' | 'Admin' | 'Attendance Taker' | 'Member'
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'Owner' | 'Admin' | 'Attendance Taker' | 'Member'
          joined_at?: string
          updated_at?: string
        }
      }
      organization_join_requests: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          event_name: string
          date: string
          organization_id: string
          description: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          attendance_radius_meters: number | null
          event_start: string | null
          event_end: string | null
          featured_image_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_name: string
          date: string
          organization_id: string
          description?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          attendance_radius_meters?: number | null
          event_start?: string | null
          event_end?: string | null
          featured_image_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          date?: string
          organization_id?: string
          description?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          attendance_radius_meters?: number | null
          event_start?: string | null
          event_end?: string | null
          featured_image_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      event_attendance: {
        Row: {
          id: string
          event_id: string
          user_id: string
          marked_at: string
          marked_by: string
          scan_method: 'NFC' | 'QR' | 'Manual'
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          is_member: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          marked_at?: string
          marked_by: string
          scan_method: 'NFC' | 'QR' | 'Manual'
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          is_member?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          marked_at?: string
          marked_by?: string
          scan_method?: 'NFC' | 'QR' | 'Manual'
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          is_member?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_files: {
        Row: {
          id: string
          event_id: string
          file_name: string
          file_url: string
          storage_path: string
          file_type: 'document' | 'image'
          file_size_bytes: number
          mime_type: string
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          event_id: string
          file_name: string
          file_url: string
          storage_path: string
          file_type: 'document' | 'image'
          file_size_bytes: number
          mime_type: string
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          file_name?: string
          file_url?: string
          storage_path?: string
          file_type?: 'document' | 'image'
          file_size_bytes?: number
          mime_type?: string
          uploaded_by?: string
          uploaded_at?: string
        }
      }
      user_tag_writes: {
        Row: {
          id: string
          user_id: string
          tag_id: string
          written_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tag_id: string
          written_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tag_id?: string
          written_at?: string
          created_at?: string
        }
      }
      user_tag_pending: {
        Row: {
          id: string
          user_id: string
          tag_id: string
          created_at: string
          expires_at: string
          confirmed: boolean
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tag_id: string
          created_at?: string
          expires_at: string
          confirmed?: boolean
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tag_id?: string
          created_at?: string
          expires_at?: string
          confirmed?: boolean
          confirmed_at?: string | null
        }
      }
    }
    Views: {
      events_with_details: {
        Row: {
          id: string
          event_name: string
          date: string
          organization_id: string
          description: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          attendance_radius_meters: number | null
          event_start: string | null
          event_end: string | null
          featured_image_url: string | null
          created_by: string
          created_at: string
          updated_at: string
          organization_name: string
          organization_tag: string | null
          organization_description: string | null
          organization_logo_url: string | null
          creator_name: string
          creator_email: string
          creator_user_type: string
        }
      }
      upcoming_events: {
        Row: {
          id: string
          event_name: string
          date: string
          organization_id: string
          description: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          attendance_radius_meters: number | null
          event_start: string | null
          event_end: string | null
          featured_image_url: string | null
          created_by: string
          created_at: string
          updated_at: string
          organization_name: string
          organization_tag: string | null
          organization_logo_url: string | null
        }
      }
      past_events: {
        Row: {
          id: string
          event_name: string
          date: string
          organization_id: string
          description: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          attendance_radius_meters: number | null
          event_start: string | null
          event_end: string | null
          featured_image_url: string | null
          created_by: string
          created_at: string
          updated_at: string
          organization_name: string
          organization_tag: string | null
          organization_logo_url: string | null
        }
      }
      membership_with_organization: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'Owner' | 'Admin' | 'Attendance Taker' | 'Member'
          joined_at: string
          updated_at: string
          organization_name: string
          organization_description: string | null
          organization_tag: string | null
          organization_logo_url: string | null
          organization_owner_id: string
        }
      }
      membership_with_user: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'Owner' | 'Admin' | 'Attendance Taker' | 'Member'
          joined_at: string
          updated_at: string
          user_name: string
          user_email: string
          user_type: string
          tag_id: string | null
          auth_provider: string
          has_password: boolean
        }
      }
      attendance_with_details: {
        Row: {
          id: string
          event_id: string
          user_id: string
          marked_at: string
          marked_by: string
          scan_method: 'NFC' | 'QR' | 'Manual'
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          is_member: boolean
          created_at: string
          updated_at: string
          user_name: string
          user_email: string
          user_type: string
          tag_id: string | null
          event_name: string
          event_date: string
          event_location: string | null
          organization_id: string
          organization_name: string
          organization_tag: string | null
          marked_by_name: string
          marked_by_email: string
        }
      }
      event_attendance_summary: {
        Row: {
          event_id: string
          event_name: string
          event_date: string
          organization_id: string
          organization_name: string
          total_attended: number
          total_members: number
          attendance_percentage: number
          nfc_scans: number
          qr_scans: number
          manual_entries: number
          member_count: number
          non_member_count: number
          last_attendance_marked: string | null
        }
      }
    }
  }
}
