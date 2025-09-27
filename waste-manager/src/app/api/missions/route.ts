/**
 * @fileoverview API Routes pour la gestion des missions (requests)
 * Ce fichier gère les opérations CRUD pour les missions dans l'application
 * Basé sur la table "missions" du schéma Supabase
 */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Interface pour typer les données d'une mission/request
 */
interface MissionRequestData {
  title: string
  description?: string
  client_id: string
  assigned_staff_id?: string
  location: string
  scheduled_date?: string
  scheduled_time?: string
  estimated_duration?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  service_type: 'ramassage' | 'recyclage' | 'dechets_speciaux' | 'urgence'
  zone?: string
  equipment_needed?: string[]
  gps_location?: string
  special_instructions?: string
}

/**
 * Fonction utilitaire pour valider les données de mission
 */
function validateMissionData(data: MissionRequestData): { isValid: boolean; errors: string[] } {
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
 * GET - Récupère toutes les missions/requests
 * @param request - La requête Next.js entrante
 * @returns Les missions avec les informations du client et du personnel assigné
 * @throws 401 si l'utilisateur n'est pas authentifié
 * @throws 500 en cas d'erreur serveur
 */
export async function GET(request: NextRequest) {
  try {
    // Initialisation du client Supabase avec les cookies (version fusionnée : synchrone)
    const cookieStore = await cookies(); // ✅ Correction synchrone
    const supabase = createClient(cookieStore);

    // Vérification de l'authentification utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Erreur d'authentification:", authError);
      return NextResponse.json(
        { error: "Erreur d'authentification", details: authError.message }, 
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" }, 
        { status: 401 }
      );
    }

    // Extraction des paramètres de requête pour le filtrage
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const assignedStaffId = searchParams.get("assigned_staff_id");
    const status = searchParams.get("status");
    const serviceType = searchParams.get("service_type");
    const priority = searchParams.get("priority");
    const zone = searchParams.get("zone");
    const limit = searchParams.get("limit");
    const staffId = searchParams.get("staff_id"); // Intégré de l'autre branche

    // Construction de la requête avec jointures (version détaillée)
    let query = supabase.from("missions").select(`
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
        contract_type,
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
        phone,
        position,
        department,
        skills,
        availability,
        status
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
      service_request:servicerequest (
        service_type,
        description,
        location,
        client:clients (
          company_name,
          contact_person
        )
      ),
      staff:staff (
        user:users (
          full_name
        )
      )
    `);

    // Application des filtres (fusionnés)
    if (clientId) query = query.eq("client_id", clientId);
    if (assignedStaffId) query = query.eq("assigned_staff_id", assignedStaffId);
    if (status) query = query.eq("status", status);
    if (serviceType) query = query.eq("service_type", serviceType);
    if (priority) query = query.eq("priority", priority);
    if (zone) query = query.eq("zone", zone);
    if (staffId) query = query.eq("staff_id", staffId); // Intégré

    // Limite de résultats
    if (limit && !isNaN(Number(limit))) {
      query = query.limit(Number(limit));
    }

    // Tri par date de création (plus récent en premier)
    query = query.order("created_at", { ascending: false });

    const { data: missions, error } = await query;

    if (error) {
      console.error("Erreur lors de la récupération des missions:", error);
      return NextResponse.json(
        { error: "Échec de la récupération des missions", details: error.message }, 
        { status: 500 }
      );
    }

    // Calcul de statistiques (de la version détaillée)
    const statusCounts = missions?.reduce((acc: { [x: string]: number; }, mission: { status: string | number; }) => {
      acc[mission.status] = (acc[mission.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({ 
      requests: missions, // Alias pour compatibilité
      missions,
      count: missions?.length || 0,
      statistics: {
        status_counts: statusCounts,
        total: missions?.length || 0
      },
      filters: { clientId, assignedStaffId, status, serviceType, priority, zone, limit }
    });

  } catch (error) {
    console.error("Erreur inattendue dans l'API requests:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    );
  }
}

/**
 * POST - Crée une nouvelle mission/request
 * @param request - La requête Next.js entrante contenant les données de la mission
 * @returns La nouvelle mission créée
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
    const validation = validateMissionData(body)

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
      assigned_staff_id,
      location,
      scheduled_date,
      scheduled_time,
      estimated_duration,
      priority = "medium",
      service_type,
      zone,
      equipment_needed,
      gps_location,
      special_instructions
    } = body as MissionRequestData

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

    // Vérification du personnel assigné si spécifié
    if (assigned_staff_id) {
      const { data: staff, error: staffError } = await supabase
        .from("staff_profiles")
        .select("id, status")
        .eq("id", assigned_staff_id)
        .single()

      if (staffError || !staff) {
        return NextResponse.json(
          { error: "Membre du personnel non trouvé" }, 
          { status: 404 }
        )
      }

      if (staff.status !== "active") {
        return NextResponse.json(
          { error: "Le membre du personnel n'est pas actif" }, 
          { status: 400 }
        )
      }
    }

    // Création de la mission
    const { data: mission, error: createError } = await supabase
      .from("missions")
      .insert({
        title,
        description,
        client_id,
        assigned_staff_id,
        location,
        scheduled_date,
        scheduled_time,
        estimated_duration,
        priority,
        service_type,
        zone,
        equipment_needed,
        gps_location,
        special_instructions,
        status: assigned_staff_id ? "assigned" : "pending",
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
        ),
        assigned_staff:staff_profiles (
          first_name,
          last_name,
          position
        )
      `)
      .single()

    if (createError) {
      console.error("Erreur lors de la création de la mission:", createError)
      return NextResponse.json(
        { error: "Échec de la création de la mission", details: createError.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      request: mission, // Alias pour compatibilité
      mission,
      message: "Mission créée avec succès"
    }, { status: 201 })

  } catch (error) {
    console.error("Erreur lors de la création de la mission:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * PUT - Met à jour une mission existante
 * @param request - La requête avec l'ID de la mission et les nouvelles données
 * @returns La mission mise à jour
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
        { error: "ID de la mission requis" }, 
        { status: 400 }
      )
    }

    // Mise à jour de la mission
    const { data: mission, error } = await supabase
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
      console.error("Erreur lors de la mise à jour de la mission:", error)
      return NextResponse.json(
        { error: "Échec de la mise à jour de la mission", details: error.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      request: mission, // Alias pour compatibilité
      mission,
      message: "Mission mise à jour avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la mission:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprime une mission
 * @param request - La requête avec l'ID de la mission à supprimer
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
        { error: "ID de la mission requis" }, 
        { status: 400 }
      )
    }

    // Vérification du statut avant suppression
    const { data: existingMission, error: fetchError } = await supabase
      .from("missions")
      .select("id, status")
      .eq("id", id)
      .single()

    if (fetchError || !existingMission) {
      return NextResponse.json(
        { error: "Mission non trouvée" }, 
        { status: 404 }
      )
    }

    // Ne pas permettre la suppression de missions en cours ou terminées
    if (existingMission.status === "in_progress" || existingMission.status === "completed") {
      return NextResponse.json(
        { error: "Impossible de supprimer une mission en cours ou terminée" }, 
        { status: 400 }
      )
    }

    // Suppression de la mission
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erreur lors de la suppression de la mission:", error)
      return NextResponse.json(
        { error: "Échec de la suppression de la mission", details: error.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: "Mission supprimée avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de la suppression de la mission:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}
