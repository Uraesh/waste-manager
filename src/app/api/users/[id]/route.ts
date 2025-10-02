import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Helper function to check for admin privileges
async function checkAdmin(supabase: any) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: NextResponse.json({ message: "Non authentifié" }, { status: 401 }) }
  }

  const { data: currentUserProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (currentUserProfile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { message: "Cette porte ne s’ouvre qu’aux âmes autorisées…" },
        { status: 403 }
      ),
    }
  }

  return { session }
}

// PUT handler for updating a specific user
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const userId = params.id

  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    const { full_name, role } = await request.json()

    if (!full_name || !role) {
      return NextResponse.json({ message: "Données manquantes pour la mise à jour." }, { status: 400 })
    }

    // Update user in auth.users (metadata)
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { full_name, role },
    })

    if (updateError) {
      console.error("Error updating user in auth:", updateError)
      return NextResponse.json({ message: updateError.message }, { status: 400 })
    }

    // Update user in public.users table
    const { error: publicUpdateError } = await supabase
      .from("users")
      .update({ full_name, role })
      .eq("id", userId)

    if (publicUpdateError) {
      console.error("Error updating user in public table:", publicUpdateError)
      return NextResponse.json(
        { message: "Erreur lors de la mise à jour du profil utilisateur." },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("An unexpected error occurred in PUT /api/users/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

// DELETE handler for deleting a specific user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const userId = params.id

  try {
    const { error: adminError, session } = await checkAdmin(supabase)
    if (adminError) return adminError

    // Prevent an admin from deleting themselves
    if (session && session.user.id === userId) {
      return NextResponse.json({ message: "Un administrateur ne peut pas se supprimer lui-même." }, { status: 400 })
    }

    // Delete user from auth.users
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError)
      return NextResponse.json({ message: deleteError.message }, { status: 400 })
    }

    // Note: The user in public.users should be deleted automatically by a database trigger or cascade.
    // If not, you would need to add: await supabase.from("users").delete().eq("id", userId)

    return NextResponse.json({ message: "Utilisateur supprimé avec succès." })
  } catch (error) {
    console.error("An unexpected error occurred in DELETE /api/users/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}