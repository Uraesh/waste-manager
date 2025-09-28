/**
 * @fileoverview API Routes pour la gestion du personnel
 * Ce fichier gère les opérations CRUD pour les profils du personnel
 * Basé sur la table "staff_profiles" du schéma Supabase
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * Interface pour typer les données du personnel
 */
interface StaffProfileData {
  id?: string // UUID de auth.users
  first_name: string
  last_name: string
  phone?: string
  address?: string
  hire_date?: string
  position: string
  department?: string
  hourly_rate?: number
  skills?: string[]
  certifications?: string[]
  availability?: {
    monday?: boolean
    tuesday?: boolean
    wednesday?: boolean
    thursday?: boolean
    friday?: boolean
    saturday?: boolean
    sunday?: boolean
  }
  status?: 'active' | 'inactive' | 'on_leave'
  emergency_contact?: {
    name?: string
    phone?: string
    relation?: string
  }
}

// --- NOUVEAU TYPE POUR LES RÉSULTATS DE LA REQUÊTE GET ---
interface StaffQueryResult {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  hire_date: string | null;
  position: string;
  department: string | null;
  hourly_rate: number | null;
  skills: string[] | null;
  certifications: string[] | null;
  availability: {
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
    sunday?: boolean;
  } | null;
  status: 'active' | 'inactive' | 'on_leave' | null;
  emergency_contact: {
    name?: string;
    phone?: string;
    relation?: string;
  } | null;
  created_at: string;
  updated_at: string;
  missions_assigned: Array<{
    id: string;
    title: string;
    status: string;
    scheduled_date: string;
    service_type: string;
  }> | null;
  mission_updates: Array<{
    id: string;
    update_type: string;
    content: string;
    timestamp: string;
  }> | null;
  ratings_received: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    mission: { title: string };
    client: { company_name: string };
  }> | null;
}
// --- FIN DU NOUVEAU TYPE ---

/**
 * Fonction utilitaire pour valider les données du personnel
 * @param data Les données à valider
 * @param isPartial Indique si la validation est partielle (pour les mises à jour)
 */
