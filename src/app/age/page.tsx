"use client";
import { useEffect, useState } from "react";

export default function AgeGatePage() {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // إذا لديه الكوكي مسبقاً، رجّعه للصفحة السابقة
    const has = document.cookie.split("; ").some((c) => c.startsWith("age_ok=1"));
    if (has) {
      const back = sessionStorage.getItem("age_back") || "/";
      window.location.replace(back);
    }
  }, []);

  const accept = () => {
    try {
      // خزّن الصفحة الحالية للرجوع لها بعد القبول
      if (!sessionStorage.getItem("age_back")) {
        sessionStorage.setItem("age_back", document.referrer || "/");
      }
      // ضع الكوكي لسنة
      document.cookie = "age_ok=1; path=/; max-age=31536000; samesite=lax";
      setAccepted(true);
      const back = sessionStorage.getItem("age_back") || "/";
      window.location.replace(back);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    }
  };

  const decline = () => {
    // وجّهه لصفحة آمنة عامة
    window.location.href = "https://www.google.com";
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="max-w-md w-full rounded-2xl p-8 border border-white/10 bg-white/5 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-3">Adults Only (18+)</h1>
        <p className="text-sm text-white/80 mb-6">
          هذا الموقع مخصّص للبالغين (+18). بالضغط على "أنا 18+" فأنت تقرّ بأن عمرك 18 سنة أو أكثر.
        </p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={accept}
            disabled={accepted}
            className="flex-1 rounded-xl py-3 px-4 bg-emerald-600 hover:bg-emerald-500 transition"
          >
            أنا 18+
          </button>
          <button
            onClick={decline}
            className="flex-1 rounded-xl py-3 px-4 bg-neutral-700 hover:bg-neutral-600 transition"
          >
            لست 18
          </button>
        </div>
        <p className="text-xs text-white/60 mt-4">
          بالضغط على "أنا 18+" ستُحفظ موافقتك لمدة 12 شهرًا (Cookie).
        </p>
      </div>
    </main>
  );
}
