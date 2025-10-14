const { execSync } = 'child_process';

// Remplacez par votre URL de projet Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Remplacez par votre clé de service (à garder secrète)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Veuillez définir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre .env');
  process.exit(1);
}

try {
  // Générer les types depuis Supabase
  execSync(
    `npx supabase gen types typescript --project-id ${SUPABASE_URL.split('.')[0].replace('https://', '')} > src/types/database.types.ts`,
    { stdio: 'inherit' }
  );
  
  console.log('Types générés avec succès dans src/types/database.types.ts');
} catch (error) {
  console.error('Erreur lors de la génération des types:', error);
  process.exit(1);
}