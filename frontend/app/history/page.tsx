"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchHistory, HistoryRecord } from "@/lib/supabase";
import { HistoryCardSkeleton } from "@/components/Skeleton";

const SHAPE_EMOJI: Record<string, string> = {
  oval: "🥚", round: "🔵", square: "⬛",
  heart: "🫀", oblong: "📏", diamond: "💎", triangle: "🔺",
};

const SHAPE_LABEL: Record<string, string> = {
  oval: "Oval", round: "Bulat", square: "Persegi",
  heart: "Hati", oblong: "Lonjong", diamond: "Berlian", triangle: "Segitiga",
};

function confidenceColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 55) return "text-yellow-400";
  return "text-red-400";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then(setRecords)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex flex-col items-center min-h-screen px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm text-zinc-500 uppercase tracking-widest mb-1">Riwayat</p>
            <h1 className="text-3xl font-bold">History Rekomendasi</h1>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            ← Kembali
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => <HistoryCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && records.length === 0 && (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-4xl mb-4">📭</p>
            <p>Belum ada history. Upload foto wajah dulu!</p>
            <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline text-sm">
              Mulai sekarang →
            </Link>
          </div>
        )}

        {/* Records */}
        <div className="flex flex-col gap-4">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                {/* Face shape */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{SHAPE_EMOJI[rec.face_shape] ?? "✨"}</span>
                  <div>
                    <p className="font-semibold text-zinc-100">{rec.name}</p>
                    <p className="text-sm text-zinc-400">
                      {SHAPE_LABEL[rec.face_shape] ?? rec.face_shape}
                    </p>
                    <p className="text-xs text-zinc-500">{formatDate(rec.created_at)}</p>
                  </div>
                </div>
                {/* Confidence */}
                <span className={`text-lg font-bold ${confidenceColor(rec.confidence)}`}>
                  {rec.confidence}%
                </span>
              </div>

              {/* Hairstyles */}
              <div className="flex flex-wrap gap-2">
                {rec.hairstyles.map((h, i) => (
                  <span
                    key={i}
                    className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full px-3 py-1"
                  >
                    #{i + 1} {h.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
