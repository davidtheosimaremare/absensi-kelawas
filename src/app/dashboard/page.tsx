"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MapPin, ShieldCheck, Clock, CheckCircle2, XCircle, Loader2, Camera, LogOut } from "lucide-react";
import { format } from "date-fns";
import FaceVerification from "@/components/face-verification";

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState("");
  const [attendance, setAttendance] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingType, setPendingType] = useState<"check_in" | "check_out" | null>(null);

  useEffect(() => {
    fetchTodayAttendance();
    requestLocation();
  }, []);

  const fetchTodayAttendance = async () => {
    const res = await fetch("/api/attendance/me");
    if (res.ok) {
      const data = await res.json();
      setAttendance(data);
    }
  };

  const requestLocation = () => {
    setLocLoading(true);
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported");
      alert("Browser Anda tidak mendukung perizinan lokasi (Geolocation).");
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      (err) => {
        setLocError("Location access denied. Please enable it to check in.");
        alert("Akses lokasi ditolak! Anda wajib mengizinkan akses lokasi pada browser untuk dapat melakukan absensi.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleStartProcess = (type: "check_in" | "check_out") => {
    setPendingType(type);
    setShowVerification(true);
  };

  const handleVerified = () => {
    if (pendingType) {
        handleSubmit(pendingType);
    }
    setShowVerification(false);
  };

  const handleSubmit = async (type: "check_in" | "check_out") => {
    if (!location) return;
    setSubmitting(true);
    
    const res = await fetch("/api/attendance", {
      method: "POST",
      body: JSON.stringify({
        latitude: location.lat,
        longitude: location.lng,
        type,
      }),
    });

    if (res.ok) {
        fetchTodayAttendance();
    } else {
        const error = await res.json();
        alert(error.error || "Failed to submit");
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center border border-accent/20">
                <ShieldCheck className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Smart-Check</h1>
                <p className="text-xs text-gray-500 font-medium">Employee Portal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{session?.user?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Present & Secure</p>
            </div>
        </div>

        {/* Hero Card */}
        <div className="glass p-8 rounded-3xl border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Clock className="w-24 h-24" />
            </div>
            <h2 className="text-4xl font-black mb-2">{format(new Date(), "hh:mm a")}</h2>
            <p className="text-gray-500 font-medium">{format(new Date(), "EEEE, MMMM do yyyy")}</p>
            
            <div className="mt-8 flex gap-4">
               {attendance?.checkIn ? (
                 <div className="flex-1 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
                    <p className="text-[10px] font-bold text-green-500 uppercase mb-1">Checked In</p>
                    <p className="text-lg font-bold">{format(new Date(attendance.checkIn), "hh:mm a")}</p>
                 </div>
               ) : (
                 <div className="flex-1 p-4 bg-gray-500/5 border border-gray-500/10 rounded-2xl italic text-gray-400 text-sm flex items-center justify-center">
                    Pending In
                 </div>
               )}

               {attendance?.checkOut ? (
                 <div className="flex-1 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Checked Out</p>
                    <p className="text-lg font-bold">{format(new Date(attendance.checkOut), "hh:mm a")}</p>
                 </div>
               ) : (
                 <div className="flex-1 p-4 bg-gray-500/5 border border-gray-500/10 rounded-2xl italic text-gray-400 text-sm flex items-center justify-center">
                    Pending Out
                 </div>
               )}
            </div>
        </div>

        {/* Status Section */}
        <div className="space-y-4">
           {/* Location Status */}
           <div className="glass p-4 rounded-2xl border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={clsx("p-2 rounded-xl", location ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                      <MapPin className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Status Lokasi</p>
                      <p className="text-xs text-gray-500">
                        {locLoading ? "Mencari lokasi..." : (location ? "Dalam Jangkauan" : locError)}
                      </p>
                   </div>
                </div>
                {location ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : (locLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : <XCircle className="w-5 h-5 text-red-500" />)}
              </div>

              {/* Tampilkan tombol untuk minta izin ulang jika lokasi gagal didapatkan */}
              {!location && !locLoading && (
                 <button 
                   onClick={requestLocation}
                   className="w-full py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                 >
                   Izinkan Akses Lokasi (Coba Lagi)
                 </button>
              )}
           </div>

           {/* Actions */}
           <div className="grid grid-cols-1 gap-4">
              {!attendance?.checkIn ? (
                <button
                  disabled={!location || submitting}
                  onClick={() => handleStartProcess("check_in")}
                  className="w-full py-6 bg-accent text-accent-foreground rounded-3xl font-black text-xl flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/25 disabled:opacity-50"
                >
                  <Camera className="w-8 h-8" />
                  Jam Masuk
                  <span className="text-[10px] font-medium opacity-70">Requires Face Verification</span>
                </button>
              ) : !attendance?.checkOut ? (
                <button
                  disabled={!location || submitting}
                  onClick={() => handleStartProcess("check_out")}
                  className="w-full py-6 bg-background border-2 border-accent text-accent rounded-3xl font-black text-xl flex flex-col items-center gap-2 hover:bg-accent/5 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <LogOut className="w-8 h-8" />
                  Jam Pulang
                  <span className="text-[10px] font-medium opacity-70">End your session</span>
                </button>
              ) : (
                <div className="w-full py-8 glass border-green-500/20 rounded-3xl flex flex-col items-center gap-4 text-center">
                   <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                   </div>
                   <div>
                     <p className="font-black text-xl">Attendance Complete</p>
                     <p className="text-sm text-gray-500">You're all set for today. Great work!</p>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {showVerification && (
        <FaceVerification 
            onVerify={handleVerified} 
            onCancel={() => setShowVerification(false)} 
        />
      )}
    </main>
  );
}

function clsx(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
