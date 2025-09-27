/**
 * @fileoverview API Routes pour la gestion des demandes de service
 * Ce fichier gère les opérations CRUD pour les demandes de service dans l'application
 * CORRIGÉ : Utilise maintenant la table "missions" selon le schéma Supabase réel
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * Interface pour typer les données d'une demande de service
 */
interface ServiceRequestData {
  title: string
  description?: string
  client_id: string
  location: string
  scheduled_date?: string
  scheduled_time?: string
  estimated_duration?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  service_type: 'ramassage' | 'recyclage' | 'dechets_speciaux' | 'urgence'
  zone?: string
  equipment_needed?: string[]
  special_instructions?: string
  gps_location?: {
    latitude: number
    longitude: number
  }
}

/**
 * Fonction utilitaire pour valider les données de demande de service
 */
function validateRequestData(data: ServiceRequestData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.title || data.title.trim() === '') {
    errors.push("title est requis")
  }
  if (!data.client_id) {
    errors.push("client_id est requis")
  }
  if (!data.location || data.location.trim() === '') {
    errors.push("location est requis")
  }
  if (!data.service_type) {
    errors.push("service_type est requis")
  }
  
  const validServiceTypes = ['ramassage', 'recyclage', 'dechets_speciaux', 'urgence']
  if (data.service_type && !validServiceTypes.includes(data.service_type)) {
    errors.push("service_type doit être: " + validServiceTypes.join(', '))
  }
  
  const validPriorities = ['low', 'medium', 'high', 'urgent']
  if (data.priority && !validPriorities.includes(data.priority)) {
    errors.push("priority doit être: " + validPriorities.join(', '))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * GET - Récupère toutes les demandes de service
 * @param request - La requête Next.js entrante
 * @returns Les demandes de service avec les informations du client et du personnel assigné
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
    const status = searchParams.get("status")
    const serviceType = searchParams.get("service_type")
    const priority = searchParams.get("priority")
    const zone = searchParams.get("zone")
    const limit = searchParams.get("limit")

    // Récupère les demandes de service (missions) avec les informations associées :
    // - Informations du client (nom de l'entreprise, personne de contact)
    // - Informations de l'utilisateur client (email, nom complet)
    // - Informations du personnel assigné (nom, prénom)
    let query = supabase
      .from("missions")
      .select(`
        id,
        title,
        description,
        client_id,
        assigned_staff_id,
        location,
        scheduled_date,
        scheduled_time,
        estimated_duration,
        priority,
        status,
        service_type,
        zone,
        equipment_needed,
        gps_location,
        special_instructions,
        created_at,
        updated_at,
        client:clients (
          id,
          company_name,
          contact_person,
          phone,
          address,
          user:users (
            id,
            email,
            full_name
          )
        ),
        assigned_staff:staff_profiles (
          id,
          first_name,
          last_name,
          position,
          department,
          phone
        ),
        mission_updates (
          id,
          update_type,
          content,
          photo_url,
          timestamp
        ),
        comments (
          id,
          content,
          created_at,
          user:users (
            full_name
          )
        ),
        payments (
          id,
          amount,
          payment_status,
          payment_method,
          created_at
        )
      `)

    // Application des filtres
    if (clientId) {
      query = query.eq("client_id", clientId)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (serviceType) {
      query = query.eq("service_type", serviceType)
    }
    if (priority) {
      query = query.eq("priority", priority)
    }
    if (zone) {
      query = query.eq("zone", zone)
    }

    // Limite de résultats
    if (limit && !isNaN(Number(limit))) {
      query = query.limit(Number(limit))
    }

    // Tri par date de création (plus récent en premier)
    query = query.order("created_at", { ascending: false })

    const { data: requests, error } = await query

    if (error) {
      console.error("Erreur lors de la récupération des demandes:", error)
      return NextResponse.json(
        { error: "Échec de la récupération des demandes", details: error.message }, 
        { status: 500 }
      )
    }

    // Calcul de statistiques
    const statusCounts = requests?.reduce((acc: Record<string, number>, request: { status: string | number; }) => {
      acc[request.status] = (acc[request.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const serviceTypeCounts = requests?.reduce((acc: Record<string, number>, request: { service_type: string | number; }) => {
      acc[request.service_type] = (acc[request.service_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({ 
      requests,
      count: requests?.length || 0,
      statistics: {
        status_counts: statusCounts,
        service_type_counts: serviceTypeCounts,
        total: requests?.length || 0
      },
      filters: { clientId, status, serviceType, priority, zone, limit }
    })

  } catch (error) {
    console.error("Erreur inattendue dans l'API requests:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * POST - Crée une nouvelle demande de service
 * @param request - La requête Next.js entrante contenant les données de la demande
 * @returns La nouvelle demande créée
 * @throws 400 si les données sont invalides
 * @throws 401 si l'utilisateur n'est pas authentifié
 * @throws 500 en cas d'erreur lors de la création
 */
export async function POST(request: NextRequest) {
  try {
    // Initialisation du client Supabase avec les cookies de la session
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Vérification de l'authentification de l'utilisateur actuel
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
    const validation = validateRequestData(body)

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.errors }, 
        { status: 400 }
      )
    }

    const { 
      title,
      description,
      client_id, 
      location,
      scheduled_date,
      scheduled_time,
      estimated_duration,
      priority = "medium",
      service_type,
      zone,
      equipment_needed,
      special_instructions,
      gps_location
    } = body as ServiceRequestData

    // Vérification que le client existe
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, company_name")
      .eq("id", client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client non trouvé" }, 
        { status: 404 }
      )
    }

    // Création de la nouvelle demande de service dans la table missions
    // Les champs requis selon le schéma sont:
    // - title: Titre de la mission
    // - client_id: ID du client qui fait la demande
    // - service_type: Type de service demandé (ramassage, recyclage, etc.)
    // - location: Lieu où le service doit être effectué
    // - priority: Priorité de la demande (par défaut: "medium")
    const { data: request_data, error } = await supabase
      .from("missions")
      .insert({
        title,
        description,
        client_id,
        location,
        scheduled_date,
        scheduled_time,
        estimated_duration,
        priority,
        service_type,
        zone,
        equipment_needed,
        special_instructions,
        gps_location,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
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
      console.error("Erreur lors de la création de la demande:", error)
      return NextResponse.json(
        { error: "Échec de la création de la demande", details: error.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      request: request_data,
      message: "Demande de service créée avec succès"
    }, { status: 201 })

  } catch (error) {
    console.error("Erreur lors de la création de la demande:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * PUT - Met à jour une demande de service existante
 * @param request - La requête avec l'ID de la demande et les nouvelles données
 * @returns La demande mise à jour
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID de la demande requis" }, 
        { status: 400 }
      )
    }

    // Mise à jour de la demande
    const { data: request_data, error } = await supabase
      .from("missions")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(`
        *,
        client:clients (
          company_name,
          contact_person,
          user:users (
            full_name,
            email
          )
        ),
        assigned_staff:staff_profiles (
          first_name,
          last_name,
          position
        )
      `)
      .single()

    if (error) {
      console.error("Erreur lors de la mise à jour de la demande:", error)
      return NextResponse.json(
        { error: "Échec de la mise à jour de la demande", details: error.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      request: request_data,
      message: "Demande de service mise à jour avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la demande:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprime une demande de service
 * @param request - La requête avec l'ID de la demande à supprimer
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
        { error: "ID de la demande requis" }, 
        { status: 400 }
      )
    }

    // Vérification du statut avant suppression
    const { data: existingRequest, error: fetchError } = await supabase
      .from("missions")
      .select("id, status")
      .eq("id", id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" }, 
        { status: 404 }
      )
    }

    // Ne pas permettre la suppression de demandes en cours ou terminées
    if (existingRequest.status === "in_progress" || existingRequest.status === "completed") {
      return NextResponse.json(
        { error: "Impossible de supprimer une demande en cours ou terminée" }, 
        { status: 400 }
      )
    }

    // Suppression de la demande
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erreur lors de la suppression de la demande:", error)
      return NextResponse.json(
        { error: "Échec de la suppression de la demande", details: error.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: "Demande de service supprimée avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de la suppression de la demande:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}