const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Hairstyle {
  name: string;
  description: string;
  image?: string;
}

export interface Recommendations {
  label: string;
  description: string;
  hairstyles: Hairstyle[];
}

export interface PredictResult {
  face_shape: string;
  confidence: number;
  recommendations: Recommendations;
}

export async function predictHairstyle(file: File): Promise<PredictResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Gagal memproses gambar.");
  }

  return res.json();
}
