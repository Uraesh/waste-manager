"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface StaffProfile {
  id: string;
  first_name: string;
  last_name: string;
}

interface DeleteStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  staffMember: StaffProfile | null
}

export function DeleteStaffModal({ isOpen, onClose, onConfirm, staffMember }: DeleteStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!staffMember) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer {staffMember.first_name} {staffMember.last_name} ?</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Êtes-vous sûr de vouloir supprimer ce membre du personnel ? Cette action est irréversible et supprimera également son compte utilisateur associé.</p>
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}