import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Helper function to check user's role and get their profile
async function getUserAndProfile(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: NextResponse.json({ message: "Non authentifié" }, { status: 401 }) }
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", session.user.id)
    .single()

  if (!userProfile) {
    return { error: NextResponse.json({ message: "Profil utilisateur introuvable." }, { status: 404 }) }
  }

  return { userProfile }
}

// PUT handler for updating a specific mission
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const missionId = params.id

  try {
    const { userProfile, error: authError } = await getUserAndProfile(supabase)
    if (authError) return authError

    const body = await request.json()

    // Fetch the mission to check ownership/assignment
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("assigned_staff_id")
      .eq("id", missionId)
      .single()

    if (missionError || !mission) {
      return NextResponse.json({ message: "Mission introuvable." }, { status: 404 })
    }

    // Authorization: Allow update only if user is admin or the assigned staff member
    if (userProfile.role !== 'admin' && mission.assigned_staff_id !== userProfile.id) {
      return NextResponse.json({ message: "Action non autorisée." }, { status: 403 })
    }

    // Fields that can be updated
    const { title, description, location, priority, status, assigned_staff_id, special_instructions } = body

    const { error: updateError } = await supabase
      .from("missions")
      .update({
        title,
        description,
        location,
        priority,
        status,
        assigned_staff_id,
        special_instructions,
        updated_at: new Date().toISOString()
      })
      .eq("id", missionId)

    if (updateError) {
      console.error("Error updating mission:", updateError)
      return NextResponse.json({ message: "Erreur lors de la mise à jour de la mission." }, { status: 500 })
    }

    return NextResponse.json({ message: "Mission mise à jour avec succès." })

  } catch (error) {
    console.error("An unexpected error occurred in PUT /api/requests/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

// DELETE handler for deleting a specific mission
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const missionId = params.id

  try {
    const { userProfile, error: authError } = await getUserAndProfile(supabase)
    if (authError) return authError

    // Authorization: Only admins can delete missions
    if (userProfile.role !== 'admin') {
      return NextResponse.json({ message: "Action non autorisée. Seuls les administrateurs peuvent supprimer une mission." }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from("missions")
      .delete()
      .eq("id", missionId)

    if (deleteError) {
      console.error("Error deleting mission:", deleteError)
      return NextResponse.json({ message: "Erreur lors de la suppression de la mission." }, { status: 500 })
    }

    return NextResponse.json({ message: "Mission supprimée avec succès." })

  } catch (error) {
    console.error("An unexpected error occurred in DELETE /api/requests/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}