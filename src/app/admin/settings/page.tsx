"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Coffee, Briefcase, Save, Loader2, MapPin } from "lucide-react";

interface Schedule {
  date: string;
  status: "WORK_DAY" | "HOLIDAY";
}

export default function AdminSettings() {
  const [currentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const res = await fetch(`/api/schedules?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`);
    const data = await res.json();
    setSchedules(data);
    setLoading(false);
  };

  const handleToggleStatus = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const current = schedules.find(s => isSameDay(new Date(s.date), date));
    const newStatus = current?.status === "HOLIDAY" ? "WORK_DAY" : "HOLIDAY";

    setSaving(true);
    const res = await fetch("/api/schedules", {
      method: "POST",
      body: JSON.stringify({ date: dateStr, status: newStatus }),
    });

    if (res.ok) {
      fetchSchedules();
    }
    setSaving(false);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-gray-500">Configure business rules, holidays, and system limits.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule Config */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl border border-border">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-accent" />
              Monthly Schedule: {format(currentMonth, "MMMM yyyy")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {days.map((day) => {
                const schedule = schedules.find(s => isSameDay(new Date(s.date), day));
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

        {/* Global Config */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-3xl border border-border">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              Geofencing Limits
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-background/50 border border-border rounded-2xl">
                <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Target Radius</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black">50</span>
                  <span className="text-sm text-gray-500 mb-1 font-medium italic">meters (fixed)</span>
                </div>
              </div>
              <div className="p-4 bg-background/50 border border-border rounded-2xl opacity-50">
                <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Coordinates</p>
                <p className="text-xs font-mono truncate">Lat: {process.env.NEXT_PUBLIC_TARGET_LATITUDE || "- (-)"}</p>
                <p className="text-xs font-mono truncate">Long: {process.env.NEXT_PUBLIC_TARGET_LONGITUDE || "- (-)"}</p>
              </div>
            </div>
            <p className="mt-6 text-[10px] text-gray-400 italic">
              Coordinates are currently controlled via Environment Variables for maximum security.
            </p>
          </div>

          <div className="glass p-8 rounded-3xl border border-border">
             <div className="flex items-center gap-3 text-sm font-bold text-accent mb-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                System Health
             </div>
             <p className="text-xs text-gray-500 leading-relaxed">
               All core systems are operational. Backup sync running every 24 hours to Supabase.
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
