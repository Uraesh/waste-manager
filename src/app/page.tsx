"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('message') === 'email-verified') {
        return "E-mail vérifié ! Vous pouvez maintenant vous connecter."
      }
    }
    return null
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      if (error.message === 'Email not confirmed') {
        setError('Veuillez vérifier votre e-mail avant de vous connecter.')
      } else {
        setError('Email ou mot de passe invalide.')
      }
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-rose-950 to-orange-950 flex items-center justify-center p-4">
      {/* Background glassmorphism effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

      <Card className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          {/* Logo with gradient */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">🗑️</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
              WasteManager
            </h1>
          </div>
          <p className="text-white/80">Connectez-vous à votre compte</p>
        </div>

        {successMessage && <p className="text-green-400 text-center mb-4">{successMessage}</p>}
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-red-400 focus:ring-red-400/20"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-red-400 focus:ring-red-400/20"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Connexion...
              </div>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Vous n&apos;avez pas de compte?{' '}
            <Link href="/signup" className="text-red-400 hover:underline">
              Inscrivez-vous
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">Comptes de test:</p>
          <div className="mt-2 space-y-1 text-xs text-white/80">
            <p>admin@test.com - Admin</p>
            <p>staff@test.com - Personnel</p>
            <p>client@test.com - Client</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
