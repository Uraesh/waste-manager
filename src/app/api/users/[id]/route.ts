import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SupabaseClient } from "@supabase/supabase-js"

// Helper function to check for admin privileges
async function checkAdmin(supabase: SupabaseClient) {
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
        { message: "Cette porte ne s'ouvre qu'aux âmes autorisées…" },
        { status: 403 }
      ),
    }
  }

  return { session }
}

// PUT handler for updating a specific user
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = await context;
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)
  const userId = (await params).id

  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    const body = await request.json()

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 })
    }

    // Update user
    const { data: user, error: updateError } = await supabase
      .from("users")
      .update(body)
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ message: "Erreur lors de la mise à jour de l'utilisateur." }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in PUT /api/users/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

// DELETE handler for deleting a specific user
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = await context;
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)
  const userId = (await params).id

  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    // Delete user
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (deleteError) {
      return NextResponse.json({ message: "Erreur lors de la suppression de l'utilisateur." }, { status: 500 })
    }

    return NextResponse.json({ message: "Utilisateur supprimé avec succès." })
  } catch (error) {
    console.error("Error in DELETE /api/users/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}