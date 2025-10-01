"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleBasedNavigation } from "@/components/navigation/role-nav"
import { PaymentModal } from "@/components/payment-management/payment-modal"

// Interface for a Payment
interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  due_date?: string;
  created_at: string;
  mission: { title: string };
  client: { company_name: string };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const router = useRouter()

  const fetchPayments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/payments")
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les paiements.")
      }
      setPayments(data.payments)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "admin") {
      router.push("/dashboard")
      return
    }
    fetchPayments()
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="ml-4 text-gray-600 dark:text-gray-300">Chargement des paiements...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center bg-white dark:bg-gray-800">
          <div className="text-5xl mb-4">💸</div>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Erreur de chargement</h2>
          <p className="text-red-600 dark:text-red-300 font-medium">{error}</p>
        </Card>
      </div>
    )
  }

  const handleCreatePayment = () => {
    setSelectedPayment(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-gray-900">
      <RoleBasedNavigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
              Gestion des Paiements
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Suivez et gérez toutes les transactions financières ({payments.length} paiements).
            </p>
          </div>
          <Button onClick={handleCreatePayment} className="bg-gradient-to-r from-red-600 to-rose-600 shadow-lg">
            + Nouveau Paiement
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Mission</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.client.company_name}</TableCell>
                    <TableCell>{payment.mission.title}</TableCell>
                    <TableCell className="text-right font-medium">{payment.amount} {payment.currency}</TableCell>
                    <TableCell><Badge className={getStatusColor(payment.payment_status)}>{payment.payment_status}</Badge></TableCell>
                    <TableCell>{new Date(payment.created_at).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEditPayment(payment)}>Détails</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
       <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchPayments}
        payment={selectedPayment}
        mode={modalMode}
      />
    </div>
  )
}