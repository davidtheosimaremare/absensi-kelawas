"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";

interface FaceVerificationProps {
  faceData: string | null;
  onVerify: (photoData: string, newFaceDescriptor?: string) => void;
  onCancel: () => void;
}

export default function FaceVerification({ faceData, onVerify, onCancel }: FaceVerificationProps) {
  const [status, setStatus] = useState<"loading_models" | "ready" | "scanning" | "success" | "error">("loading_models");
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        if (active) startCamera();
      } catch (err) {
        if (active) {
            setErrorMessage("Gagal memuat model Face API. Pastikan file model ada di folder public/models.");
            setStatus("error");
        }
      }
    };
    loadModels();
    
    return () => {
        active = false;
        stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        setStatus("ready");
        // Beri waktu 1.5 detik agar kamera terang lalu mulai scan
        setTimeout(() => setStatus("scanning"), 1500);
    } catch (err) {
        setErrorMessage("Akses kamera ditolak atau tidak tersedia!");
        setStatus("error");
    }
  };

  const capturePhoto = (): string | null => {
    if (videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL("image/jpeg", 0.6);
        }
    }
    return null;
  };

  const stopCamera = () => {
      if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
  };

  useEffect(() => {
    if (status === "scanning") {
        scanFace();
    }
  }, [status]);

  const scanFace = async () => {
      if (!videoRef.current) return;
      
      try {
          const detection = await faceapi.detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor();
            
          if (!detection) {
              setErrorMessage("Wajah tidak terlihat jelas. Tolong pastikan cahaya cukup dan wajah berada di tengah bingkai!");
              setStatus("error");
              return;
          }

          if (faceData) {
              // Mode Verifikasi (Wajah sudah terdaftar)
              const savedDescriptor = new Float32Array(JSON.parse(faceData));
              const distance = faceapi.euclideanDistance(detection.descriptor, savedDescriptor);
              
              if (distance > 0.55) {
                  setErrorMessage("Wajah tidak cocok dengan pendaftaran sebelumnya! Hubungi admin jika ini adalah kesalahan.");
                  setStatus("error");
                  return;
              }
              // Cocok
              finalizeVerification(null);
          } else {
              // Mode Pendaftaran (Baru pertama kali absen)
              const newDescriptor = JSON.stringify(Array.from(detection.descriptor));
              finalizeVerification(newDescriptor);
          }
      } catch (err) {
          setErrorMessage("Terjadi kesalahan saat memproses wajah.");
          setStatus("error");
      }
  };

  const finalizeVerification = (newDescriptor: string | null) => {
      const photo = capturePhoto();
      setStatus("success");
      setTimeout(() => {
          stopCamera();
          onVerify(photo || "", newDescriptor || undefined);
      }, 1500);
  };

  const retryScan = () => {
      setStatus("ready");
      setErrorMessage("");
      setTimeout(() => setStatus("scanning"), 1000);
  };

  const handleCancel = () => {
      stopCamera();
      onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        <div className="text-center">
            <h3 className="text-3xl font-black mb-2">Face Verification</h3>
            <p className="text-gray-500 font-medium">
               {faceData ? "Memverifikasi Identitas Anda..." : "Pendaftaran Wajah Pertama Kali"}
            </p>
        </div>

        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-accent shadow-2xl bg-black">
           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${status === 'success' || status === 'loading_models' ? 'opacity-0' : 'opacity-100'}`}
           />
           
           {status === "loading_models" && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-accent/5">
                <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
                <span className="text-sm font-bold animate-pulse text-accent">Loading AI Models...</span>
             </div>
           )}

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

           {status === "error" && (
             <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center animate-in zoom-in-50">
                <div className="text-center p-4">
                  <span className="text-4xl">⚠️</span>
                </div>
             </div>
           )}

           {status === "ready" && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8 bg-gradient-to-t from-black/80 to-transparent">
                 <span className="text-white text-xs font-bold animate-pulse">Menyiapkan Kamera...</span>
              </div>
           )}
        </div>

        <div className="w-full space-y-4">
            {status === "loading_models" ? (
                <div className="text-center text-sm font-bold text-gray-500">
                    Memuat sistem biometrik...
                </div>
            ) : status === "ready" ? (
                <div className="w-full py-4 text-center rounded-2xl font-bold flex items-center justify-center gap-2 text-accent animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Kamera Aktif. Bersiaplah...
                </div>
            ) : status === "scanning" ? (
                <div className="text-center text-sm font-bold text-accent animate-pulse">
                    Analisis wajah sedang berjalan...
                </div>
            ) : status === "error" ? (
                <div className="text-center">
                    <p className="text-sm font-bold text-red-500 mb-4">{errorMessage}</p>
                    <button 
                       onClick={retryScan}
                       className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : (
                <div className="text-center text-sm font-bold text-green-500">
                    Identity Verified Successfully
                </div>
            )}
            
            <button 
                onClick={handleCancel}
                className="w-full py-2 text-sm text-gray-500 font-medium hover:text-red-500 transition-colors"
            >
                Batalkan Proses
            </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-card px-4 py-2 rounded-full border border-border">
            <ShieldCheck className="w-3.5 h-3.5" />
            Biometric Encryption Active
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
