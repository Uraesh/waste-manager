import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SupabaseClient } from "@supabase/supabase-js"

// Helper function to check for admin privileges or self-access
async function checkAccess(supabase: SupabaseClient, staffId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { error: NextResponse.json({ message: "Non authentifié" }, { status: 401 }) }
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (!userProfile) {
    return { error: NextResponse.json({ message: "Profil utilisateur introuvable." }, { status: 404 }) }
  }

  const is_admin = userProfile.role === "admin"
  const is_self = session.user.id === staffId

  if (!is_admin && !is_self) {
    return {
      error: NextResponse.json(
        { message: "Accès non autorisé." },
        { status: 403 }
      ),
    }
  }

  return { session, is_admin }
}

// PUT handler for updating a specific staff member
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = await context;
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)
  const staffId = (await params).id

  try {
    const { error: accessError } = await checkAccess(supabase, staffId)
    if (accessError) return accessError

    const body = await request.json()

    // Check if staff exists
    const { data: existingStaff, error: staffError } = await supabase
      .from("staff_profiles")
      .select("*")
      .eq("id", staffId)
      .single()

    if (staffError || !existingStaff) {
      return NextResponse.json({ message: "Membre du personnel introuvable." }, { status: 404 })
    }

    // Update staff profile
    const { data: staff, error: updateError } = await supabase
      .from("staff_profiles")
      .update(body)
      .eq("id", staffId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ message: "Erreur lors de la mise à jour du profil." }, { status: 500 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("Error in PUT /api/staff/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

// DELETE handler for deleting a specific staff member
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = await context;
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)
  const staffId = (await params).id

  try {
    const { error: accessError, is_admin } = await checkAccess(supabase, staffId)
    if (accessError) return accessError

    // Only admins can delete staff profiles
    if (!is_admin) {
      return NextResponse.json({ message: "Seuls les administrateurs peuvent supprimer des profils." }, { status: 403 })
    }

    // Delete staff profile
    const { error: deleteError } = await supabase
      .from("staff_profiles")
      .delete()
      .eq("id", staffId)

    if (deleteError) {
      return NextResponse.json({ message: "Erreur lors de la suppression du profil." }, { status: 500 })
    }

    return NextResponse.json({ message: "Profil supprimé avec succès." })
  } catch (error) {
    console.error("Error in DELETE /api/staff/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}