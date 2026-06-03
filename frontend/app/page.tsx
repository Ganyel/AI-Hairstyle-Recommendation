"use client";

import { useState } from "react";
import Link from "next/link";
import UploadSection from "@/components/UploadSection";
import ResultCard from "@/components/ResultCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { predictHairstyle, PredictResult } from "@/lib/api";
import { saveHistory } from "@/lib/supabase";

export default function Home() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<PredictResult | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    if (!name.trim()) {
      setError("Masukkan nama pelanggan terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setPhotoUrl(URL.createObjectURL(file));
    try {
      const data = await predictHairstyle(file);
      setResult(data);
      saveHistory(name.trim(), data.face_shape, data.confidence, data.recommendations.hairstyles);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-grid">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-40 border-b border-zinc-800/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💈</span>
            <span className="font-bold text-sm tracking-tight">AI Hairstyle</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/history" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              History
            </Link>
            <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              Admin
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 pt-28 pb-20">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/50 rounded-full px-4 py-1.5 text-xs text-emerald-400 mb-6 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Powered by AI · MediaPipe + TensorFlow
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-none mb-5">
            Temukan Gaya Rambut<br />
            <span className="gradient-text">Terbaik untuk Anda</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed">
            AI kami menganalisis bentuk wajah dari foto Anda dan merekomendasikan model rambut yang paling cocok.
          </p>
        </div>

        {/* Form */}
        {!result && (
          <div className="max-w-sm mx-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {/* Step 1 */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 text-xs font-bold flex items-center justify-center shrink-0">1</div>
                <p className="text-sm font-medium text-zinc-300">Nama Pelanggan</p>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="Contoh: Budi Santoso"
                maxLength={60}
                className="w-full bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
            </div>

            {/* Step 2 */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 text-xs font-bold flex items-center justify-center shrink-0">2</div>
                <p className="text-sm font-medium text-zinc-300">Upload Foto Wajah</p>
              </div>
              <UploadSection onUpload={handleUpload} loading={loading} />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl px-4 py-3 text-sm mt-3">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">Hasil Analisis</h2>
              <button
                onClick={() => { setResult(null); setPhotoUrl(null); setName(""); }}
                className="text-sm text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded-lg px-4 py-1.5 transition-all"
              >
                ← Analisis Ulang
              </button>
            </div>
            <ResultCard result={result} customerName={name.trim()} photoUrl={photoUrl ?? undefined} />
          </div>
        )}
      </main>
    </div>
  );
}
