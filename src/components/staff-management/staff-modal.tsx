"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface StaffProfile {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'on_leave';
  email?: string; // Not in DB schema but needed for creation
}

interface StaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void // Simple callback to trigger a refetch
  staffMember?: StaffProfile | null
  mode: "create" | "edit"
}

export function StaffModal({ isOpen, onClose, onSave, staffMember, mode }: StaffModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    position: "",
    phone: "",
    address: "",
    status: "active",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (mode === "edit" && staffMember) {
        setFormData({
          first_name: staffMember.first_name,
          last_name: staffMember.last_name,
          email: staffMember.email || '', // Email might not be passed for edits
          password: '',
          position: staffMember.position,
          phone: staffMember.phone || '',
          address: staffMember.address || '',
          status: staffMember.status,
        })
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          position: "",
          phone: "",
          address: "",
          status: "active",
        })
      }
    }
  }, [isOpen, staffMember, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = mode === "create" ? "/api/staff" : `/api/staff/${staffMember?.id}`
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

      onSave()
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Ajouter un membre" : "Modifier le membre"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input id="first_name" name="first_name" value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input id="last_name" name="last_name" value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} required />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} required disabled={mode === 'edit'} />
            </div>
            {mode === 'create' && (
                <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} required />
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="position">Poste</Label>
                <Input id="position" name="position" value={formData.position} onChange={(e) => handleChange("position", e.target.value)} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" name="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} />
            </div>
            <div className="space-y-2">
                 <Label htmlFor="status">Statut</Label>
                 <Select name="status" value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                        <SelectItem value="on_leave">En congé</SelectItem>
                    </SelectContent>
                 </Select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Enregistrement..." : "Enregistrer"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}