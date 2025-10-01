import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Helper function to check for admin privileges or self-access
async function checkAccess(supabase: any, staffId: string) {
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

  // For delete, only admin is allowed
  if (request.method === 'DELETE' && !is_admin) {
      return { error: NextResponse.json({ message: "Seuls les administrateurs peuvent supprimer un membre du personnel." }, { status: 403 }) }
  }


  return { session, is_admin }
}

// PUT handler for updating a specific staff profile
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const staffId = params.id

  try {
    const { error: accessError } = await checkAccess(supabase, staffId)
    if (accessError) return accessError

    const { first_name, last_name, position, phone, address, status } = await request.json()

    // Update the staff_profiles table
    const { data, error } = await supabase
      .from("staff_profiles")
      .update({
        first_name,
        last_name,
        position,
        phone,
        address,
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", staffId)
      .select()
      .single()

    if (error) {
      console.error("Error updating staff profile:", error)
      return NextResponse.json({ message: "Erreur lors de la mise à jour du profil." }, { status: 500 })
    }

    // Also update the full_name in the corresponding auth.users metadata and public.users table
    const fullName = `${first_name || ''} ${last_name || ''}`.trim()
    await supabase.auth.admin.updateUserById(staffId, {
        user_metadata: { full_name: fullName }
    })
    await supabase.from("users").update({ full_name: fullName }).eq("id", staffId)


    return NextResponse.json(data)
  } catch (error) {
    console.error(`An unexpected error occurred in PUT /api/staff/${staffId}:`, error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

// DELETE handler for deleting a specific staff member
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const staffId = params.id

  try {
    const { error: accessError, is_admin } = await checkAccess(supabase, staffId)
    if (accessError) return accessError

    if (!is_admin) {
        return NextResponse.json({ message: "Action non autorisée. Seuls les administrateurs peuvent supprimer un membre du personnel." }, { status: 403 })
    }

    // The deletion from public.users and staff_profiles should cascade from auth.users.
    // If not, you must delete from them manually before deleting the auth user.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(staffId)

    if (deleteError) {
      console.error("Error deleting staff user:", deleteError)
      return NextResponse.json({ message: "Erreur lors de la suppression de l'utilisateur." }, { status: 500 })
    }

    return NextResponse.json({ message: "Membre du personnel supprimé avec succès." })
  } catch (error) {
    console.error(`An unexpected error occurred in DELETE /api/staff/${staffId}:`, error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}