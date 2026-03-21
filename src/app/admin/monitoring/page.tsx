"use client";

import { useState, useEffect } from "react";
import { 
  subMonths, 
  addMonths, 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";
import { clsx } from "clsx";

interface AttendanceRecord {
  id: string;
  checkIn: string;
  user: { name: string };
}

interface Schedule {
  date: string;
  status: "WORK_DAY" | "HOLIDAY";
}

export default function CalendarMonitoring() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    
    const [reportRes, scheduleRes] = await Promise.all([
      fetch(`/api/reports?range=month&month=${month}&year=${year}`),
      fetch(`/api/schedules?month=${month}&year=${year}`)
    ]);

    const reportData = await reportRes.json();
    const scheduleData = await scheduleRes.json();

    setRecords(reportData.records || []);
    setSchedules(scheduleData || []);
    setLoading(false);
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Calendar</h2>
          <p className="text-gray-500">Track presence and organizational schedules across time.</p>
        </div>
        <div className="flex items-center gap-4 bg-card border border-border px-4 py-2 rounded-2xl glass">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:text-accent transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold min-w-[140px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:text-accent transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="glass rounded-3xl border border-border overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b border-border bg-accent/5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayRecords = records.filter(r => isSameDay(new Date(r.checkIn), day));
            const schedule = schedules.find(s => isSameDay(new Date(s.date), day));
            const isWorkDay = schedule ? schedule.status === "WORK_DAY" : true;

            return (
              <div 
                key={day.toString()} 
                className={clsx(
                  "min-h-[120px] p-2 border-r border-b border-border flex flex-col gap-1 transition-all hover:bg-accent/5",
                  !isSameMonth(day, currentMonth) && "bg-gray-50/50 dark:bg-gray-950/20 opacity-30",
                  idx % 7 === 6 && "border-r-0"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={clsx(
                    "w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full",
                    isToday(day) ? "bg-accent text-white" : "text-gray-500"
                  )}>
                    {format(day, "d")}
                  </span>
                  {!isWorkDay && (
                    <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                      Holiday
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayRecords.slice(0, 3).map(rec => (
                    <div key={rec.id} className="text-[10px] bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md truncate font-medium text-accent">
                      {rec.user.name}
                    </div>
                  ))}
                  {dayRecords.length > 3 && (
                    <div className="text-[9px] text-center text-gray-400 font-medium">
                      + {dayRecords.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 justify-center text-xs font-medium text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-accent rounded-full" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500/10 border border-red-500/20 rounded-md" />
          <span>Holiday / Off</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>Click day for details (To be implemented)</span>
        </div>
      </div>
    </div>
  );
}
