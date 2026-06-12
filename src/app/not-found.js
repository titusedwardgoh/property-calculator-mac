"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center relative px-4 text-center py-20 bg-cover bg-center bg-no-repeat min-h-[calc(100vh-12rem)] bg-[#FCF8F6] selection:bg-[#E29578]/20"
      style={{
        backgroundImage: `linear-gradient(rgba(252, 248, 246, 0.88), rgba(252, 248, 246, 0.88)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop')`,
      }}
    >
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        <div className="inline-flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E29578]/10 flex items-center justify-center text-[#D47A5B]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-xl md:text-2xl font-bold uppercase tracking-widest text-[#D47A5B]">
            Error 404
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-2xl mx-auto">
          This Page is Still Off-the-Plan
        </h1>

        <div className="max-w-xl mx-auto">
          <p className="text-gray-600 text-base md:text-lg leading-relaxed font-medium">
            Construction hasn&apos;t started on this URL yet, we are waiting for council approval
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center border border-[#D47A5B] bg-white text-[#D47A5B] hover:bg-[#FCF8F6] font-medium text-base rounded-full px-8 py-3.5 transition-all duration-200 active:scale-[0.98]"
          >
            Back to Home
          </Link>
          <Link
            href="/calculator?fresh=true"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[#D47A5B] hover:bg-[#C3694A] text-white font-medium text-base rounded-full px-8 py-3.5 transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            Start New Survey
          </Link>
        </div>
      </div>
    </main>
  );
}
