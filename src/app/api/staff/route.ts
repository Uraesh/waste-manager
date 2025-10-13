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

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (userProfile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { message: "Accès non autorisé. Seuls les administrateurs peuvent gérer le personnel." },
        { status: 403 }
      ),
    }
  }
  return { session }
}

// GET handler to fetch all staff profiles
export async function GET() {
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)
  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    const { data, error } = await supabase
      .from("staff_profiles")
      .select("*")

    if (error) {
      console.error("Error fetching staff profiles:", error)
      return NextResponse.json({ message: "Erreur lors de la récupération du personnel." }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("An unexpected error occurred in GET /api/staff:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

// POST handler to create a new staff profile
export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)
  try {
    const { error: adminError } = await checkAdmin(supabase)
    if (adminError) return adminError

    const { email, password, first_name, last_name, position, phone, address } = await request.json()

    if (!email || !password || !first_name || !last_name || !position) {
        return NextResponse.json({ message: "Données manquantes pour la création du membre du personnel." }, { status: 400 })
    }

    // 1. Create the user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `${first_name} ${last_name}`, role: 'staff' }
    })

    if (authError) {
        console.error("Error creating staff auth user:", authError)
        return NextResponse.json({ message: authError.message }, { status: 400 })
    }
    const newUserId = authData.user.id

    // 2. Create the user record in public.users
    const { error: publicUserError } = await supabase
      .from("users")
      .insert({ id: newUserId, full_name: `${first_name} ${last_name}`, email, role: 'staff' })

    if (publicUserError) {
      console.error("Error inserting staff into public.users:", publicUserError)
      // Clean up orphaned auth user
      await supabase.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ message: "Erreur lors de la création de l'enregistrement utilisateur." }, { status: 500 })
    }

    // 3. Create the staff profile in public.staff_profiles
    const { data: profileData, error: profileError } = await supabase
      .from("staff_profiles")
      .insert({
        user_id: newUserId,
        first_name,
        last_name,
        position,
        phone,
        address,
        status: 'active'
      })
      .select()
      .single()

    if (profileError) {
        console.error("Error creating staff profile:", profileError)
        // Clean up orphaned users
        await supabase.auth.admin.deleteUser(newUserId)
        // The public.users record will be deleted by trigger/cascade
        return NextResponse.json({ message: "Erreur lors de la création du profil du personnel." }, { status: 500 })
    }

    return NextResponse.json(profileData, { status: 201 })

  } catch (error) {
    console.error("An unexpected error occurred in POST /api/staff:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}