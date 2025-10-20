import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@/types/supabase'

interface SignUpData {
  email: string
  password: string
  fullName: string
}

interface SignInData {
  email: string
  password: string
}

export const auth = {
  // Inscription d'un nouvel utilisateur
  signUp: async ({ email, password, fullName }: SignUpData) => {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Connexion d'un utilisateur
  signIn: async ({ email, password }: SignInData) => {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Déconnexion
  signOut: async () => {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  // Récupérer la session active
  getSession: async () => {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session, error: null }
    } catch (error) {
      return { session: null, error }
    }
  },

  // Récupérer l'utilisateur courant
  getCurrentUser: async () => {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }
}