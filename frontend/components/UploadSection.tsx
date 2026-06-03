"use client";

import { useCallback, useId, useState } from "react";
import Image from "next/image";
import CameraCapture from "@/components/CameraCapture";

interface Props {
  onUpload: (file: File) => void;
  loading: boolean;
}

export default function UploadSection({ onUpload, loading }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const inputId = useId();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    onUpload(file);
  }, [onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  function handleCapture(file: File) {
    setPreview(URL.createObjectURL(file));
    onUpload(file);
  }

  return (
    <>
      {/* Modal kamera */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="w-full flex flex-col gap-3">
        {/* Area upload */}
        <label
          htmlFor={inputId}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={[
            "relative flex flex-col items-center justify-center",
            "rounded-2xl border-2 border-dashed overflow-hidden",
            "transition-all duration-300 aspect-[9/16]",
            dragging
              ? "border-emerald-400 bg-emerald-950/20 scale-[1.01]"
              : preview
                ? "border-zinc-700 cursor-pointer"
                : "border-zinc-700 bg-zinc-900/60 hover:border-emerald-600/60 hover:bg-zinc-900 cursor-pointer",
            loading ? "pointer-events-none" : "",
          ].join(" ")}
        >
          {preview ? (
            <Image src={preview} alt="Preview" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-4 p-6 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl">
                📸
              </div>
              <div>
                <p className="font-medium text-zinc-300 text-sm">Klik atau seret foto ke sini</p>
                <p className="text-zinc-600 text-xs mt-1">JPG, PNG, WEBP · Maks. 5MB</p>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-2 border-emerald-400/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-200">Menganalisis wajah</p>
                <p className="text-xs text-zinc-500 mt-1">Mohon tunggu sebentar...</p>
              </div>
            </div>
          )}

          {/* Ganti foto overlay */}
          {preview && !loading && (
            <div className="absolute inset-0 bg-zinc-950/0 hover:bg-zinc-950/60 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-200 font-medium">
                🔄 Ganti Foto
              </div>
            </div>
          )}
        </label>

        {/* Tombol kamera */}
        {!loading && (
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-700/60 text-zinc-400 hover:text-emerald-400 rounded-xl py-3 text-sm font-medium transition-all duration-200"
          >
            <span className="text-base">📷</span>
            Ambil Foto dari Kamera
          </button>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        disabled={loading}
        onChange={onInputChange}
      />
    </>
  );
}
