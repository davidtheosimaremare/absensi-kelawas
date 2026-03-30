"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, Download, Edit3, CheckCircle2, XCircle, AlertCircle,
  Loader2, Clock, TrendingUp, User, X, Camera, ChevronDown, ChevronUp
} from "lucide-react";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface AttendanceRecord {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInPhotoUrl: string | null;
  checkOutPhotoUrl: string | null;
  status: "PRESENT" | "ABSENT" | "LATE";
  user: { name: string; email: string };
}

interface EmployeeSummary {
  name: string;
  email: string;
  records: AttendanceRecord[];
  totalDays: number;
  avgDurationMinutes: number;
  totalHours: number;
  days: string[];
}

const STATUS_LABEL: Record<string, string> = { PRESENT: "HADIR", ABSENT: "ALPA", LATE: "TERLAMBAT" };
const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function durationText(minutes: number) {
  if (minutes <= 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}j ${m}m` : `${h}j`;
}

export default function AdminReports() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [overrideData, setOverrideData] = useState({ userId: "", date: format(new Date(), "yyyy-MM-dd"), status: "PRESENT" });
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "analysis">("table");

  useEffect(() => {
    fetchReports();
    fetchEmployees();
  }, [range]);

  const fetchReports = async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?range=${range}`);
    const data = await res.json();
    setRecords(data.records || []);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data);
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/attendance/override", { method: "POST", body: JSON.stringify(overrideData) });
    if (res.ok) { setShowOverrideModal(false); fetchReports(); }
    else alert("Gagal melakukan entri manual");
  };

  // Per-employee analysis
  const employeeSummaries = useMemo<EmployeeSummary[]>(() => {
    const map = new Map<string, AttendanceRecord[]>();
    records.forEach((r) => {
      const key = r.user.email;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    return Array.from(map.entries()).map(([email, recs]) => {
      const withBothTimes = recs.filter((r) => r.checkIn && r.checkOut);
      const durations = withBothTimes.map((r) =>
        differenceInMinutes(new Date(r.checkOut!), new Date(r.checkIn!))
      );
      const totalMinutes = durations.reduce((a, b) => a + b, 0);
      const avgDurationMinutes = durations.length > 0 ? Math.round(totalMinutes / durations.length) : 0;
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

      const days = recs
        .filter((r) => r.checkIn)
        .map((r) => format(new Date(r.checkIn!), "EEEE, dd MMM", { locale: idLocale }));

      return {
        name: recs[0].user.name,
        email,
        records: recs,
        totalDays: recs.filter((r) => r.status === "PRESENT" || r.status === "LATE").length,
        avgDurationMinutes,
        totalHours,
        days,
      };
    }).sort((a, b) => b.totalDays - a.totalDays);
  }, [records]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan Kehadiran</h2>
          <p className="text-gray-500">Analisis kinerja dan kelola pengecualian kehadiran.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowOverrideModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-accent/20 text-accent rounded-xl text-sm font-bold hover:bg-accent/5 transition-all"
          >
            <Edit3 className="w-4 h-4" /> Entri Manual
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
        </div>
      </header>

      {/* Filter & Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border glass">
          {["month", "week"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${range === r ? "bg-accent text-white shadow-md" : "text-gray-500 hover:text-accent"}`}>
              {r === "month" ? "Bulanan" : "Mingguan"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border glass">
          {(["table", "analysis"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab ? "bg-accent text-white shadow-md" : "text-gray-500 hover:text-accent"}`}>
              {tab === "table" ? <><BarChart3 className="w-3.5 h-3.5" /> Tabel</> : <><TrendingUp className="w-3.5 h-3.5" /> Per Karyawan</>}
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB: TABLE --- */}
      {activeTab === "table" && (
        <div className="glass rounded-3xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-accent/5 border-b border-border">
                {["Karyawan", "Tanggal", "Masuk", "Keluar", "Durasi", "Bukti Foto", "Status"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-6"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-full" /></td>
                  </tr>
                ))
              ) : records.map((record) => {
                const duration = record.checkIn && record.checkOut
                  ? differenceInMinutes(new Date(record.checkOut), new Date(record.checkIn))
                  : null;
                return (
                  <tr key={record.id} className="hover:bg-accent/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                          {record.user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-none">{record.user.name}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{record.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      {record.checkIn ? format(new Date(record.checkIn), "EEE, dd MMM yyyy", { locale: idLocale }) : "-"}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-green-600">
                      {record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "--:--"}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-blue-500">
                      {record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "--:--"}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">
                      {duration !== null ? durationText(duration) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {record.checkInPhotoUrl && (
                          <button onClick={() => setLightbox(record.checkInPhotoUrl!)} title="Foto Masuk">
                            <img src={record.checkInPhotoUrl} alt="masuk"
                              className="w-10 h-10 rounded-lg object-cover border-2 border-green-500/30 hover:scale-110 hover:shadow-lg transition-all cursor-zoom-in" />
                          </button>
                        )}
                        {record.checkOutPhotoUrl && (
                          <button onClick={() => setLightbox(record.checkOutPhotoUrl!)} title="Foto Keluar">
                            <img src={record.checkOutPhotoUrl} alt="keluar"
                              className="w-10 h-10 rounded-lg object-cover border-2 border-blue-500/30 hover:scale-110 hover:shadow-lg transition-all cursor-zoom-in" />
                          </button>
                        )}
                        {!record.checkInPhotoUrl && !record.checkOutPhotoUrl && (
                          <span className="text-gray-300 text-xs italic flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Tidak ada
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        record.status === "PRESENT" ? "bg-green-500/10 text-green-500" :
                        record.status === "LATE" ? "bg-orange-500/10 text-orange-500" :
                        "bg-red-500/10 text-red-500"}`}>
                        {record.status === "PRESENT" && <CheckCircle2 className="w-3 h-3" />}
                        {record.status === "ABSENT" && <XCircle className="w-3 h-3" />}
                        {record.status === "LATE" && <AlertCircle className="w-3 h-3" />}
                        {STATUS_LABEL[record.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && records.length === 0 && (
            <div className="py-20 text-center opacity-40">
              <BarChart3 className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm italic">Tidak ada catatan.</p>
            </div>
          )}
          </div>{/* end overflow-x-auto */}
        </div>
      )}

      {/* --- TAB: ANALYSIS PER EMPLOYEE --- */}
      {activeTab === "analysis" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data...
            </div>
          ) : employeeSummaries.length === 0 ? (
            <div className="py-20 text-center opacity-40">
              <BarChart3 className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm italic">Tidak ada data karyawan.</p>
            </div>
          ) : employeeSummaries.map((emp) => {
            const isExpanded = expandedEmployee === emp.email;
            const avgH = Math.floor(emp.avgDurationMinutes / 60);
            const avgM = emp.avgDurationMinutes % 60;
            return (
              <div key={emp.email} className="glass rounded-3xl border border-border overflow-hidden">
                {/* Summary Row */}
                <button
                  className="w-full p-6 flex items-center gap-4 hover:bg-accent/5 transition-colors text-left"
                  onClick={() => setExpandedEmployee(isExpanded ? null : emp.email)}
                >
                  <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-lg font-black text-accent shrink-0">
                    {emp.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">{emp.name}</p>
                    <p className="text-xs text-gray-400">{emp.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-black text-accent">{emp.totalDays}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Hari Hadir</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black">{durationText(emp.avgDurationMinutes)}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rata-rata/Hari</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-green-500">{emp.totalHours}j</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Jam Kerja</p>
                    </div>
                  </div>

                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                </button>

                {/* Mobile Stats */}
                <div className="md:hidden flex items-center gap-4 px-6 pb-4">
                  <div className="text-center flex-1 bg-accent/5 rounded-xl p-3">
                    <p className="text-xl font-black text-accent">{emp.totalDays}</p>
                    <p className="text-[9px] text-gray-500 uppercase">Hari Hadir</p>
                  </div>
                  <div className="text-center flex-1 bg-black/5 rounded-xl p-3">
                    <p className="text-xl font-black">{durationText(emp.avgDurationMinutes)}</p>
                    <p className="text-[9px] text-gray-500 uppercase">Rata-rata</p>
                  </div>
                  <div className="text-center flex-1 bg-green-500/5 rounded-xl p-3">
                    <p className="text-xl font-black text-green-500">{emp.totalHours}j</p>
                    <p className="text-[9px] text-gray-500 uppercase">Total Jam</p>
                  </div>
                </div>

                {/* Expanded: day-by-day detail */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-6 py-5 space-y-3 bg-background/40">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Rincian Kehadiran</p>
                    {emp.records
                      .filter((r) => r.checkIn)
                      .sort((a, b) => new Date(b.checkIn!).getTime() - new Date(a.checkIn!).getTime())
                      .map((r) => {
                        const dur = r.checkIn && r.checkOut
                          ? differenceInMinutes(new Date(r.checkOut), new Date(r.checkIn))
                          : null;
                        return (
                          <div key={r.id} className="flex items-center gap-4 p-3 rounded-2xl bg-card border border-border/50">
                            {/* Photo */}
                            {r.checkInPhotoUrl ? (
                              <button onClick={() => setLightbox(r.checkInPhotoUrl!)}>
                                <img src={r.checkInPhotoUrl} alt="in"
                                  className="w-12 h-12 rounded-xl object-cover border border-green-500/30 hover:scale-110 transition-all cursor-zoom-in shrink-0" />
                              </button>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                <Camera className="w-5 h-5 text-gray-300" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold">
                                {format(new Date(r.checkIn!), "EEEE, dd MMMM yyyy", { locale: idLocale })}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Masuk: <span className="text-green-600 font-bold">{format(new Date(r.checkIn!), "HH:mm")}</span>
                                {r.checkOut && (
                                  <> · Keluar: <span className="text-blue-500 font-bold">{format(new Date(r.checkOut), "HH:mm")}</span></>
                                )}
                                {dur !== null && (
                                  <> · <span className="text-gray-600 font-bold">{durationText(dur)}</span></>
                                )}
                              </p>
                            </div>

                            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                              r.status === "PRESENT" ? "bg-green-500/10 text-green-500" :
                              r.status === "LATE" ? "bg-orange-500/10 text-orange-500" :
                              "bg-red-500/10 text-red-500"}`}>
                              {STATUS_LABEL[r.status]}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(null)}>
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightbox}
            alt="Bukti Foto"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Manual Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6">Entri Kehadiran Manual</h3>
            <form onSubmit={handleOverride} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Pilih Karyawan</label>
                <select required className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                  value={overrideData.userId} onChange={(e) => setOverrideData({ ...overrideData, userId: e.target.value })}>
                  <option value="">Pilih karyawan...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Tanggal</label>
                <input type="date" required className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                  value={overrideData.date} onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Status</label>
                <select required className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                  value={overrideData.status} onChange={(e) => setOverrideData({ ...overrideData, status: e.target.value })}>
                  <option value="PRESENT">HADIR</option>
                  <option value="LATE">TERLAMBAT</option>
                  <option value="ABSENT">ALPA</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowOverrideModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                  Batal
                </button>
                <button type="submit"
                  className="flex-1 py-3 bg-accent text-accent-foreground rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/25">
                  Simpan Entri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
