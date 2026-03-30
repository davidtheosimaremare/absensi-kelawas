import LoginForm from "@/components/login-form";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="w-full max-w-md z-10">
        <div className="glass p-8 md:p-10 rounded-3xl shadow-2xl border border-border">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 border border-accent/20 animate-float">
              <ShieldCheck className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Smart-Check</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Mengamankan absensi dengan presisi
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 pt-6 border-t border-border flex justify-between items-center text-xs text-gray-500">
            <span>Made by Modibi</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Sistem Aman
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
