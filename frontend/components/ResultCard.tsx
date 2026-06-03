"use client";

import { useState } from "react";
import Image from "next/image";
import { PredictResult } from "@/lib/api";

interface Props {
  result: PredictResult;
  customerName?: string;
  photoUrl?: string;
}

const SHAPE_EMOJI: Record<string, string> = {
  oval: "🥚", round: "🔵", square: "⬛",
  heart: "🫀", oblong: "📏", diamond: "💎", triangle: "🔺",
};

function HairstyleImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  return (
    <div className="relative w-full h-52 bg-zinc-800 overflow-hidden">
      <Image
        src={error ? "/hairstyles/placeholder.svg" : `/hairstyles/${src}`}
        alt={alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setError(true)} sizes="(max-width: 640px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />
    </div>
  );
}

function confidenceColor(score: number) {
  if (score >= 80) return { bar: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-950/50 border-emerald-800/50" };
  if (score >= 55) return { bar: "bg-yellow-400", text: "text-yellow-400", bg: "bg-yellow-950/50 border-yellow-800/50" };
  return { bar: "bg-red-400", text: "text-red-400", bg: "bg-red-950/50 border-red-800/50" };
}

const RANK_WEIGHTS = [1.0, 0.88, 0.76, 0.65];
function matchScore(confidence: number, rank: number) {
  return Math.min(99, Math.round(confidence * (RANK_WEIGHTS[rank] ?? 0.60)));
}

// Modal Before/After
function BeforeAfterModal({ beforeUrl, afterSrc, hairstyleName, onClose }: {
  beforeUrl: string; afterSrc: string; hairstyleName: string; onClose: () => void;
}) {
  const [afterError, setAfterError] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Perbandingan</p>
            <h3 className="font-semibold text-zinc-100">{hairstyleName}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors text-lg">×</button>
        </div>
        <div className="grid grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[3/4] bg-zinc-800">
              <Image src={beforeUrl} alt="Before" fill className="object-cover" />
            </div>
            <div className="absolute bottom-0 inset-x-0 py-2 px-3 bg-zinc-950/80 backdrop-blur-sm">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest text-center">✂️ Sebelum</p>
            </div>
          </div>
          <div className="relative border-l border-zinc-800">
            <div className="relative aspect-[3/4] bg-zinc-800">
              <Image src={afterError ? "/hairstyles/placeholder.svg" : `/hairstyles/${afterSrc}`}
                alt={hairstyleName} fill className="object-cover" onError={() => setAfterError(true)} />
            </div>
            <div className="absolute bottom-0 inset-x-0 py-2 px-3 bg-emerald-950/80 backdrop-blur-sm">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest text-center">💈 Sesudah</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-600 text-center py-3">Ketuk di luar untuk menutup</p>
      </div>
    </div>
  );
}

export default function ResultCard({ result, customerName, photoUrl }: Props) {
  const { face_shape, confidence, recommendations } = result;
  const color = confidenceColor(confidence);
  const [modal, setModal] = useState<{ afterSrc: string; name: string } | null>(null);

  return (
    <div className="w-full">
      {modal && photoUrl && (
        <BeforeAfterModal beforeUrl={photoUrl} afterSrc={modal.afterSrc}
          hairstyleName={modal.name} onClose={() => setModal(null)} />
      )}

      {/* Info pelanggan + hasil */}
      <div className="grid md:grid-cols-[auto_1fr] gap-5 mb-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm">
        {/* Foto */}
        {photoUrl && (
          <div className="relative w-32 md:w-40 rounded-xl overflow-hidden aspect-[9/16] bg-zinc-800 ring-2 ring-zinc-700 mx-auto md:mx-0">
            <Image src={photoUrl} alt={customerName ?? "Foto"} fill className="object-cover" />
          </div>
        )}

        {/* Info */}
        <div className="flex flex-col gap-4 justify-between">
          {/* Nama */}
          {customerName && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Pelanggan</p>
              <p className="text-xl font-bold text-zinc-100">{customerName}</p>
            </div>
          )}

          {/* Bentuk wajah */}
          <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3">
            <span className="text-2xl">{SHAPE_EMOJI[face_shape] ?? "✨"}</span>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Bentuk Wajah</p>
              <p className="text-lg font-bold">{recommendations.label}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className={`border rounded-xl px-4 py-3 ${color.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Keyakinan AI</p>
              <p className={`text-2xl font-bold ${color.text}`}>{confidence}%</p>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${color.bar}`}
                style={{ width: `${confidence}%` }} />
            </div>
          </div>

          {/* Deskripsi */}
          <p className="text-sm text-zinc-400 leading-relaxed">{recommendations.description}</p>
        </div>
      </div>

      {/* Grid Rekomendasi */}
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-medium">Rekomendasi Gaya Rambut</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {recommendations.hairstyles.map((style, i) => {
          const match = matchScore(confidence, i);
          const matchColor = confidenceColor(match);
          return (
            <div key={i} className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden card-glow flex flex-col">
              <div className="relative">
                <HairstyleImage src={style.image ?? "placeholder.svg"} alt={style.name} />
                {/* Rank badge */}
                <div className="absolute top-2.5 left-2.5 bg-zinc-950/80 backdrop-blur-sm border border-zinc-700 rounded-lg px-2 py-0.5">
                  <span className="text-xs font-bold text-zinc-300">#{i + 1}</span>
                </div>
                {/* Match badge */}
                <div className={`absolute bottom-2.5 right-2.5 border rounded-lg px-2 py-0.5 backdrop-blur-sm ${matchColor.bg}`}>
                  <span className={`text-xs font-bold ${matchColor.text}`}>{match}%</span>
                </div>
              </div>

              <div className="p-3 flex flex-col gap-2 flex-1">
                <h4 className="font-semibold text-zinc-100 text-sm leading-tight">{style.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed flex-1">{style.description}</p>

                {/* Match bar */}
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${matchColor.bar}`} style={{ width: `${match}%` }} />
                </div>

                {/* Before/After */}
                {photoUrl && style.image && (
                  <button
                    onClick={() => setModal({ afterSrc: style.image!, name: style.name })}
                    className="w-full text-xs bg-zinc-800/80 hover:bg-emerald-950/60 border border-zinc-700 hover:border-emerald-700/60 text-zinc-500 hover:text-emerald-400 rounded-lg py-1.5 transition-all font-medium"
                  >
                    Before &amp; After
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
