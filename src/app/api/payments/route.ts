import { createServerClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"

// Helper function to get user and profile
async function getUserAndProfile(supabase: any) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return { error: NextResponse.json({ message: "Non authentifié" }, { status: 401 }) }
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", session.user.id)
    .single()

  if (profileError || !userProfile) {
    return { error: NextResponse.json({ message: "Profil utilisateur introuvable." }, { status: 404 }) }
  }

  return { userProfile }
}

// GET - Fetches payments with role-based access control
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { userProfile, error: authError } = await getUserAndProfile(supabase)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    let query = supabase.from("payments").select(`
        id, amount, currency, payment_method, payment_status, due_date, created_at,
        mission:missions(title),
        client:clients(company_name)
      `)

    // Role-based filtering
    if (userProfile.role === "client") {
      const { data: clientProfile } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userProfile.id)
        .single()

      if (clientProfile) {
        query = query.eq("client_id", clientProfile.id)
      } else {
        return NextResponse.json({ payments: [], count: 0 }, { status: 200 })
      }
    } else if (userProfile.role !== "admin") {
      // Staff or other roles should not see any payments unless specified otherwise
      return NextResponse.json({ payments: [], count: 0 }, { status: 200 })
    }

    // Admin can apply additional filters
    if(userProfile.role === "admin") {
        if (searchParams.get("payment_status")) {
            query = query.eq("payment_status", searchParams.get("payment_status"))
        }
        if (searchParams.get("client_id")) {
            query = query.eq("client_id", searchParams.get("client_id"))
        }
    }

    const { data: payments, error: queryError } = await query.order("created_at", { ascending: false })

    if (queryError) {
      console.error("Error fetching payments:", queryError)
      return NextResponse.json({ message: "Échec de la récupération des paiements" }, { status: 500 })
    }

    return NextResponse.json({ payments, count: payments.length })
  } catch (error) {
    console.error("Erreur inattendue dans l'API payments:", error)
    return NextResponse.json({ message: "Erreur serveur interne" }, { status: 500 })
  }
}

// POST - Creates a new payment
export async function POST(request: NextRequest) {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    try {
        const { userProfile, error: authError } = await getUserAndProfile(supabase);
        if (authError) return authError;

        // Only admins can create payments through this generic endpoint
        if (userProfile.role !== 'admin') {
            return NextResponse.json({ message: "Action non autorisée." }, { status: 403 });
        }

        const body = await request.json();
        const { mission_id, amount, payment_method, description } = body;

        if (!mission_id || !amount || !payment_method) {
            return NextResponse.json({ message: "Données manquantes (mission_id, amount, payment_method)." }, { status: 400 });
        }

        const { data: mission } = await supabase.from("missions").select("client_id").eq("id", mission_id).single();
        if (!mission) {
            return NextResponse.json({ message: "Mission non trouvée." }, { status: 404 });
        }

        const { data: payment, error: createError } = await supabase.from("payments").insert({
            client_id: mission.client_id,
            mission_id,
            amount,
            payment_method,
            description,
            payment_status: 'pending',
        }).select().single();

        if (createError) {
            console.error("Error creating payment:", createError);
            return NextResponse.json({ message: "Échec de la création du paiement." }, { status: 500 });
        }

        return NextResponse.json(payment, { status: 201 });

    } catch (error) {
        console.error("Erreur lors de la création du paiement:", error);
        return NextResponse.json({ message: "Erreur serveur interne." }, { status: 500 });
    }
}