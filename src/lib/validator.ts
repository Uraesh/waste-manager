import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";

// Définition du type pour le gestionnaire de route (handler) étendu.
// Il reçoit la requête, le client Supabase, et optionnellement les données validées.
type ExtendedHandler<T> = (
  req: NextRequest,
  supabase: SupabaseClient,
  validatedData?: T
) => Promise<NextResponse>;

// Définition des options pour le wrapper `withValidation`.
interface ValidationOptions<T extends z.ZodType<unknown, unknown>> {
  schema?: T;
  adminRequired?: boolean;
}

/**
 * Fonction d'ordre supérieur (HOF) pour envelopper les gestionnaires de routes API.
 *
 * Cette fonction gère :
 * 1. La création du client Supabase.
 * 2. La vérification de l'authentification et des droits d'administrateur.
 * 3. La validation du corps de la requête avec un schéma Zod.
 *
 * L'erreur `typeof handler` que vous avez pu rencontrer provient souvent d'une
 * mauvaise correspondance entre les types attendus par le HOF et ceux fournis
 * par le gestionnaire de route. En utilisant des génériques (`<T>`) et des
 * types clairs comme `ExtendedHandler`, on s'assure que TypeScript comprend
 * la "forme" (signature) que notre gestionnaire de route doit avoir.
 *
 * @param handler Le gestionnaire de route à exécuter après les validations.
 * @param options Les options de validation (schéma Zod, admin requis).
 * @returns Une nouvelle fonction de gestion de route qui gère la validation.
 */
export function withValidation<T extends z.ZodType<unknown, unknown>>(
  handler: ExtendedHandler<z.infer<T>>,
  options: ValidationOptions<T>
) {
  return async function (req: NextRequest) {
    const cookieStore = cookies();
    const supabase = createClient(await cookieStore);

    // 1. Vérification de l'authentification et des droits d'administrateur
    if (options.adminRequired) {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return NextResponse.json(
          { message: "Non authentifié" },
          { status: 401 }
        );
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileError || userProfile?.role !== "admin") {
        return NextResponse.json(
          { message: "Accès non autorisé. Action réservée aux administrateurs." },
          { status: 403 }
        );
      }
    }

    // 2. Validation du corps de la requête avec Zod
    let validatedData: z.infer<T> | undefined = undefined;
    if (options.schema) {
      try {
        const body = await req.json();
        validatedData = options.schema.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { message: "Données invalides", errors: error.issues },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { message: "Le corps de la requête est mal formé ou manquant." },
          { status: 400 }
        );
      }
    }

    // 3. Exécution du gestionnaire de route avec les données injectées
    return handler(req, supabase, validatedData);
  };
}