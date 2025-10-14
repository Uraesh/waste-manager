// Types pour les réponses API
export interface ApiMission {
  id: string
  title: string
  client?: { 
    company_name: string 
  }
  location: string
  service_type: string
  status: string
  priority: string
  created_at: string
  staff?: { 
    first_name: string
    last_name: string 
  } | null
  description: string
  estimated_duration?: number | null
  special_instructions?: string | null
}