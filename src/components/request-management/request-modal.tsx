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

export function RequestModal({ isOpen, onClose, onSave, request, mode, currentUserRole }: RequestModalProps) {
  const [formData, setFormData] = useState({
    title: request?.title || "",
    client: request?.client || "",
    location: request?.location || "",
    type: request?.type || "Collecte",
    status: request?.status || "En attente",
    priority: request?.priority || "Normale",
    description: request?.description || "",
    estimatedDuration: request?.estimatedDuration || "30min",
    contactPhone: request?.contactPhone || "",
    specialInstructions: request?.specialInstructions || "",
    assignedTo: request?.assignedTo || "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const staffMembers = ["Jean Dupont", "Pierre Martin", "Sophie Laurent", "Marc Dubois", "Claire Moreau"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      onSave({
        ...formData,
        id: request?.id || `REQ-${String(Date.now()).slice(-3).padStart(3, "0")}`,
        createdAt: request?.createdAt || new Date().toISOString(),
      })
      setIsLoading(false)
      onClose()
    }, 1000)
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
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                name="client"
                value={formData.client}
                onChange={(e) => handleChange("client", e.target.value)}
                className="bg-white/50 dark:bg-gray-800/50"
                placeholder="Nom du client"
                required
              />
            </div>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" value={formData.type} onValueChange={(value: string) => handleChange("type", value)}>
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Collecte">Collecte</SelectItem>
                  <SelectItem value="Recyclage">Recyclage</SelectItem>
                  <SelectItem value="Déchets spéciaux">Déchets spéciaux</SelectItem>
                  <SelectItem value="Urgence">Urgence</SelectItem>
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
                  <SelectItem value="Basse">Basse</SelectItem>
                  <SelectItem value="Normale">Normale</SelectItem>
                  <SelectItem value="Haute">Haute</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
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
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Terminé">Terminé</SelectItem>
                    <SelectItem value="Annulé">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Téléphone de contact</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                className="bg-white/50 dark:bg-gray-800/50"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Durée estimée</Label>
              <Select
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onValueChange={(value: string) => handleChange("estimatedDuration", value)}
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30min">30 minutes</SelectItem>
                  <SelectItem value="1h">1 heure</SelectItem>
                  <SelectItem value="2h">2 heures</SelectItem>
                  <SelectItem value="4h">4 heures</SelectItem>
                  <SelectItem value="1j">1 journée</SelectItem>
                  <SelectItem value="2j">2 journées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentUserRole === "admin" && (
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigner à</Label>
              <Select
                name="assignedTo"
                value={formData.assignedTo}
                onValueChange={(value: string) => handleChange("assignedTo", value)}
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                  <SelectValue placeholder="Sélectionner un membre du personnel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Non assigné">Non assigné</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff} value={staff}>
                      {staff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Instructions spéciales</Label>
            <Textarea
              id="specialInstructions"
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={(e) => handleChange("specialInstructions", e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50"
              placeholder="Consignes particulières, équipements nécessaires, contraintes d'horaires..."
            />
          </div>

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
