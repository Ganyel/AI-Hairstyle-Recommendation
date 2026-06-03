"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  fetchAllHistory, fetchAdminStats,
  deleteRecord, HistoryRecord, AdminStats,
} from "@/lib/supabase";
import { StatCardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/Skeleton";

const SHAPE_LABEL: Record<string, string> = {
  oval: "Oval", round: "Bulat", square: "Persegi",
  heart: "Hati", oblong: "Lonjong", diamond: "Berlian", triangle: "Segitiga",
};
const SHAPE_EMOJI: Record<string, string> = {
  oval: "🥚", round: "🔵", square: "⬛",
  heart: "🫀", oblong: "📏", diamond: "💎", triangle: "🔺",
};
const PIE_COLORS = ["#10b981","#06b6d4","#8b5cf6","#f59e0b","#ef4444","#ec4899","#84cc16"];

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

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

// Hitung data tren 7 hari terakhir
function buildTrendData(records: HistoryRecord[]) {
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  records.forEach((r) => {
    const day = r.created_at.slice(0, 10);
    if (day in days) days[day]++;
  });
  return Object.entries(days).map(([date, count]) => ({
    date: formatShortDate(date + "T00:00:00"),
    count,
  }));
}

// Hitung distribusi bentuk wajah
function buildShapeData(records: HistoryRecord[]) {
  const counts: Record<string, number> = {};
  records.forEach((r) => { counts[r.face_shape] = (counts[r.face_shape] ?? 0) + 1; });
  return Object.entries(counts).map(([shape, value]) => ({
    name: SHAPE_LABEL[shape] ?? shape,
    value,
  }));
}

// Export CSV
function exportCSV(records: HistoryRecord[]) {
  const header = ["Nama", "Bentuk Wajah", "Keyakinan (%)", "Gaya Rambut #1", "Tanggal"];
  const rows = records.map((r) => [
    r.name,
    SHAPE_LABEL[r.face_shape] ?? r.face_shape,
    r.confidence,
    r.hairstyles[0]?.name ?? "-",
    formatDate(r.created_at),
  ]);
  const csv = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
      <p className="text-2xl mb-3">{icon}</p>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      <p className="text-sm text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filtered, setFiltered] = useState<HistoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [shapeFilter, setShapeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "1") {
      router.replace("/admin");
      return;
    }
    Promise.all([fetchAdminStats(), fetchAllHistory()])
      .then(([s, r]) => { setStats(s); setRecords(r); setFiltered(r); })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    let result = records;
    if (search.trim()) result = result.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    if (shapeFilter !== "all") result = result.filter((r) => r.face_shape === shapeFilter);
    setFiltered(result);
  }, [search, shapeFilter, records]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus data "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert("Gagal menghapus: " + (e instanceof Error ? e.message : "error"));
    } finally {
      setDeletingId(null);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_auth");
    router.push("/admin");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse mb-2" />
            <div className="w-48 h-8 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <ChartSkeleton /><ChartSkeleton />
          </div>
          <TableSkeleton rows={6} />
        </div>
      </main>
    );
  }

  const trendData = buildTrendData(records);
  const shapeData = buildShapeData(records);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-3xl font-bold">✂️ Dashboard Barbershop</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-all">
              ← Aplikasi
            </Link>
            <button onClick={handleLogout} className="text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors">
              Keluar
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Rekomendasi" value={stats.total} icon="📊" />
            <StatCard label="Pelanggan Hari Ini" value={stats.today} icon="📅" />
            <StatCard label="Wajah Terbanyak" value={SHAPE_LABEL[stats.topFaceShape] ?? stats.topFaceShape} icon="👤" />
            <StatCard label="Gaya Terpopuler" value={stats.topHairstyle} icon="💈" />
          </div>
        )}

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Tren 7 hari */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">📈 Tren Pelanggan (7 Hari)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }}
                  labelStyle={{ color: "#a1a1aa" }}
                  itemStyle={{ color: "#10b981" }}
                  cursor={{ fill: "#27272a" }}
                />
                <Bar dataKey="count" name="Pelanggan" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribusi bentuk wajah */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">🥧 Distribusi Bentuk Wajah</p>
            {shapeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={shapeData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={75} innerRadius={40}>
                    {shapeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }}
                    itemStyle={{ color: "#a1a1aa" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#71717a" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">
                Belum ada data
              </div>
            )}
          </div>
        </div>

        {/* Toolbar tabel */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pelanggan..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <select value={shapeFilter} onChange={(e) => setShapeFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors">
            <option value="all">Semua Bentuk Wajah</option>
            {Object.entries(SHAPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button
            onClick={() => exportCSV(records)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shrink-0"
          >
            📥 Export CSV
          </button>
        </div>

        {/* Tabel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-left text-xs uppercase tracking-widest">
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Bentuk Wajah</th>
                  <th className="px-5 py-3 font-medium">Keyakinan</th>
                  <th className="px-5 py-3 font-medium">Gaya #1</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-zinc-600">
                      Tidak ada data ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((rec) => (
                    <tr key={rec.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-zinc-100">{rec.name}</td>
                      <td className="px-5 py-3 text-zinc-400">
                        {SHAPE_EMOJI[rec.face_shape]} {SHAPE_LABEL[rec.face_shape] ?? rec.face_shape}
                      </td>
                      <td className={`px-5 py-3 font-semibold ${confidenceColor(rec.confidence)}`}>
                        {rec.confidence}%
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{rec.hairstyles[0]?.name ?? "-"}</td>
                      <td className="px-5 py-3 text-zinc-500">{formatDate(rec.created_at)}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDelete(rec.id, rec.name)}
                          disabled={deletingId === rec.id}
                          className="text-xs text-red-500 hover:text-red-400 border border-red-900 hover:border-red-700 bg-red-950/40 hover:bg-red-950/60 rounded-lg px-3 py-1.5 transition-all disabled:opacity-40"
                        >
                          {deletingId === rec.id ? "..." : "🗑️ Hapus"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-zinc-800 text-xs text-zinc-600 flex justify-between">
              <span>Menampilkan {filtered.length} dari {records.length} record</span>
              <span>{records.length > 0 ? `Total: ${records.length} pelanggan` : ""}</span>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
