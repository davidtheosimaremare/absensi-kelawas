"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, ShieldCheck, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";

interface FaceVerificationProps {
    faceData: string | null;
    onVerify: (photoData: string, newFaceDescriptor?: string) => void;
    onCancel: () => void;
}

type Status = "loading_camera" | "ready" | "captured" | "error";

export default function FaceVerification({ faceData, onVerify, onCancel }: FaceVerificationProps) {
    const [status, setStatus] = useState<Status>("loading_camera");
    const [errorMessage, setErrorMessage] = useState("");
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        setStatus("loading_camera");
        setErrorMessage("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setTimeout(() => setStatus("ready"), 800);
                };
            }
        } catch (err) {
            setErrorMessage("Akses kamera ditolak! Harap izinkan akses kamera di browser Anda lalu coba lagi.");
            setStatus("error");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || videoRef.current.videoWidth === 0) {
            setErrorMessage("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
            return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Mirror the image (selfie style)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const photo = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedPhoto(photo);
        setStatus("captured");
    };

    const handleConfirm = () => {
        if (!capturedPhoto) return;
        stopCamera();
        onVerify(capturedPhoto, undefined);
    };

    const handleRetake = () => {
        setCapturedPhoto(null);
        setStatus("ready");
    };

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md flex flex-col items-center gap-6">

                {/* Title */}
                <div className="text-center">
                    <h3 className="text-3xl font-black mb-1">Foto Absensi</h3>
                    <p className="text-gray-500 font-medium text-sm">
                        Mundur sedikit agar wajah dan bahu terlihat jelas, lalu tekan tombol ambil foto
                    </p>
                </div>

                {/* Camera / Photo Frame */}
                <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden border-4 border-accent shadow-2xl bg-black">
                    {/* Live Camera Feed */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                            status === "captured" ? "opacity-0" : "opacity-100"
                        }`}
                    />

                    {/* Captured Photo Preview */}
                    {capturedPhoto && (
                        <img
                            src={capturedPhoto}
                            alt="Foto absen"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {/* Loading Overlay */}
                    {status === "loading_camera" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-accent" />
                            <span className="text-sm font-bold text-white/80">Menyalakan kamera...</span>
                        </div>
                    )}

                    {/* Ready Overlay */}
                    {status === "ready" && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Face guide oval */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-40 md:w-36 md:h-44 rounded-full border-2 border-white/60 border-dashed" />
                            </div>
                            <div className="absolute top-2 left-0 right-0">
                                <p className="text-white/80 text-[10px] text-center font-medium">Wajah + bahu harus terlihat</p>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                <p className="text-white text-xs text-center font-bold leading-snug">
                                    📱 Mundur ±50cm dari kamera<br />
                                    <span className="font-normal opacity-80">Posisikan wajah dalam garis oval</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Captured Overlay */}
                    {status === "captured" && (
                        <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1 shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                    )}

                    {/* Error Overlay */}
                    {status === "error" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-900/30">
                            <span className="text-4xl">⚠️</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-3">
                    {status === "loading_camera" && (
                        <div className="text-center text-sm text-gray-500 py-3">Menghubungkan ke kamera...</div>
                    )}

                    {status === "ready" && (
                        <button
                            onClick={handleCapture}
                            className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/25"
                        >
                            <Camera className="w-6 h-6" />
                            Ambil Foto
                        </button>
                    )}

                    {status === "captured" && (
                        <div className="space-y-2">
                            <button
                                onClick={handleConfirm}
                                className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-green-600 active:scale-[0.98] transition-all shadow-lg shadow-green-500/25"
                            >
                                <CheckCircle2 className="w-6 h-6" />
                                Konfirmasi & Absen
                            </button>
                            <button
                                onClick={handleRetake}
                                className="w-full py-3 border border-border text-gray-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:text-accent hover:border-accent transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Ambil Ulang
                            </button>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-red-500 text-center">{errorMessage}</p>
                            <button
                                onClick={startCamera}
                                className="w-full py-3 bg-accent/10 text-accent border border-accent/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Coba Lagi
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleCancel}
                        className="w-full py-2 text-sm text-gray-400 font-medium hover:text-red-500 transition-colors"
                    >
                        Batalkan
                    </button>
                </div>

                {/* Badge */}
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-card px-4 py-2 rounded-full border border-border">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Foto tersimpan sebagai bukti kehadiran
                </div>
            </div>
        </div>
    );
}
