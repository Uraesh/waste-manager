/**
 * @fileoverview API Routes pour la gestion des paiements
 * Ce fichier gère les opérations CRUD pour les paiements des missions
 * Chaque paiement est associé à une mission et un client spécifiques
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * Interface pour typer les données d'un paiement
 */
interface PaymentData {
  client_id: string
  mission_id: string
  amount: number
  currency?: string
  payment_method: 'stripe' | 'paypal' | 'bank_transfer' | 'cash'
  stripe_payment_intent_id?: string
  paypal_order_id?: string
  transaction_fee?: number
  invoice_ref?: string
  description?: string
  payment_details?: string
  due_date?: string
}

/**
 * Fonction utilitaire pour valider les données de paiement
 */
function validatePaymentData(data: PaymentData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.client_id) {
    errors.push("client_id est requis")
  }
  if (!data.mission_id) {
    errors.push("mission_id est requis")
  }
  if (!data.amount || data.amount <= 0) {
    errors.push("amount doit être un nombre positif")
  }
  if (!data.payment_method) {
    errors.push("payment_method est requis")
  }
  
  const validPaymentMethods = ['stripe', 'paypal', 'bank_transfer', 'cash']
  if (data.payment_method && !validPaymentMethods.includes(data.payment_method)) {
    errors.push("payment_method doit être: " + validPaymentMethods.join(', '))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * GET - Récupère tous les paiements
 * @param request - La requête Next.js entrante
 * @returns Les paiements avec les informations de la mission et du client
 * @throws 401 si l'utilisateur n'est pas authentifié
 * @throws 500 en cas d'erreur serveur
 */
export async function GET(request: NextRequest) {
  try {
    // Initialisation du client Supabase avec les cookies
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Vérification de l'authentification utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Erreur d'authentification:", authError)
      return NextResponse.json(
        { error: "Erreur d'authentification", details: authError.message }, 
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" }, 
        { status: 401 }
      )
    }

    // Extraction des paramètres de requête pour le filtrage
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")
    const missionId = searchParams.get("mission_id")
    const paymentStatus = searchParams.get("payment_status")
    const paymentMethod = searchParams.get("payment_method")
    const limit = searchParams.get("limit")

    // Construction de la requête avec jointures
    let query = supabase.from("payments").select(`
        id,
        client_id,
        mission_id,
        amount,
        currency,
        payment_method,
        payment_status,
        stripe_payment_intent_id,
        paypal_order_id,
        transaction_fee,
        invoice_ref,
        invoice_url,
        description,
        payment_details,
        due_date,
        paid_at,
        created_at,
        updated_at,
        mission:missions (
          id,
          title,
          description,
          location,
          scheduled_date,
          service_type,
          status,
          client:clients (
            id,
            company_name,
            contact_person,
            phone,
            user:users (
              id,
              full_name,
              email
            )
          )
        ),
        client:clients (
          id,
          company_name,
          contact_person,
          phone,
          address,
          contract_type,
          user:users (
            id,
            full_name,
            email
          )
        )
      `)

    // Application des filtres
    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    if (missionId) {
      query = query.eq("mission_id", missionId)
    }

    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus)
    }

    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod)
    }

    // Limite de résultats
    if (limit && !isNaN(Number(limit))) {
      query = query.limit(Number(limit))
    }

    // Tri par date de création (plus récent en premier)
    query = query.order("created_at", { ascending: false })

    const { data: payments, error } = await query

    if (error) {
      console.error("Erreur lors de la récupération des paiements:", error)
      return NextResponse.json(
        { error: "Échec de la récupération des paiements", details: error.message }, 
        { status: 500 }
      )
    }

    // Calcul de statistiques
    const totalAmount = payments?.reduce((sum: number, payment: { amount: number }) => sum + (payment.amount || 0), 0) || 0
    const pendingAmount = payments?.filter((p: { payment_status: string | number; }) => p.payment_status === 'pending')
                                  .reduce((sum: number, payment: { amount: number }) => sum + (payment.amount || 0), 0) || 0
    const completedAmount = payments?.filter((p: { payment_status: string | number; }) => p.payment_status === 'completed')
                                    .reduce((sum: number, payment: { amount: number }) => sum + (payment.amount || 0), 0) || 0

    return NextResponse.json({ 
      payments,
      count: payments?.length || 0,
      statistics: {
        total_amount: totalAmount,
        pending_amount: pendingAmount,
        completed_amount: completedAmount
      },
      filters: { clientId, missionId, paymentStatus, paymentMethod, limit }
    })

  } catch (error) {
    console.error("Erreur inattendue dans l'API payments:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * POST - Crée un nouveau paiement
 * @param request - La requête Next.js entrante avec les données du paiement
 * @returns Le nouveau paiement créé
 * @throws 400 si les données sont invalides
 * @throws 401 si l'utilisateur n'est pas authentifié
 * @throws 500 en cas d'erreur lors de la création
 */
export async function POST(request: NextRequest) {
  try {
    // Initialisation du client Supabase
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Vérification de l'authentification utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Erreur d'authentification:", authError)
      return NextResponse.json(
        { error: "Erreur d'authentification", details: authError.message }, 
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" }, 
        { status: 401 }
      )
    }

    // Récupération et validation du corps de la requête
    const body = await request.json()
    const validation = validatePaymentData(body)

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.errors }, 
        { status: 400 }
      )
    }

    const { 
      client_id, 
      mission_id, 
      amount,
      currency = "EUR",
      payment_method,
      stripe_payment_intent_id,
      paypal_order_id,
      transaction_fee = 0,
      invoice_ref,
      description,
      payment_details,
      due_date
    } = body as PaymentData

    // Vérification que la mission existe
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("id, client_id, status")
      .eq("id", mission_id)
      .single()

    if (missionError || !mission) {
      return NextResponse.json(
        { error: "Mission non trouvée" }, 
        { status: 404 }
      )
    }

    // Vérification que le client correspond à celui de la mission
    if (mission.client_id !== client_id) {
      return NextResponse.json(
        { error: "Le client ne correspond pas à celui de la mission" }, 
        { status: 400 }
      )
    }

    // Vérification que le client existe
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client non trouvé" }, 
        { status: 404 }
      )
    }

    // Génération d'une référence de facture si non fournie
    const generatedInvoiceRef = invoice_ref || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Création du paiement
    const { data: payment, error: createError } = await supabase
      .from("payments")
      .insert({
        client_id,
        mission_id,
        amount,
        currency,
        payment_method,
        payment_status: "pending",
        stripe_payment_intent_id,
        paypal_order_id,
        transaction_fee,
        invoice_ref: generatedInvoiceRef,
        description,
        payment_details,
        due_date,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        mission:missions (
          title,
          description,
          location,
          service_type
        ),
        client:clients (
          company_name,
          contact_person,
          user:users (
            full_name,
            email
          )
        )
      `)
      .single()

    if (createError) {
      console.error("Erreur lors de la création du paiement:", createError)
      return NextResponse.json(
        { error: "Échec de la création du paiement", details: createError.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      payment,
      message: "Paiement créé avec succès"
    }, { status: 201 })

  } catch (error) {
    console.error("Erreur lors de la création du paiement:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * PUT - Met à jour un paiement existant
 * @param request - La requête avec l'ID du paiement et les nouvelles données
 * @returns Le paiement mis à jour
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Vérification de l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, payment_status, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID du paiement requis" }, 
        { status: 400 }
      )
    }

    // Si le statut passe à "completed", ajouter la date de paiement
    if (payment_status === "completed" && !updateData.paid_at) {
      updateData.paid_at = new Date().toISOString()
    }

    // Mise à jour du paiement
    const { data: payment, error } = await supabase
      .from("payments")
      .update({
        payment_status,
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(`
        *,
        mission:missions (
          title,
          description,
          location,
          service_type
        ),
        client:clients (
          company_name,
          contact_person,
          user:users (
            full_name,
            email
          )
        )
      `)
      .single()

    if (error) {
      console.error("Erreur lors de la mise à jour du paiement:", error)
      return NextResponse.json(
        { error: "Échec de la mise à jour du paiement", details: error.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      payment,
      message: "Paiement mis à jour avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour du paiement:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprime un paiement (avec vérifications de sécurité)
 * @param request - La requête avec l'ID du paiement à supprimer
 * @returns Confirmation de suppression
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Vérification de l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID du paiement requis" }, 
        { status: 400 }
      )
    }

    // Vérifier le statut du paiement avant suppression
    const { data: existingPayment, error: fetchError } = await supabase
      .from("payments")
      .select("id, payment_status")
      .eq("id", id)
      .single()

    if (fetchError || !existingPayment) {
      return NextResponse.json(
        { error: "Paiement non trouvé" }, 
        { status: 404 }
      )
    }

    // Ne pas permettre la suppression de paiements complétés
    if (existingPayment.payment_status === "completed") {
      return NextResponse.json(
        { error: "Impossible de supprimer un paiement complété" }, 
        { status: 400 }
      )
    }

    // Suppression du paiement
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erreur lors de la suppression du paiement:", error)
      return NextResponse.json(
        { error: "Échec de la suppression du paiement", details: error.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: "Paiement supprimé avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de la suppression du paiement:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}