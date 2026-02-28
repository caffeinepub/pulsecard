import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FlipHorizontal,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect } from "react";
import { useQRScanner } from "../qr-code/useQRScanner";

export default function QRScannerPage() {
  const navigate = useNavigate();

  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    retry,
    videoRef,
    canvasRef,
    currentFacingMode,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
    maxResults: 5,
  });

  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // Handle new QR scan results — navigate to patient profile
  const handleResult = useCallback(
    (data: string) => {
      try {
        // Try to extract the profileId from the URL
        const url = new URL(data);
        const patientMatch = url.pathname.match(/^\/patient\/(.+)$/);
        if (patientMatch) {
          stopScanning();
          navigate({
            to: "/patient/$profileId",
            params: { profileId: patientMatch[1] },
          });
          return;
        }
      } catch {
        // Not a URL, treat as raw profileId if it looks valid
        if (data.length > 10 && !data.includes(" ")) {
          stopScanning();
          navigate({ to: "/patient/$profileId", params: { profileId: data } });
          return;
        }
      }
    },
    [navigate, stopScanning],
  );

  // Process latest QR result
  useEffect(() => {
    if (qrResults.length > 0) {
      handleResult(qrResults[0].data);
    }
  }, [qrResults, handleResult]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-black text-navy">
          Scan Patient QR Code
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Point your camera at a PulseCard QR code to access emergency
          information
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="clinical-card rounded-2xl overflow-hidden"
      >
        {/* Camera Viewport */}
        <div className="relative bg-navy aspect-square max-h-[360px] overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ display: isActive ? "block" : "none" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay */}
          {isActive && isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute inset-8 border-2 border-transparent rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
              </div>
              {/* Scan line animation */}
              <div
                className="absolute left-8 right-8 h-0.5 bg-white/70 rounded-full"
                style={{
                  animation: "scan-line 2s ease-in-out infinite",
                  top: "33%",
                }}
              />
            </div>
          )}

          {/* Placeholder when not active */}
          {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Camera className="w-12 h-12 text-white/40" />
              <p className="text-white/50 text-sm">Camera inactive</p>
            </div>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isScanning
                    ? "bg-green-500 animate-pulse"
                    : isActive
                      ? "bg-amber-500"
                      : "bg-gray-400"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {isScanning
                  ? "Scanning for QR codes..."
                  : isActive
                    ? "Camera ready"
                    : "Camera off"}
              </span>
            </div>
            {currentFacingMode && isActive && (
              <Badge className="text-[10px] bg-secondary text-secondary-foreground">
                {currentFacingMode === "environment"
                  ? "Rear camera"
                  : "Front camera"}
              </Badge>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-xl text-sm text-destructive border border-destructive/20">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Camera Error</p>
                <p className="text-xs opacity-80 mt-0.5">{error.message}</p>
              </div>
            </div>
          )}

          {/* Not supported */}
          {isSupported === false && (
            <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-700 border border-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Camera is not supported on this device or browser.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isActive ? (
              <Button
                onClick={startScanning}
                disabled={!canStartScanning || isLoading}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                {isLoading ? "Starting..." : "Start Scanning"}
              </Button>
            ) : (
              <Button
                onClick={stopScanning}
                variant="outline"
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                Stop Scanning
              </Button>
            )}

            {error && (
              <Button variant="outline" onClick={retry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            )}

            {isMobile && isActive && (
              <Button
                variant="outline"
                size="icon"
                onClick={switchCamera}
                disabled={isLoading}
                aria-label="Switch camera"
              >
                <FlipHorizontal className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Recent Results */}
          {qrResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Recent Scans
                </p>
                <button
                  type="button"
                  onClick={clearResults}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
              {qrResults.map((result) => (
                <div
                  key={result.timestamp}
                  className="flex items-start gap-2 p-2 bg-secondary rounded-lg text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-foreground">
                      {result.data}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Scanning for PulseCard QR codes. Point at a patient's QR code to
            access emergency data.
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes scan-line {
          0%, 100% { top: 33%; }
          50% { top: 66%; }
        }
      `}</style>
    </div>
  );
}
