import SignUpForm from '@/components/auth/SignUpForm';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-rose-950 to-orange-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

      <Card className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">🗑️</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
              WasteManager
            </h1>
          </div>
          <p className="text-white/80">Créez votre compte</p>
        </div>

        <SignUpForm />

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Vous avez déjà un compte?{' '}
            <Link href="/" className="text-red-400 hover:underline">
              Connectez-vous
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
