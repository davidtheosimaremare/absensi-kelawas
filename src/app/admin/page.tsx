"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Activity, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Metrics {
  totalEmployees: number;
  presentToday: number;
  attendanceRate: number;
}

interface Record {
  id: string;
  checkIn: string;
  checkOut: string | null;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<{ metrics: Metrics; records: Record[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports?range=week")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="p-4 glass rounded-2xl animate-pulse flex items-center gap-3">
          <div className="w-4 h-4 bg-accent rounded-full animate-bounce" />
          <span className="text-sm font-medium">Memproses data...</span>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Karyawan", value: data?.metrics.totalEmployees, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Hadir Hari Ini", value: data?.metrics.presentToday, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Tingkat Kehadiran", value: `${Math.round(data?.metrics.attendanceRate || 0)}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Jadwal Aktif", value: "Standar", icon: CalendarIcon, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Ikhtisar Sistem</h2>
        <p className="text-gray-500">Selamat datang kembali, Administrator. Berikut adalah aktivitas hari ini.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass p-6 rounded-3xl border border-border group hover:border-accent/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <Activity className="w-4 h-4 text-gray-300 group-hover:text-accent transition-colors" />
            </div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-3xl border border-border">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Kehadiran Terbaru
          </h3>
          <div className="space-y-4">
            {data?.records.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-background/50 rounded-2xl border border-border/50 group hover:border-accent/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold">
                    {record.user.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{record.user.name}</p>
                    <p className="text-xs text-gray-400">{format(new Date(record.checkIn), "hh:mm a")}</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-medium">
                    Masuk
                  </span>
                </div>
              </div>
            ))}
            {data?.records.length === 0 && (
              <p className="text-center py-8 text-gray-500 text-sm italic">Belum ada catatan kehadiran hari ini.</p>
            )}
          </div>
        </div>

        {/* Quick Actions Placeholder or Charts */}
        <div className="glass p-8 rounded-3xl border border-border flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-accent/20" />
          </div>
          <div>
            <h4 className="font-bold">Pertumbuhan & Analitik</h4>
            <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
              Analitik visual dan grafik pertumbuhan akan muncul di sini saat lebih banyak data terkumpul.
            </p>
          </div>
          <button className="px-6 py-2 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:scale-105 transition-transform">
            Lihat Laporan Detail
          </button>
        </div>
      </div>
    </div>
  );
}
