"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Download, 
  Filter, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInPhotoUrl: string | null;
  checkOutPhotoUrl: string | null;
  status: "PRESENT" | "ABSENT" | "LATE";
  user: { name: string; email: string };
}

export default function AdminReports() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [overrideData, setOverrideData] = useState({ userId: "", date: format(new Date(), "yyyy-MM-dd"), status: "PRESENT" });

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
    const res = await fetch("/api/attendance/override", {
      method: "POST",
      body: JSON.stringify(overrideData),
    });
    if (res.ok) {
      setShowOverrideModal(false);
      fetchReports();
    } else {
        alert("Failed to override");
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Reports</h2>
          <p className="text-gray-500">Analyze performance and manage attendance exceptions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowOverrideModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-accent/20 text-accent rounded-xl text-sm font-bold hover:bg-accent/5 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Manual Entry
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border border-border glass">
        <button 
           onClick={() => setRange("month")}
           className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${range === 'month' ? 'bg-accent text-white shadow-md' : 'text-gray-500 hover:text-accent'}`}
        >
          Monthly
        </button>
        <button 
           onClick={() => setRange("week")}
           className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${range === 'week' ? 'bg-accent text-white shadow-md' : 'text-gray-500 hover:text-accent'}`}
        >
          Weekly
        </button>
      </div>

      {/* Table Interface */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-accent/5 border-b border-border">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-none">Employee</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-none">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-none">Check In</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-none">Check Out</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-none">Proof</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 leading-none">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-full" /></td>
                </tr>
              ))
            ) : records.map((record) => (
              <tr key={record.id} className="hover:bg-accent/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-[10px] font-bold text-accent">
                        {record.user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none">{record.user.name}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{record.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-500 leading-none">
                   {format(new Date(record.checkIn || record.id), "MMM dd, yyyy")}
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {record.checkIn ? format(new Date(record.checkIn), "hh:mm a") : "--:--"}
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {record.checkOut ? format(new Date(record.checkOut), "hh:mm a") : "--:--"}
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {record.checkInPhotoUrl && (
                      <a href={record.checkInPhotoUrl} target="_blank" rel="noreferrer" title="Check In Photo">
                        <img src={record.checkInPhotoUrl} alt="in" className="w-8 h-8 rounded-md object-cover border border-border hover:scale-[3] transition-transform origin-center shadow-lg" />
                      </a>
                    )}
                    {record.checkOutPhotoUrl && (
                      <a href={record.checkOutPhotoUrl} target="_blank" rel="noreferrer" title="Check Out Photo">
                        <img src={record.checkOutPhotoUrl} alt="out" className="w-8 h-8 rounded-md object-cover border border-border hover:scale-[3] transition-transform origin-center shadow-lg" />
                      </a>
                    )}
                    {!record.checkInPhotoUrl && !record.checkOutPhotoUrl && <span className="text-gray-400 text-xs italic">No Photo</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider leading-none ${
                     record.status === 'PRESENT' ? 'bg-green-500/10 text-green-500' : 
                     record.status === 'LATE' ? 'bg-orange-500/10 text-orange-500' : 
                     'bg-red-500/10 text-red-500'
                   }`}>
                      {record.status === 'PRESENT' && <CheckCircle2 className="w-3 h-3" />}
                      {record.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                      {record.status === 'LATE' && <AlertCircle className="w-3 h-3" />}
                      {record.status}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && records.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                <BarChart3 className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-500 italic">No records found for the selected period.</p>
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6">Manual Attendance Entry</h3>
            <form onSubmit={handleOverride} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Select Employee</label>
                <select 
                   required
                   className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                   value={overrideData.userId}
                   onChange={(e) => setOverrideData({ ...overrideData, userId: e.target.value })}
                >
                   <option value="">Choose an employee...</option>
                   {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                  value={overrideData.date}
                  onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Status</label>
                <select 
                   required
                   className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                   value={overrideData.status}
                   onChange={(e) => setOverrideData({ ...overrideData, status: e.target.value })}
                >
                   <option value="PRESENT">PRESENT</option>
                   <option value="LATE">LATE</option>
                   <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-2 py-3 bg-accent text-accent-foreground rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/25"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
