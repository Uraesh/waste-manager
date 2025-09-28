"use client"

import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { paymentProviders, type PaymentProvider } from "@/lib/payment-providers"

interface PaymentMethodSelectorProps {
  amount: number
  currency: string
  onPaymentMethodSelect: (provider: PaymentProvider) => void
}

export function PaymentMethodSelector({ amount, currency, onPaymentMethodSelect }: PaymentMethodSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg border border-red-200/20">
        <h3 className="text-2xl font-bold text-red-600 mb-2">Montant à payer</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatAmount(amount, currency)}</p>
      </div>

      <div className="grid gap-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Choisissez votre méthode de paiement</h4>

        {paymentProviders.map((provider: PaymentProvider) => (
          <Card
            key={provider.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedProvider === provider.id
                ? "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20"
                : "hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
            } ${!provider.supported ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => {
              if (provider.supported) {
                setSelectedProvider(provider.id)
              }
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  {!provider.supported && (
                    <Badge variant="secondary" className="mb-1">
                      Bientôt disponible
                    </Badge>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">Frais: {provider.fees}</p>
                  <p className="text-xs text-gray-500">{provider.processingTime}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedProvider && (
        <div className="pt-4">
          <Button
            onClick={() => {
              const provider = paymentProviders.find((p: PaymentProvider) => p.id === selectedProvider)
              if (provider) {
                onPaymentMethodSelect(provider)
              }
            }}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            size="lg"
          >
            Continuer avec {paymentProviders.find((p: PaymentProvider) => p.id === selectedProvider)?.name}
          </Button>
        </div>
      )}
    </div>
  )
}
