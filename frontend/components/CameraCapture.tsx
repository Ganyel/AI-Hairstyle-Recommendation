"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [flash, setFlash] = useState(false);

  const startCamera = useCallback(async (facingMode: "user" | "environment") => {
    // Hentikan stream lama jika ada
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      setError("Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan di browser.");
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, [facing, startCamera]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Ambil frame dari video dengan rasio 9:16
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const targetRatio = 9 / 16;
    const videoRatio = vw / vh;

    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (videoRatio > targetRatio) {
      sw = vh * targetRatio;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / targetRatio;
      sy = (vh - sh) / 2;
    }

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d")!;

    // Mirror jika kamera depan
    if (facing === "user") {
      ctx.translate(sw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

    // Efek flash
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "kamera.jpg", { type: "image/jpeg" });
      onCapture(file);
      onClose();
    }, "image/jpeg", 0.92);
  }

  function toggleCamera() {
    setFacing((f) => (f === "user" ? "environment" : "user"));
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none" />}

      {/* Video */}
      <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
        />

        {/* Overlay frame guide */}
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/30 rounded-2xl w-48 h-64 flex items-center justify-center">
              <p className="text-white/40 text-xs text-center px-4">Posisikan wajah di sini</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
            <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm">Memulai kamera...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 px-8 text-center">
            <span className="text-4xl">📵</span>
            <p className="text-zinc-300 text-sm">{error}</p>
            <button
              onClick={() => startCamera(facing)}
              className="bg-emerald-500 text-zinc-950 font-semibold rounded-xl px-5 py-2.5 text-sm"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Tombol tutup */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Toggle kamera depan/belakang */}
        <button
          onClick={toggleCamera}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors text-lg"
          title="Ganti kamera"
        >
          🔄
        </button>
      </div>

      {/* Tombol capture */}
      <div className="bg-zinc-950 py-8 flex items-center justify-center">
        <button
          onClick={capture}
          disabled={!ready}
          className="w-18 h-18 relative disabled:opacity-40"
          style={{ width: 72, height: 72 }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-white/30" />
          <div className="absolute inset-2 rounded-full bg-white hover:bg-zinc-200 transition-colors shadow-lg" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
