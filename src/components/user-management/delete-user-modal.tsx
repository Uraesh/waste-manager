"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "client" | "staff"
  status: "active" | "inactive"
}

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (userId: string) => void
  user: User | null
}

import { useEffect } from "react"

export function DeleteUserModal({ isOpen, onClose, onConfirm, user }: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Une erreur est survenue lors de la suppression.")
      }

      onConfirm(user.id) // Notify parent to update UI
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-red-200 dark:border-red-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
            Supprimer l&apos;utilisateur
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Cette action est irréversible et supprimera définitivement :
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-rose-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {user.role.toUpperCase()}
              </Badge>
              <Badge
                className={
                  user.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                }
              >
                {user.status === "active" ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            <ul className="list-disc list-inside space-y-1">
              <li>Toutes les données personnelles</li>
              <li>L&apos;historique des demandes</li>
              <li>Les permissions et accès</li>
            </ul>
          </div>

          {error && <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Suppression...
              </div>
            ) : (
              "Supprimer définitivement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
