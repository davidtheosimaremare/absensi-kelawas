"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Coffee, Briefcase, MapPin, Save, Loader2, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";

interface Schedule {
  date: string;
  status: "WORK_DAY" | "HOLIDAY";
}

interface GeoSettings {
  latitude: string;
  longitude: string;
  radius: string;
  disableGeofencing: boolean;
}

export default function AdminSettings() {
  const [currentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geoSettings, setGeoSettings] = useState<GeoSettings>({
    latitude: "",
    longitude: "",
    radius: "50",
    disableGeofencing: false,
  });
  const [geoSaved, setGeoSaved] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [scheduleRes, settingsRes] = await Promise.all([
      fetch(`/api/schedules?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`),
      fetch("/api/settings"),
    ]);
    const scheduleData = await scheduleRes.json();
    const settingsData = await settingsRes.json();

    setSchedules(scheduleData);
    setGeoSettings({
      latitude: settingsData.latitude || "",
      longitude: settingsData.longitude || "",
      radius: settingsData.radius || "50",
      disableGeofencing: settingsData.disableGeofencing ?? false,
    });
    setLoading(false);
  };

  const handleToggleStatus = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const current = schedules.find((s) => isSameDay(new Date(s.date), date));
    const newStatus = current?.status === "HOLIDAY" ? "WORK_DAY" : "HOLIDAY";

    setSaving(true);
    const res = await fetch("/api/schedules", {
      method: "POST",
      body: JSON.stringify({ date: dateStr, status: newStatus }),
    });
    if (res.ok) fetchAll();
    setSaving(false);
  };

  const handleSaveGeo = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: geoSettings.latitude,
        longitude: geoSettings.longitude,
        radius: geoSettings.radius,
        disableGeofencing: geoSettings.disableGeofencing,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setGeoSaved(true);
      setTimeout(() => setGeoSaved(false), 2500);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h2>
        <p className="text-gray-500">Konfigurasikan aturan bisnis, hari libur, dan batas sistem.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule Config */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl border border-border">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-accent" />
              Jadwal Bulanan: {format(currentMonth, "MMMM yyyy")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {days.map((day) => {
                const schedule = schedules.find((s) => isSameDay(new Date(s.date), day));
                const isHoliday = schedule?.status === "HOLIDAY";
                return (
                  <button
                    key={day.toString()}
                    onClick={() => handleToggleStatus(day)}
                    disabled={saving}
                    className={clsx(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all aspect-square",
                      isHoliday
                        ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                        : "bg-accent/5 border-accent/20 text-accent hover:bg-accent/10"
                    )}
                  >
                    <span className="text-xs font-bold text-gray-500 mb-1">{format(day, "EEE")}</span>
                    <span className="text-sm font-black">{format(day, "d")}</span>
                    <div className="mt-2">
                      {isHoliday ? <Coffee className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Geofencing Settings */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-border space-y-5">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              Batas Geofencing
            </h3>

            {/* Toggle ON/OFF */}
            <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-2xl">
              <div>
                <p className="text-sm font-bold">Aktifkan Geofencing</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {geoSettings.disableGeofencing ? "❌ Dinonaktifkan (bebas absen dari mana saja)" : "✅ Aktif (karyawan harus berada di lokasi)"}
                </p>
              </div>
              <button
                onClick={() => setGeoSettings({ ...geoSettings, disableGeofencing: !geoSettings.disableGeofencing })}
                className="shrink-0 ml-3"
              >
                {geoSettings.disableGeofencing ? (
                  <ToggleLeft className="w-10 h-10 text-gray-400 hover:text-accent transition-colors" />
                ) : (
                  <ToggleRight className="w-10 h-10 text-accent" />
                )}
              </button>
            </div>

            {/* Radius */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Radius (meter)
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={geoSettings.radius}
                onChange={(e) => setGeoSettings({ ...geoSettings, radius: e.target.value })}
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm font-bold"
              />
            </div>

            {/* Latitude */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Latitude
              </label>
              <input
                type="text"
                value={geoSettings.latitude}
                onChange={(e) => setGeoSettings({ ...geoSettings, latitude: e.target.value })}
                placeholder="-8.0866..."
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm font-mono"
              />
            </div>

            {/* Longitude */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Longitude
              </label>
              <input
                type="text"
                value={geoSettings.longitude}
                onChange={(e) => setGeoSettings({ ...geoSettings, longitude: e.target.value })}
                placeholder="112.3627..."
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm font-mono"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveGeo}
              disabled={saving}
              className="w-full py-3 bg-accent text-accent-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : geoSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Tersimpan!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Pengaturan
                </>
              )}
            </button>
          </div>

          {/* System Health */}
          <div className="glass p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-3 text-sm font-bold text-accent mb-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
              Kesehatan Sistem
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Semua sistem inti beroperasi. Sinkronisasi cadangan berjalan setiap 24 jam ke Supabase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
