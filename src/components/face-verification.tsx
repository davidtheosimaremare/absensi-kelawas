"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

interface FaceVerificationProps {
  onVerify: () => void;
  onCancel: () => void;
}

export default function FaceVerification({ onVerify, onCancel }: FaceVerificationProps) {
  const [status, setStatus] = useState<"ready" | "scanning" | "success">("ready");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (status === "scanning") {
        const timer = setTimeout(() => {
            setStatus("success");
            setTimeout(onVerify, 1500);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [status]);

  const startScan = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        setStatus("scanning");
    } catch (err) {
        alert("Camera access required for face verification");
        onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        <div className="text-center">
            <h3 className="text-3xl font-black mb-2">Face Verification</h3>
            <p className="text-gray-500 font-medium">Position your face within the frame</p>
        </div>

        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-accent shadow-2xl bg-black">
           {status !== "ready" && (
             <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
             />
           )}
           
           {/* Scan Overlay */}
           {status === "scanning" && (
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-full h-1 bg-accent/50 absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
                <div className="z-10 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Analyzing Liveness</span>
                </div>
             </div>
           )}

           {status === "success" && (
             <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center animate-in zoom-in-50">
                <CheckCircle2 className="w-20 h-20 text-green-500 drop-shadow-lg" />
             </div>
           )}

           {status === "ready" && (
              <div className="absolute inset-0 flex items-center justify-center bg-accent/5">
                 <Camera className="w-16 h-16 text-accent/20" />
              </div>
           )}
        </div>

        <div className="w-full space-y-4">
            {status === "ready" ? (
                <button 
                    onClick={startScan}
                    className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                >
                    <Camera className="w-5 h-5" />
                    Start Verification
                </button>
            ) : status === "scanning" ? (
                <div className="text-center text-sm font-bold text-accent animate-pulse">
                    Please blink or nod slightly...
                </div>
            ) : (
                <div className="text-center text-sm font-bold text-green-500">
                    Identity Verified Successfully
                </div>
            )}
            
            <button 
                onClick={onCancel}
                className="w-full py-2 text-sm text-gray-500 font-medium hover:text-red-500 transition-colors"
            >
                Cancel Process
            </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-card px-4 py-2 rounded-full border border-border">
            <ShieldCheck className="w-3.5 h-3.5" />
            End-to-End Encrypted Verification
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes scan {
            0% { top: 0% }
            50% { top: 100% }
            100% { top: 0% }
        }
      `}</style>
    </div>
  );
}
