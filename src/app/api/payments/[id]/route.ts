import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SupabaseClient } from "@supabase/supabase-js"

// Helper function to check for admin privileges
async function checkAdmin(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: NextResponse.json({ message: "Non authentifié" }, { status: 401 }) }
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (userProfile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { message: "Accès non autorisé. Seuls les administrateurs peuvent effectuer cette action." },
        { status: 403 }
      ),
    }
  }
  return { session }
}

// PUT handler for updating a specific payment
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)
  const paymentId = params.id

  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    const body = await request.json()

    // Check if payment exists
    const { data: existingPayment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !existingPayment) {
      return NextResponse.json({ message: "Paiement introuvable." }, { status: 404 })
    }

    // Update payment
    const { data: payment, error: updateError } = await supabase
      .from("payments")
      .update(body)
      .eq("id", paymentId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ message: "Erreur lors de la mise à jour du paiement." }, { status: 500 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Error in PUT /api/payments/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

// DELETE handler for deleting a specific payment
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)
  const paymentId = params.id

  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    // Delete payment
    const { error: deleteError } = await supabase
      .from("payments")
      .delete()
      .eq("id", paymentId)

    if (deleteError) {
      return NextResponse.json({ message: "Erreur lors de la suppression du paiement." }, { status: 500 })
    }

    return NextResponse.json({ message: "Paiement supprimé avec succès." })
  } catch (error) {
    console.error("Error in DELETE /api/payments/[id]:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}