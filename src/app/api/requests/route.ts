import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// GET handler to fetch missions based on user role
export async function GET() {
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", session.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ message: "Profil utilisateur introuvable." }, { status: 404 })
    }

    let query = supabase
      .from("missions")
      .select(`
        *,
        client:clients(company_name),
        staff:staff_profiles(first_name, last_name)
      `)

    // Role-based filtering
    if (userProfile.role === "client") {
      // Find the client profile associated with the user id
      const { data: clientProfile } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userProfile.id)
        .single()

      if (clientProfile) {
        query = query.eq("client_id", clientProfile.id)
      } else {
        return NextResponse.json([]) // No client profile found for this user, return empty
      }
    } else if (userProfile.role === "staff") {
      // Staff sees missions assigned to them OR unassigned missions
      query = query.or(`assigned_staff_id.eq.${userProfile.id},assigned_staff_id.is.null`)
    }
    // Admin sees all missions, so no additional filtering is needed.

    const { data: missions, error } = await query

    if (error) {
      console.error("Error fetching missions:", error)
      return NextResponse.json({ message: "Erreur lors de la récupération des missions." }, { status: 500 })
    }

    return NextResponse.json(missions)

  } catch (error) {
    console.error("An unexpected error occurred in GET /api/requests:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

// POST handler to create a new mission
export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", session.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ message: "Profil utilisateur introuvable." }, { status: 404 })
    }

    const body = await request.json()

    // Data validation
    const requiredFields = ["title", "location", "service_type", "description"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ message: `Le champ '${field}' est manquant.` }, { status: 400 })
      }
    }

    let clientId = body.client_id;

    // If the user is a client, ensure they are creating the request for themselves.
    if (userProfile.role === 'client') {
       const { data: clientProfile } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userProfile.id)
        .single()

        if (!clientProfile) {
            return NextResponse.json({ message: "Impossible de trouver le profil client associé à cet utilisateur." }, { status: 403 });
        }
        clientId = clientProfile.id;
    } else if (userProfile.role !== 'admin') {
        // Only admins and clients can create requests
        return NextResponse.json({ message: "Action non autorisée." }, { status: 403 });
    }

    const { data: mission, error } = await supabase.from("missions")
      .insert({
        title: body.title,
        description: body.description,
        client_id: clientId,
        location: body.location,
        service_type: body.service_type,
        priority: body.priority || 'medium',
        status: 'pending', // Always starts as pending
        special_instructions: body.special_instructions
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating mission:", error)
      return NextResponse.json({ message: "Erreur lors de la création de la mission." }, { status: 500 })
    }

    return NextResponse.json({ message: "Demande créée avec succès." }, { status: 201 })

  } catch (error) {
    console.error("An unexpected error occurred in POST /api/requests:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}