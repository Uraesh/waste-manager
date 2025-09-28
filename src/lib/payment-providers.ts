export interface PaymentProvider {
  id: string
  name: string
  icon: string
  description: string
  fees: string
  processingTime: string
  supported: boolean
  supported_methods: string[]
  setup_required: boolean
}

export const paymentProviders: PaymentProvider[] = [
  {
    id: "stripe",
    name: "Stripe",
    icon: "💳",
    description: "Paiement par carte bancaire sécurisé",
    fees: "2.9% + 0.30€",
    processingTime: "Instantané",
    supported: true,
    supported_methods: ["card", "sepa", "ideal"],
    setup_required: true,
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: "🅿️",
    description: "Paiement via votre compte PayPal",
    fees: "3.4% + 0.35€",
    processingTime: "Instantané",
    supported: true,
    supported_methods: ["paypal", "card"],
    setup_required: true,
  },
  {
    id: "bank_transfer",
    name: "Virement Bancaire",
    icon: "🏦",
    description: "Virement bancaire traditionnel",
    fees: "Gratuit",
    processingTime: "1-3 jours ouvrés",
    supported: true,
    supported_methods: ["sepa", "wire"],
    setup_required: false,
  },
  {
    id: "orange_money",
    name: "Orange Money",
    icon: "🟠",
    description: "Paiement mobile Orange Money",
    fees: "1.5%",
    processingTime: "Instantané",
    supported: false,
    supported_methods: ["mobile_money"],
    setup_required: true,
  },
  {
    id: "mtn_money",
    name: "MTN Mobile Money",
    icon: "📱",
    description: "Paiement mobile MTN",
    fees: "1.8%",
    processingTime: "Instantané",
    supported: false,
    supported_methods: ["mobile_money"],
    setup_required: true,
  },
]

export function getPaymentProvider(id: string): PaymentProvider | undefined {
  return paymentProviders.find((provider) => provider.id === id)
}

export function getAvailablePaymentMethods(): string[] {
  return [...new Set(paymentProviders.flatMap((p) => p.supported_methods))]
}

// Payment processing functions (to be implemented with actual APIs)
export async function processStripePayment(amount: number, currency = "EUR") {
  // TODO: Implement Stripe payment processing
  throw new Error(`Stripe integration not yet implemented for currency ${currency}`)
}

export async function processPayPalPayment(amount: number, currency = "EUR") {
  // TODO: Implement PayPal payment processing
  throw new Error(`PayPal integration not yet implemented for currency ${currency}`)
}

export async function processOrangeMoneyPayment() {
  // TODO: Implement Orange Money API integration
  throw new Error("Orange Money integration not yet implemented")
}

export async function processMTNMoneyPayment() {
  // TODO: Implement MTN Mobile Money API integration
  throw new Error("MTN Money integration not yet implemented")
}
