"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Payment {
  id: string
  clientName: string
  amount: number
  status: "paid" | "pending" | "overdue" | "cancelled" | "refunded"
  dueDate: string
  paidDate?: string
  service: string
  method?: "card" | "transfer" | "cash" | "check"
  invoiceNumber?: string
  taxAmount?: number
  discountAmount?: number
  notes?: string
  recurringType?: "monthly" | "quarterly" | "yearly" | "none"
}

interface Invoice {
  id: string
  clientName: string
  clientEmail: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  dueDate: string
  status: "draft" | "sent" | "paid" | "overdue"
  createdDate: string
}

const mockPayments: Payment[] = [
  {
    id: "PAY-001",
    clientName: "Jean Dupont",
    amount: 450,
    status: "paid",
    dueDate: "2024-01-15",
    paidDate: "2024-01-14",
    service: "Collecte déchets industriels",
    method: "card",
    invoiceNumber: "INV-2024-001",
    taxAmount: 90,
    recurringType: "monthly",
  },
]

const mockInvoices: Invoice[] = [
  {
    id: "INV-2024-001",
    clientName: "Jean Dupont",
    clientEmail: "jean.dupont@email.com",
    items: [
      { description: "Collecte déchets industriels", quantity: 1, unitPrice: 360, total: 360 },
      { description: "Transport et traitement", quantity: 1, unitPrice: 90, total: 90 },
    ],
    subtotal: 450,
    taxRate: 20,
    taxAmount: 90,
    discountAmount: 0,
    totalAmount: 540,
    dueDate: "2024-01-15",
    status: "paid",
    createdDate: "2024-01-01",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-500 text-white"
    case "pending":
      return "bg-yellow-500 text-white"
    case "overdue":
      return "bg-red-500 text-white"
    case "cancelled":
      return "bg-gray-500 text-white"
    case "refunded":
      return "bg-blue-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "paid":
      return "Payé"
    case "pending":
      return "En attente"
    case "overdue":
      return "En retard"
    case "cancelled":
      return "Annulé"
    case "refunded":
      return "Remboursé"
    default:
      return "Inconnu"
  }
}

const getMethodIcon = (method: string) => {
  switch (method) {
    case "card":
      return "💳"
    case "transfer":
      return "🏦"
    case "cash":
      return "💵"
    case "check":
      return "🧾"
    default:
      return ""
  }
}

