"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Request {
  id: string
  title: string
  client: string
  location: string
  type: "Collecte" | "Recyclage" | "Déchets spéciaux" | "Urgence"
  status: "En attente" | "En cours" | "Terminé" | "Annulé"
  priority: "Basse" | "Normale" | "Haute" | "Urgente"
  createdAt: string
  assignedTo?: string
  description: string
  estimatedDuration?: string
  contactPhone?: string
  specialInstructions?: string
}

interface RequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (request: Partial<Request>) => void
  request?: Request | null
  mode: "create" | "edit"
  currentUserRole: string
}

import { useEffect } from "react"

export function RequestModal({ isOpen, onClose, onSave, request, mode, currentUserRole }: RequestModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    description: "",
    service_type: "ramassage",
    priority: "medium",
    status: "pending",
    special_instructions: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (mode === "edit" && request) {
        // Map frontend display values back to DB values for editing
        const typeToDb: { [key: string]: string } = { "Collecte": "ramassage", "Recyclage": "recyclage", "Déchets spéciaux": "dechets_speciaux", "Urgence": "urgence" }
        const priorityToDb: { [key: string]: string } = { "Basse": "low", "Normale": "medium", "Haute": "high", "Urgente": "urgent" }
        const statusToDb: { [key: string]: string } = { "En attente": "pending", "En cours": "in_progress", "Terminé": "completed", "Annulé": "cancelled" }

        setFormData({
          title: request.title,
          location: request.location,
          description: request.description,
          service_type: typeToDb[request.type] || "ramassage",
          priority: priorityToDb[request.priority] || "medium",
          status: statusToDb[request.status] || "pending",
          special_instructions: request.specialInstructions || "",
        })
      } else {
        // Reset for create mode
        setFormData({
          title: "",
          location: "",
          description: "",
          service_type: "ramassage",
          priority: "medium",
          status: "pending",
          special_instructions: "",
        })
      }
    }
  }, [isOpen, request, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = mode === "create" ? "/api/requests" : `/api/requests/${request?.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || "Une erreur est survenue.")
      }

      onSave(result) // Notify parent to refetch data
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
      <DialogContent className="sm:max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            {mode === "create" ? "Créer une demande" : "Modifier la demande"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la demande</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50"
              placeholder="Ex: Collecte de déchets industriels"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Localisation</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50"
              placeholder="Adresse complète"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                name="service_type"
                value={formData.service_type}
                onValueChange={(value: string) => handleChange("service_type", value)}
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ramassage">Collecte</SelectItem>
                  <SelectItem value="recyclage">Recyclage</SelectItem>
                  <SelectItem value="dechets_speciaux">Déchets spéciaux</SelectItem>
                  <SelectItem value="urgence">Urgence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                name="priority"
                value={formData.priority}
                onValueChange={(value: string) => handleChange("priority", value)}
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Normale</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentUserRole === "admin" && (
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value: string) => handleChange("status", value)}
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="assigned">Assigné</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description détaillée</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50 min-h-[100px]"
              placeholder="Décrivez en détail la nature des déchets, la quantité estimée, les contraintes d'accès..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Instructions spéciales</Label>
            <Textarea
              id="specialInstructions"
              name="special_instructions"
              value={formData.special_instructions}
              onChange={(e) => handleChange("special_instructions", e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50"
              placeholder="Consignes particulières, équipements nécessaires, contraintes d'horaires..."
            />
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
                "Créer la demande"
              ) : (
                "Modifier la demande"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
