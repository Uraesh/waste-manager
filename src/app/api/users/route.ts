import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)

  try {
    // 1. Get the current user's session to identify who is making the request.
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // This case handles users who are not logged in at all.
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }

    // 2. Fetch the profile of the logged-in user to check their role.
    const { data: currentUserProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single() // We expect only one profile for the user.

    if (profileError || !currentUserProfile) {
      // This handles cases where the user is authenticated but their profile is missing in the 'users' table.
      return NextResponse.json({ message: "Profil utilisateur introuvable." }, { status: 500 })
    }

    // 3. Security Check: Verify if the user has the 'admin' role.
    if (currentUserProfile.role !== "admin") {
      // If not an admin, return the custom 403 Forbidden error message.
      return NextResponse.json(
        { message: "Cette porte ne s’ouvre qu’aux âmes autorisées…" },
        { status: 403 }
      )
    }

    // 4. If the user is an admin, proceed to fetch the list of all users.
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, role, created_at") // Select the columns needed by the frontend.

    if (usersError) {
      // This handles potential errors during the fetching of the user list.
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ message: "Erreur lors de la récupération des utilisateurs." }, { status: 500 })
    }

    // 5. Success: Return the list of users with a 200 OK status.
    return NextResponse.json(users)
  } catch (error) {
    // Generic error handler for any other unexpected issues.
    console.error("An unexpected error occurred in /api/users:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(await cookieStore)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }

    const { data: currentUserProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (currentUserProfile?.role !== "admin") {
      return NextResponse.json(
        { message: "Cette porte ne s’ouvre qu’aux âmes autorisées…" },
        { status: 403 }
      )
    }

    // Admin is verified, proceed to create the user
    const { email, password, full_name, role } = await request.json()

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ message: "Données manquantes pour la création de l'utilisateur." }, { status: 400 })
    }

    // Use the admin client to create a new user in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the user's email
      user_metadata: { full_name, role }, // Add non-sensitive metadata
    })

    if (createError) {
      console.error("Error creating user:", createError)
      return NextResponse.json({ message: createError.message }, { status: 400 })
    }

    // Also add the user to the public.users table
    const { error: insertError } = await supabase
      .from("users")
      .insert({ id: newUser.user.id, full_name, email, role })

    if (insertError) {
        console.error("Error inserting user into public table:", insertError)
        // If this fails, we should ideally delete the auth user to avoid orphaned users
        await supabase.auth.admin.deleteUser(newUser.user.id)
        return NextResponse.json({ message: "Erreur lors de la finalisation de la création de l'utilisateur." }, { status: 500 })
    }


    return NextResponse.json(newUser)
  } catch (error) {
    console.error("An unexpected error occurred in POST /api/users:", error)
    return NextResponse.json({ message: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}