"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "client" | "staff"
  status: "active" | "inactive"
  joinDate: string
  lastActive: string
  phone?: string
  address?: string
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: Partial<User>) => void
  user?: User | null
  mode: "create" | "edit"
}

export function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "client",
    password: "", // Add password field for creation
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "client",
        password: "",
      })
      setError(null)
    }
  }, [isOpen, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let response
      const body = {
        full_name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      }

      if (mode === "create") {
        if (!body.password) {
            setError("Le mot de passe est requis pour la création.")
            setIsLoading(false)
            return
        }
        response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        if (!user?.id) throw new Error("ID utilisateur manquant pour la modification.")
        response = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: body.full_name, role: body.role }), // Do not send password on edit
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Une erreur est survenue.")
      }

      // The API returns the full user object from Supabase Auth, which is nested.
      // We format it to match the frontend's `User` interface before passing it to the parent.
      const formattedUser = {
        id: result.user.id,
        name: result.user.user_metadata.full_name,
        email: result.user.email,
        role: result.user.user_metadata.role,
        joinDate: result.user.created_at,
        status: "active",
        lastActive: "Maintenant",
      }

      onSave(formattedUser) // Pass the correctly formatted object
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 dark:border-gray-700/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            {mode === "create" ? "Créer un utilisateur" : "Modifier l'utilisateur"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-white/50 dark:bg-gray-800/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-white/50 dark:bg-gray-800/50"
                required
              />
            </div>
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="bg-white/50 dark:bg-gray-800/50"
                required={mode === "create"}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select name="role" value={formData.role} onValueChange={(value) => handleChange("role", value)}>
              <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="staff">Personnel</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {mode === "create" ? "Création..." : "Modification..."}
                </div>
              ) : mode === "create" ? (
                "Créer"
              ) : (
                "Modifier"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
