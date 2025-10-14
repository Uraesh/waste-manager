// Types pour les tables Supabase - Mise à jour avec les valeurs réelles de la base de données
export interface Database {
  public: {
    Tables: {
      missions: {
        Row: {
          id: string
          title: string
          description: string | null
          location: string
          service_type: 'ramassage' | 'recyclage' | 'dechets_speciaux' | 'urgence'
          status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          client_id: string | null
          assigned_staff_id: string | null
          created_at: string | null
          updated_at: string | null
          estimated_duration: number | null
          special_instructions: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          equipment_needed: string[] | null
          gps_location?: string | null
          zone: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          location: string
          service_type: 'ramassage' | 'recyclage' | 'dechets_speciaux' | 'urgence'
          status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          client_id?: string | null
          assigned_staff_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          estimated_duration?: number | null
          special_instructions?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          equipment_needed?: string[] | null
          gps_location?: string | null
          zone?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          location?: string
          service_type?: 'ramassage' | 'recyclage' | 'dechets_speciaux' | 'urgence'
          status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          client_id?: string | null
          assigned_staff_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          estimated_duration?: number | null
          special_instructions?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          equipment_needed?: string[] | null
          gps_location: string | null
          zone?: string | null
        }
      }
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'client' | 'staff'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'client' | 'staff'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'admin' | 'client' | 'staff'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          company_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      staff_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          position: string
          phone: string | null
          address: string | null
          status: 'active' | 'inactive' | 'on_leave'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          position: string
          phone?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'on_leave'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          position?: string
          phone?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'on_leave'
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          mission_id: string
          amount: number
          currency: string
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: 'stripe' | 'paypal' | 'bank_transfer' | 'cash'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mission_id: string
          amount: number
          currency?: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: 'stripe' | 'paypal' | 'bank_transfer' | 'cash'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mission_id?: string
          amount?: number
          currency?: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: 'stripe' | 'paypal' | 'bank_transfer' | 'cash'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Types utilitaires pour le frontend
export type Mission = Database['public']['Tables']['missions']['Row']
export type MissionInsert = Database['public']['Tables']['missions']['Insert']
export type MissionUpdate = Database['public']['Tables']['missions']['Update']
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type StaffProfile = Database['public']['Tables']['staff_profiles']['Row']
export type StaffProfileInsert = Database['public']['Tables']['staff_profiles']['Insert']
export type StaffProfileUpdate = Database['public']['Tables']['staff_profiles']['Update']
export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

// Types pour les relations
export interface MissionWithRelations extends Mission {
  client: {
    company_name: string
  }
  staff: {
    first_name: string
    last_name: string
  } | null
}

export interface PaymentWithRelations extends Payment {
  mission: {
    title: string
  }
  client: {
    company_name: string
  }
}