import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import {
  Camera, X, CheckCircle2, AlertCircle,
  RefreshCw, Zap, ZapOff,
  SwitchCamera, Sparkles
} from 'lucide-react';

interface TableQrScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTableId?: string;
}

export const TableQrScanModal: React.FC<TableQrScanModalProps> = ({
  isOpen,
  onClose,
  defaultTableId = '1',
}) => {
  const navigate = useNavigate();

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);

  // Camera hardware capabilities
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const isProcessingQrRef = useRef<boolean>(false);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setIsScanning(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);


  // Handle QR scan result — token is REQUIRED for access (no manual bypass)
  const handleSelectAndProceed = useCallback(async (tableNumStr: string, qrToken?: string) => {
    const finalTable = tableNumStr.trim() || '6';
    stopCamera();

    // Require a real QR token — manual entry without a token is NOT allowed
    if (!qrToken) {
      setCameraError('This QR code is not valid for table access. Please scan the official QR code placed on your dining table.');
      isProcessingQrRef.current = false;
      return;
    }

    // Optional haptic vibration feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch {
        // pass
      }
    }

    setScannedSuccess(finalTable);

    // Navigate directly to the secure /dine/:token route for backend validation
    setTimeout(() => {
      onClose();
      navigate(`/dine/${qrToken}`, { replace: true });
    }, 700);
  }, [onClose, navigate, stopCamera]);

  // Handle parsed raw QR text — extract token first, navigate to /dine/:token directly if found
  const handleDetectedQrString = useCallback((rawQrStr: string) => {
    if (isProcessingQrRef.current) return;
    isProcessingQrRef.current = true;

    try {
      const clean = rawQrStr.trim();

      // Priority 1: If the QR encodes a /dine/<token> or /t/<token> URL, navigate directly
      const urlTokenMatch = clean.match(/(?:\/dine\/|\/t\/)([a-zA-Z0-9_\-]+)/i);
      if (urlTokenMatch && urlTokenMatch[1]) {
        const token = urlTokenMatch[1];
        stopCamera();
        setScannedSuccess('...');
        setTimeout(() => {
          onClose();
          navigate(`/dine/${token}`, { replace: true });
        }, 700);
        return;
      }

      // Priority 2: If raw QR data is a token or table string
      if (/^[a-f0-9]{24,64}$/i.test(clean) || /^tok_/i.test(clean) || /^table-?\d+$/i.test(clean) || /^\d+$/.test(clean)) {
        stopCamera();
        setScannedSuccess('...');
        setTimeout(() => {
          onClose();
          navigate(`/dine/${clean}`, { replace: true });
        }, 700);
        return;
      }

      // Not a valid QR for this system
      setCameraError('Invalid QR code. Please scan the official table QR stand provided at your dining table.');
      isProcessingQrRef.current = false;
    } catch (err) {
      console.error('Error parsing QR payload:', err);
      isProcessingQrRef.current = false;
    }
  }, [stopCamera, onClose, navigate]);

  // Frame processing loop with jsQR + BarcodeDetector fallback
  const processVideoFrame = useCallback(() => {
    if (!videoRef.current || !streamRef.current || isProcessingQrRef.current) return;

    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const now = performance.now();
    // Throttle scan rate to ~130ms for smooth 60fps video preview & low CPU overhead
    if (now - lastScanTimestampRef.current >= 130) {
      lastScanTimestampRef.current = now;

      // 1. Hardware-accelerated BarcodeDetector (Chrome, Edge, modern Android)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          detector.detect(video).then((barcodes: any[]) => {
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleDetectedQrString(barcodes[0].rawValue);
              return;
            }
          }).catch(() => {
            // pass
          });
        } catch {
          // pass
        }
      }

      // 2. High-performance jsQR offscreen canvas scanner (iOS Safari, Firefox, All browsers)
      if (!isProcessingQrRef.current) {
        try {
          if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
          }
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            // Scale video frame to ideal QR analysis resolution (~480p) for maximum speed
            const targetW = Math.min(640, video.videoWidth);
            const targetH = Math.round((targetW / video.videoWidth) * video.videoHeight);

            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
            }

            ctx.drawImage(video, 0, 0, targetW, targetH);
            const imageData = ctx.getImageData(0, 0, targetW, targetH);

            const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (qrResult && qrResult.data) {
              handleDetectedQrString(qrResult.data);
              return;
            }
          }
        } catch (e) {
          // frame analysis pass
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  }, [handleDetectedQrString]);

  // Start camera helper
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setIsScanning(true);
    isProcessingQrRef.current = false;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera scanner not supported in this browser. Please select your table manually.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities) {
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        animationFrameRef.current = requestAnimationFrame(processVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Camera permission was denied. Please allow camera access in browser settings or choose your table manually below.'
        : (err.message || 'Unable to start camera.');
      setCameraError(msg);
      setIsScanning(false);
    }
  }, [facingMode, processVideoFrame, stopCamera]);

  // Toggle camera torch / flashlight
  const handleToggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      } catch (e) {
        console.warn('Could not toggle flashlight:', e);
      }
    }
  };

  // Switch between back & front cameras
  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setScannedSuccess(null);
      isProcessingQrRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-[90] bg-[#141b1d]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Modal Surface — Responsive Mobile Bottom Sheet on phones, centered dialog on desktop */}
      <div className="bg-[#fcfbf9] border border-[#e3ddd4] rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[88vh] text-[#223134] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

        {/* Mobile Pull Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-[#c9c1b5] rounded-full" />
        </div>

        {/* Cafe Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#f8f5f0] via-white to-[#f5f1eb] border-b border-[#e3ddd4] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/favicon.svg"
              alt="Siliguri's Chai Addaa"
              className="w-9 h-9 rounded-xl shadow-xs shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h3 className="font-serif-display font-bold text-sm sm:text-base text-[#223134] leading-tight truncate">
                Siliguri's Chai Addaa
              </h3>
              <p className="text-[11px] sm:text-xs text-[#5f6c6e] font-medium leading-tight truncate">
                Scan Table QR Stand to Order Directly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#5f6c6e] hover:text-[#223134] hover:bg-[#efeae3] rounded-full cursor-pointer transition-colors shrink-0"
            aria-label="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Scanner Header Bar */}
        <div className="p-2.5 sm:p-3 bg-[#f5f2ee] border-b border-[#e3ddd4]">
          <div className="flex items-center justify-center space-x-2 text-[11px] font-mono text-[#8a7561] font-bold uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5 text-[#9d785e]" />
            <span>Point camera at the QR stand on your table</span>
          </div>
        </div>


        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar">
          {scannedSuccess ? (
            /* Success State */
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-[#9d785e]/15 text-[#9d785e] border-2 border-[#9d785e]/40 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#9d785e]/10 text-[#9d785e] text-[10px] font-mono font-bold tracking-widest uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>Table Verified</span>
                </div>
                <h4 className="font-serif-display font-bold text-2xl text-[#223134]">
                  Table {scannedSuccess} Connected!
                </h4>
                <p className="text-xs text-[#5f6c6e] max-w-xs mx-auto">
                  Opening your contactless menu now. All items will be freshly prepared and delivered to Table {scannedSuccess}.
                </p>
              </div>
            </div>
          ) : (
            /* Camera Mode */
            <div className="space-y-3.5">

              {cameraError ? (
                /* Camera Error State */
                <div className="p-4 sm:p-5 rounded-2xl bg-[#faf7f4] border border-[#e3ddd4] text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#223134]">
                      Camera Access Needed
                    </p>
                    <p className="text-[11px] text-[#5f6c6e] leading-relaxed">
                      {cameraError}
                    </p>
                  </div>
                  <div className="pt-1 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => startCamera()}
                      className="px-4 py-2 bg-[#9d785e] hover:bg-[#86644d] text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                </div>

              ) : (
                /* Active Viewfinder */
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-[#141b1d] aspect-[4/3] sm:aspect-video flex items-center justify-center border border-[#c9c1b5]/60 shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />

                    {/* Animated Golden Chai Reticle Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                      <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl relative border border-[#d4a373]/30 shadow-[0_0_24px_rgba(212,163,115,0.25)]">
                        {/* 4 Elegant Corner Brackets */}
                        <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-[#d4a373] rounded-tl-xl" />
                        <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-[#d4a373] rounded-tr-xl" />
                        <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-[#d4a373] rounded-bl-xl" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-[#d4a373] rounded-br-xl" />

                        {/* Animated Laser Scanning Beam */}
                        <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-[#d4a373] to-transparent shadow-[0_0_12px_rgba(212,163,115,0.9)] animate-qr-laser" />
                      </div>
                    </div>

                    {/* Floating Instruction Banner */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center pointer-events-none">
                      <div className="bg-[#141b1d]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-center shadow-lg flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#d4a373] animate-pulse" />
                        <span className="text-[11px] text-white font-medium">
                          Align table QR stand inside frame
                        </span>
                      </div>
                    </div>

                    {/* Viewfinder Controls: Flashlight & Camera Switch */}
                    <div className="absolute top-3 right-3 flex items-center space-x-2 z-10">
                      {hasTorch && (
                        <button
                          type="button"
                          onClick={handleToggleTorch}
                          className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer shadow-md ${
                            isTorchOn
                              ? 'bg-amber-400 text-slate-950 border-amber-300'
                              : 'bg-black/50 hover:bg-black/70 text-white border-white/15'
                          }`}
                          title="Toggle Flashlight"
                          aria-label="Toggle Flashlight"
                        >
                          {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer shadow-md"
                        title="Switch Camera (Front/Back)"
                        aria-label="Switch Camera"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TableQrScanModal;
