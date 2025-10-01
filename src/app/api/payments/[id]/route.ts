import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Helper function to check for admin privileges
async function checkAdmin(supabase: any) {
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
  const supabase = createServerClient(cookieStore)
  const paymentId = params.id

  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    const { payment_status, ...updateData } = await request.json()

    if (payment_status === "completed" && !updateData.paid_at) {
      updateData.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("payments")
      .update({ payment_status, ...updateData, updated_at: new Date().toISOString() })
      .eq("id", paymentId)
      .select()
      .single()

    if (error) {
      console.error("Erreur lors de la mise à jour du paiement:", error)
      return NextResponse.json({ message: "Échec de la mise à jour du paiement", details: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Erreur inattendue dans PUT /api/payments/${paymentId}:`, error)
    return NextResponse.json({ message: "Erreur serveur interne" }, { status: 500 })
  }
}

// DELETE handler for deleting a specific payment
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const paymentId = params.id

  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    const { data: existingPayment, error: fetchError } = await supabase
      .from("payments")
      .select("payment_status")
      .eq("id", paymentId)
      .single()

    if (fetchError || !existingPayment) {
      return NextResponse.json({ message: "Paiement non trouvé" }, { status: 404 })
    }

    if (existingPayment.payment_status === "completed") {
      return NextResponse.json({ message: "Impossible de supprimer un paiement complété" }, { status: 400 })
    }

    const { error } = await supabase.from("payments").delete().eq("id", paymentId)

    if (error) {
      console.error("Erreur lors de la suppression du paiement:", error)
      return NextResponse.json({ message: "Échec de la suppression du paiement", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Paiement supprimé avec succès." })
  } catch (error) {
    console.error(`Erreur inattendue dans DELETE /api/payments/${paymentId}:`, error)
    return NextResponse.json({ message: "Erreur serveur interne" }, { status: 500 })
  }
}