export function PaymentsManagement() {
  const [payments] = useState<Payment[]>(mockPayments)
  const [invoices] = useState<Invoice[]>(mockInvoices)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")

  const totalAmount = payments.reduce((acc, payment) => acc + payment.amount, 0)
  const paidAmount = payments.reduce((acc, payment) => acc + (payment.status === "paid" ? payment.amount : 0), 0)

  const filteredPayments = payments.filter((payment) => statusFilter === "all" || payment.status === statusFilter)

  const processRefund = (paymentId: string) => {
    console.log(`[v0] Processing refund for payment ${paymentId}: €${refundAmount}`)
    setShowRefundModal(false)
    setRefundAmount("")
    setRefundReason("")
  }

  const sendPaymentReminder = (paymentId: string) => {
    console.log(`[v0] Sending payment reminder for ${paymentId}`)
  }

  const generateInvoice = (payment: Payment) => {
    console.log(`[v0] Generating invoice for payment ${payment.id}`)
    setShowInvoiceModal(true)
  }

  const exportPayments = () => {
    console.log(`[v0] Exporting ${filteredPayments.length} payments to CSV`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Gestion des Paiements
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportPayments}
            className="glass hover:scale-[1.02] transition-transform bg-transparent"
          >
            📊 Exporter
          </Button>
          <Button
            onClick={() => setShowInvoiceModal(true)}
            className="bg-gradient-to-r from-primary to-accent hover:scale-[1.02] transition-transform shadow-lg"
          >
            📄 Nouvelle Facture
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-secondary/50 bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-sm text-muted-foreground">Revenus Totaux</p>
                <p className="text-2xl font-bold">€{totalAmount.toLocaleString()}</p>
                <p className="text-xs text-green-500">+12% ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm text-muted-foreground">Payé</p>
                <p className="text-2xl font-bold">€{paidAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((paidAmount / totalAmount) * 100)}% du total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold">€{(totalAmount - paidAmount).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {filteredPayments.filter((p) => p.status === "pending").length} factures
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="text-sm text-muted-foreground">En Retard</p>
                <p className="text-2xl font-bold">{filteredPayments.filter((p) => p.status === "overdue").length}</p>
                <p className="text-xs text-muted-foreground">Nécessitent attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass">
          <TabsTrigger value="payments">💳 Paiements</TabsTrigger>
          <TabsTrigger value="invoices">📄 Factures</TabsTrigger>
          <TabsTrigger value="analytics">📊 Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💳</span>
                Paiements ({filteredPayments.length})
              </CardTitle>
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 glass-strong">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="refunded">Remboursé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 glass rounded-lg hover:scale-[1.01] transition-all duration-300 border border-border/50 hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{payment.id}</span>
                          <Badge className={getStatusColor(payment.status)}>{getStatusLabel(payment.status)}</Badge>
                          {payment.recurringType && payment.recurringType !== "none" && (
                            <Badge variant="outline" className="bg-blue-500/10 border-blue-500">
                              🔄 {payment.recurringType}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-lg">{payment.service}</h3>
                        <p className="text-sm text-muted-foreground">Client: {payment.clientName}</p>
                        {payment.invoiceNumber && (
                          <p className="text-xs text-muted-foreground">Facture: {payment.invoiceNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-secondary">€{payment.amount.toLocaleString()}</div>
                        {payment.taxAmount && (
                          <div className="text-xs text-muted-foreground">dont TVA: €{payment.taxAmount}</div>
                        )}
                        <div className="text-sm text-muted-foreground">Échéance: {payment.dueDate}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {payment.paidDate && <span>✅ Payé le {payment.paidDate}</span>}
                        {payment.method && (
                          <span className="flex items-center gap-1">
                            {getMethodIcon(payment.method)} {payment.method}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {payment.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendPaymentReminder(payment.id)}
                            className="glass"
                          >
                            📧 Rappel
                          </Button>
                        )}
                        {payment.status === "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setShowRefundModal(true)
                            }}
                            className="glass"
                          >
                            💸 Rembourser
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => generateInvoice(payment)} className="glass">
                          📄 Facture
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                          className="bg-gradient-to-r from-primary to-accent"
                        >
                          👁️ Détails
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📄</span>
                Factures ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 glass rounded-lg border border-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{invoice.id}</span>
                          <Badge className={getStatusColor(invoice.status)}>{getStatusLabel(invoice.status)}</Badge>
                        </div>
                        <h3 className="font-medium">{invoice.clientName}</h3>
                        <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-secondary">€{invoice.totalAmount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Échéance: {invoice.dueDate}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="glass bg-transparent">
                        📧 Envoyer
                      </Button>
                      <Button size="sm" variant="outline" className="glass bg-transparent">
                        📥 Télécharger
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                        👁️ Voir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>📈 Tendances des Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Graphique des revenus mensuels
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader>
                <CardTitle>🎯 Méthodes de Paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">💳 Carte bancaire</span>
                    <span className="font-semibold">65%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">🏦 Virement</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">💵 Espèces</span>
                    <span className="font-semibold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass border-primary/50 shadow-2xl max-w-md w-full m-4">
            <CardHeader>
              <CardTitle>📄 Nouvelle Facture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Création de facture à venir…
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowInvoiceModal(false)} className="flex-1 bg-gradient-to-r from-primary to-accent">
                  Fermer
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass border-primary/50 shadow-2xl max-w-md w-full m-4">
            <CardHeader>
              <CardTitle>💸 Rembourser le Paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="refund-amount">Montant à rembourser</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Max: €${selectedPayment.amount}`}
                  className="glass-strong"
                />
              </div>
              <div>
                <Label htmlFor="refund-reason">Raison du remboursement</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Expliquez la raison du remboursement..."
                  className="glass-strong"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => processRefund(selectedPayment.id)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500"
                >
                  Confirmer Remboursement
                </Button>
                <Button variant="outline" onClick={() => setShowRefundModal(false)} className="flex-1 glass">
                  Annuler
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  )
}
