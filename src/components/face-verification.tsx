"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, ShieldCheck, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";

interface FaceVerificationProps {
    faceData: string | null;
    onVerify: (photoData: string, newFaceDescriptor?: string) => void;
    onCancel: () => void;
}

type Status = "loading_models" | "loading_camera" | "ready" | "scanning" | "success" | "error";

export default function FaceVerification({ faceData, onVerify, onCancel }: FaceVerificationProps) {
    const [status, setStatus] = useState<Status>("loading_models");
    const [errorMessage, setErrorMessage] = useState("");
    const [modelsReady, setModelsReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const scanningRef = useRef(false);

    // Step 1: Load AI models
    useEffect(() => {
        let active = true;
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
                    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
                ]);
                if (active) {
                    setModelsReady(true);
                    startCamera();
                }
            } catch (err) {
                if (active) {
                    setErrorMessage("Gagal memuat model AI. Periksa koneksi internet Anda.");
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

    // Step 2: Start Camera
    const startCamera = async () => {
        setStatus("loading_camera");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait until video is truly playing
                videoRef.current.onloadeddata = () => {
                    setTimeout(() => {
                        setStatus("ready");
                    }, 1500); // 1.5 seconds for camera to warm up
                };
            }
        } catch (err) {
            setErrorMessage("Akses kamera ditolak atau tidak tersedia! Harap izinkan akses kamera di browser Anda.");
            setStatus("error");
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
        }
    };

    const capturePhoto = (): string | null => {
        if (!videoRef.current || videoRef.current.videoWidth === 0) return null;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL("image/jpeg", 0.7);
        }
        return null;
    };

    // Step 3: Manual scan trigger
    const handleScan = async () => {
        if (scanningRef.current || !videoRef.current || !modelsReady) return;
        if (videoRef.current.videoWidth === 0 || videoRef.current.readyState < 2) {
            setErrorMessage("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
            setStatus("error");
            return;
        }

        scanningRef.current = true;
        setStatus("scanning");
        setErrorMessage("");

        try {
            const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 });
            const detection = await faceapi
                .detectSingleFace(videoRef.current, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setErrorMessage("Wajah tidak terdeteksi. Pastikan wajah Anda berada di tengah lingkaran dan cahaya cukup terang, lalu coba lagi.");
                setStatus("error");
                scanningRef.current = false;
                return;
            }

            // Process the detection
            if (faceData) {
                // Verification mode
                const savedDescriptor = new Float32Array(JSON.parse(faceData));
                const distance = faceapi.euclideanDistance(detection.descriptor, savedDescriptor);
                if (distance > 0.6) {
                    setErrorMessage(`Wajah tidak cocok (${(distance * 100).toFixed(0)}% berbeda). Hubungi admin jika ini salah.`);
                    setStatus("error");
                    scanningRef.current = false;
                    return;
                }
            }

            // Success!
            const photo = capturePhoto();
            setStatus("success");
            const newDescriptor = !faceData ? JSON.stringify(Array.from(detection.descriptor)) : undefined;
            setTimeout(() => {
                stopCamera();
                onVerify(photo || "", newDescriptor);
            }, 1500);
        } catch (err) {
            console.error("Face scan error:", err);
            setErrorMessage("Terjadi kesalahan internal saat memproses wajah. Coba lagi.");
            setStatus("error");
            scanningRef.current = false;
        }
    };

    const handleRetry = () => {
        scanningRef.current = false;
        setErrorMessage("");
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
                    <h3 className="text-3xl font-black mb-1">Verifikasi Wajah</h3>
                    <p className="text-gray-500 font-medium text-sm">
                        {faceData ? "Verifikasi identitas Anda untuk absen" : "Pendaftaran wajah pertama kali"}
                    </p>
                </div>

                {/* Camera Circle */}
                <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-accent shadow-2xl bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${
                            status === "success" || status === "loading_models" || status === "loading_camera"
                                ? "opacity-0"
                                : "opacity-100"
                        }`}
                    />

                    {(status === "loading_models" || status === "loading_camera") && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-accent/5 gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-accent" />
                            <span className="text-sm font-bold text-accent">
                                {status === "loading_models" ? "Memuat AI..." : "Menyalakan Kamera..."}
                            </span>
                        </div>
                    )}

                    {status === "scanning" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-full h-0.5 bg-accent/70 absolute top-0 animate-[scan_1.5s_ease-in-out_infinite]" />
                            <div className="z-10 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Memindai...</span>
                            </div>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center animate-in zoom-in-50">
                            <CheckCircle2 className="w-20 h-20 text-green-500 drop-shadow-lg" />
                        </div>
                    )}

                    {status === "ready" && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-4 bg-gradient-to-t from-black/50 to-transparent">
                            <span className="text-white text-xs font-bold">Siap! Tekan tombol di bawah</span>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-4xl">⚠️</span>
                        </div>
                    )}
                </div>

                {/* Action Area */}
                <div className="w-full space-y-3">
                    {status === "loading_models" || status === "loading_camera" ? (
                        <div className="text-center text-sm text-gray-500 font-medium py-3">
                            {status === "loading_models" ? "Memuat sistem biometrik..." : "Menghubungkan ke kamera..."}
                        </div>
                    ) : status === "ready" ? (
                        <button
                            onClick={handleScan}
                            className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/25"
                        >
                            <Camera className="w-6 h-6" />
                            Ambil Foto & Verifikasi
                        </button>
                    ) : status === "scanning" ? (
                        <div className="text-center py-3 text-sm font-bold text-accent animate-pulse">
                            Menganalisis wajah Anda...
                        </div>
                    ) : status === "error" ? (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-red-500 text-center">{errorMessage}</p>
                            <button
                                onClick={handleRetry}
                                className="w-full py-3 bg-accent/10 text-accent border border-accent/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Coba Lagi
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-3 text-sm font-bold text-green-500">
                            ✅ Identitas Berhasil Diverifikasi
                        </div>
                    )}

                    <button
                        onClick={handleCancel}
                        className="w-full py-2 text-sm text-gray-400 font-medium hover:text-red-500 transition-colors"
                    >
                        Batalkan
                    </button>
                </div>

                {/* Footer Badge */}
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-card px-4 py-2 rounded-full border border-border">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Enkripsi Biometrik Aktif
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