function validateStaffData(data: Partial<StaffProfileData>, isPartial: boolean = false): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isPartial) {
    if (!data.first_name || data.first_name.trim() === '') {
      errors.push("first_name est requis")
    }
    if (!data.last_name || data.last_name.trim() === '') {
      errors.push("last_name est requis")
    }
    if (!data.position || data.position.trim() === '') {
      errors.push("position est requis")
    }
  } else {
    if (data.first_name !== undefined && (typeof data.first_name !== 'string' || data.first_name.trim() === '')) {
      errors.push("first_name doit être une chaîne non vide si fourni")
    }
    if (data.last_name !== undefined && (typeof data.last_name !== 'string' || data.last_name.trim() === '')) {
      errors.push("last_name doit être une chaîne non vide si fourni")
    }
    if (data.position !== undefined && (typeof data.position !== 'string' || data.position.trim() === '')) {
      errors.push("position doit être une chaîne non vide si fourni")
    }
  }
  
  const validStatuses = ['active', 'inactive', 'on_leave']
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push("status doit être: " + validStatuses.join(', '))
  }

  if (data.hourly_rate !== undefined && (isNaN(data.hourly_rate) || data.hourly_rate < 0)) {
    errors.push("hourly_rate doit être un nombre positif")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * GET - Récupère tous les membres du personnel
 * @param request - La requête Next.js entrante
 * @returns Liste du personnel avec leurs profils détaillés
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
    const department = searchParams.get("department")
    const position = searchParams.get("position")
    const status = searchParams.get("status")
    const skills = searchParams.get("skills")
    const limit = searchParams.get("limit")

    // Construction de la requête avec jointures
    let query = supabase.from("staff_profiles").select(`
        id,
        first_name,
        last_name,
        phone,
        address,
        hire_date,
        position,
        department,
        hourly_rate,
        skills,
        certifications,
        availability,
        status,
        emergency_contact,
        created_at,
        updated_at,
        missions_assigned:missions!assigned_staff_id (
          id,
          title,
          status,
          scheduled_date,
          service_type
        ),
        mission_updates (
          id,
          update_type,
          content,
          timestamp
        ),
        ratings_received:ratings!staff_id (
          id,
          rating,
          comment,
          created_at,
          mission:missions (
            title
          ),
          client:clients (
            company_name
          )
        )
      `)

    // Application des filtres
    if (department) {
      query = query.eq("department", department)
    }
    if (position) {
      query = query.eq("position", position)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (skills) {
      // Recherche dans les compétences (array contains)
      query = query.contains("skills", [skills])
    }

    // Limite de résultats
    if (limit && !isNaN(Number(limit))) {
      query = query.limit(Number(limit))
    }

    // Tri par date d'embauche (plus récent en premier)
    query = query.order("hire_date", { ascending: false })

    const { data: staff, error } = await query

    if (error) {
      console.error("Erreur lors de la récupération du personnel:", error)
      return NextResponse.json(
        { error: "Échec de la récupération du personnel", details: error.message }, 
        { status: 500 }
      )
    }

    // Calcul de statistiques
    const statusCounts = staff?.reduce((acc: Record<string, number>, member: { status: string | number; }) => {
      acc[member.status] = (acc[member.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const departmentCounts = staff?.reduce((acc: Record<string, number>, member: { department: string | number; }) => {
      if (member.department) {
        acc[member.department] = (acc[member.department] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // Calcul de la note moyenne pour chaque membre du personnel     
    const staffWithRatings = staff?.map((member: StaffQueryResult) => {
      const ratings = member.ratings_received || []
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum: number, rating: { rating: number }) => sum + rating.rating, 0) / ratings.length
        : null

      return {
        ...member,
        average_rating: avgRating ? Number(avgRating.toFixed(2)) : null,
        total_ratings: ratings.length,
        active_missions: member.missions_assigned?.filter((m: { status: string }) =>
          ['assigned', 'in_progress'].includes(m.status)
        ).length || 0
      }
    })

    return NextResponse.json({
      staff: staffWithRatings,
      count: staff?.length || 0,
      statistics: {
        status_counts: statusCounts,
        department_counts: departmentCounts,
        total: staff?.length || 0
      },
      filters: { department, position, status, skills, limit }
    }, { status: 200 }) // <-- Ajout de la virgule et du statut HTTP

  }
  catch (error) {

    console.error("Erreur inattendue dans l'API staff:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    )
  }
}

/**
 * POST - Crée un nouveau profil de personnel
 * @param request - La requête Next.js entrante avec les informations du membre du personnel
 * @returns Le profil du personnel créé
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
    const validation = validateStaffData(body)

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.errors }, 
        { status: 400 }
      )
    }

    const { 
      id, // UUID de auth.users
      first_name,
      last_name,
      phone,
      address,
      hire_date = new Date().toISOString().split('T')[0], // Date par défaut: aujourd'hui
      position,
      department,
      hourly_rate,
      skills = [],
      certifications = [],
      availability = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      },
      status = "active",
      emergency_contact
    } = body as StaffProfileData

    if (!id) {
      return NextResponse.json(
        { error: "ID utilisateur (auth.users) requis" }, 
        { status: 400 }
      )
    }

    // Vérification que l'utilisateur existe dans auth.users
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(id)
    
    if (userError || !existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans le système d'authentification" }, 
        { status: 404 }
      )
    }

    // Vérification qu'un profil n'existe pas déjà pour cet utilisateur
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("id", id)
      .single()

    if (profileCheckError || existingProfile) {
      return NextResponse.json(
        { error: "Un profil personnel existe déjà pour cet utilisateur" }, 
        { status: 409 }
      )
    }

    // Création du profil personnel
    const { data: staffProfile, error: createError } = await supabase
      .from("staff_profiles")
      .insert({
        id,
        first_name,
        last_name,
        phone,
        address,
        hire_date,
        position,
        department,
        hourly_rate,
        skills,
        certifications,
        availability,
        status,
        emergency_contact,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        missions_assigned:missions!assigned_staff_id (
          id,
          title,
          status
        )
      `)
      .single()

    if (createError) {
      console.error("Erreur lors de la création du profil personnel:", createError)
      return NextResponse.json(
        { error: "Échec de la création du profil personnel", details: createError.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      staff: staffProfile,
      message: "Profil personnel créé avec succès"
    }, { status: 201 })

  } catch (error) {
    console.error("Erreur lors de la création du profil personnel:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Met à jour un profil de personnel existant
 * @param request - La requête avec l'ID du personnel et les nouvelles données
 * @returns Le profil personnel mis à jour
 * @throws 400 si les données sont invalides ou ID manquant
 * @throws 401 si l'utilisateur n'est pas authentifié
 * @throws 404 si le profil n'existe pas
 * @throws 500 en cas d'erreur lors de la mise à jour
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

    // Récupération et validation du corps de la requête
    const body = await request.json()
    const { id, ...updateData } = body as StaffProfileData

    if (!id) {
      return NextResponse.json(
        { error: "ID du profil requis" }, 
        { status: 400 }
      )
    }

    const validation = validateStaffData(updateData, true) // Validation partielle

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.errors }, 
        { status: 400 }
      )
    }

    // Vérification que le profil existe
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("id", id)
      .single()

    if (profileCheckError || !existingProfile) {
      return NextResponse.json(
        { error: "Profil personnel non trouvé" }, 
        { status: 404 }
      )
    }

    // Mise à jour du profil
    const { data: updatedProfile, error: updateError } = await supabase
      .from("staff_profiles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        missions_assigned:missions!assigned_staff_id (
          id,
          title,
          status
        )
      `)
      .single()

    if (updateError) {
      console.error("Erreur lors de la mise à jour du profil personnel:", updateError)
      return NextResponse.json(
        { error: "Échec de la mise à jour du profil personnel", details: updateError.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      staff: updatedProfile,
      message: "Profil personnel mis à jour avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil personnel:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprime un profil de personnel existant
 * @param request - La requête avec l'ID du personnel dans les paramètres de requête (query params)
 * @returns Message de confirmation
 * @throws 400 si l'ID est manquant
 * @throws 401 si l'utilisateur n'est pas authentifié
 * @throws 404 si le profil n'existe pas
 * @throws 500 en cas d'erreur lors de la suppression (ex: dépendances dans d'autres tables)
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

    // Extraction de l'ID depuis les paramètres de requête
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID du profil requis" }, 
        { status: 400 }
      )
    }

    // Vérification que le profil existe
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("id", id)
      .single()

    if (profileCheckError || !existingProfile) {
      return NextResponse.json(
        { error: "Profil personnel non trouvé" }, 
        { status: 404 }
      )
    }

    // Suppression du profil (attention: peut échouer si des références existent dans missions, ratings, etc.)
    const { error: deleteError } = await supabase
      .from("staff_profiles")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Erreur lors de la suppression du profil personnel:", deleteError)
      return NextResponse.json(
        { error: "Échec de la suppression du profil personnel", details: deleteError.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: "Profil personnel supprimé avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de la suppression du profil personnel:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne", details: error instanceof Error ? error.message : "Erreur inconnue" }, 
      { status: 500 }
    )
  }
}

