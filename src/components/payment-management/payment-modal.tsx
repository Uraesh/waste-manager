"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "../ui/textarea"

interface Payment {
  id: string;
  mission_id: string;
  amount: number;
  payment_method: 'stripe' | 'paypal' | 'bank_transfer' | 'cash';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  description?: string;
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  payment?: Payment | null
  mode: "create" | "edit"
}

export function PaymentModal({ isOpen, onClose, onSave, payment, mode }: PaymentModalProps) {
  const [formData, setFormData] = useState({
    mission_id: "",
    amount: 0,
    payment_method: 'bank_transfer',
    payment_status: 'pending',
    description: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (mode === 'edit' && payment) {
        setFormData({
            mission_id: payment.mission_id,
            amount: payment.amount,
            payment_method: payment.payment_method,
            payment_status: payment.payment_status,
            description: payment.description || ""
        })
      } else {
        setFormData({
            mission_id: "",
            amount: 0,
            payment_method: 'bank_transfer',
            payment_status: 'pending',
            description: ""
        })
      }
    }
  }, [isOpen, payment, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = mode === 'create' ? '/api/payments' : `/api/payments/${payment?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nouveau Paiement' : 'Modifier le Paiement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mission_id">ID de la Mission</Label>
            <Input id="mission_id" name="mission_id" value={formData.mission_id} onChange={e => handleChange("mission_id", e.target.value)} required disabled={mode === 'edit'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Montant</Label>
            <Input id="amount" name="amount" type="number" value={formData.amount} onChange={e => handleChange("amount", Number(e.target.value))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_method">Méthode de Paiement</Label>
            <Select name="payment_method" value={formData.payment_method} onValueChange={value => handleChange("payment_method", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                <SelectItem value="cash">Espèces</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="payment_status">Statut du Paiement</Label>
              <Select name="payment_status" value={formData.payment_status} onValueChange={value => handleChange("payment_status", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                   <SelectItem value="refunded">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
           <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} />
            </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}