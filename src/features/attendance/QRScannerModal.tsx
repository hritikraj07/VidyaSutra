'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { useApp } from '@/context/AppContext';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Camera,
  ArrowRight,
  RefreshCw,
  MapPin,
  Lock,
  Keyboard,
} from 'lucide-react';

export const QRScannerModal: React.FC = () => {
  const {
    isQrScannerOpen,
    setIsQrScannerOpen,
    activeSession,
    validateStudentScan,
    lastScanResult,
    resetLastScanResult,
    currentUser,
  } = useApp();

  const [isValidating, setIsValidating] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const [studentCoords, setStudentCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied'
  >('idle');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingScanRef = useRef(false);

  // Optional Geolocation request
  const requestStudentLocation = useCallback((): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setLocationStatus('denied');
        resolve(null);
        return;
      }

      setLocationStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
          };
          setStudentCoords(coords);
          setLocationStatus('granted');
          resolve(coords);
        },
        (err) => {
          console.warn('Geolocation notice:', err.message);
          setLocationStatus('denied');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    });
  }, []);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraActive(false);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by this browser.');
      return;
    }

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Try environment/rear camera first, fallback to any available camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission is required to scan attendance. Please enable camera access in your browser or device settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera detected on this device. You can enter the session code manually below.');
        setShowManualInput(true);
      } else {
        setCameraError('Unable to access camera: ' + (err.message || 'Please check device permissions.'));
      }
      setCameraActive(false);
    }
  }, []);

  // Manage Camera & Geolocation when modal opens/closes
  useEffect(() => {
    if (!isQrScannerOpen) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setCameraError(null);
      resetLastScanResult();
      return;
    }

    requestStudentLocation();
    startCamera();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isQrScannerOpen, startCamera, requestStudentLocation, resetLastScanResult]);

  const handleScanAgain = useCallback(() => {
    isProcessingScanRef.current = false;
    setIsProcessingScan(false);
    resetLastScanResult();
    startCamera();
  }, [resetLastScanResult, startCamera]);

  // Main Handle Scan Payload
  const handleScanPayload = useCallback(
    async (rawPayload: string) => {
      if (isValidating) return;
      setIsValidating(true);
      setIsProcessingScan(true);
      resetLastScanResult();

      try {
        let loc = studentCoords;
        if (!loc && locationStatus === 'idle') {
          loc = await requestStudentLocation();
        }

        let sessionId = '';
        let token = rawPayload.trim();

        // 1. Check if JSON payload: { sid: "...", tok: "..." }
        if (token.startsWith('{') && token.endsWith('}')) {
          try {
            const parsed = JSON.parse(token);
            if (parsed.sid) sessionId = parsed.sid;
            if (parsed.sessionId) sessionId = parsed.sessionId;
            if (parsed.tok) token = parsed.tok;
            if (parsed.token) token = parsed.token;
            if (parsed.sessionToken) token = parsed.sessionToken;
            if (parsed.session) {
              if (!token || token.startsWith('{')) token = parsed.session;
              if (!sessionId) sessionId = parsed.session;
            }
          } catch {}
        }
        // 2. Check if URL payload: https://.../attendance/scan?sid=...&token=...
        else if (token.includes('?') || token.includes('/attendance/scan') || token.startsWith('http')) {
          try {
            let urlObj: URL | null = null;
            try {
              urlObj = new URL(token);
            } catch {
              urlObj = new URL(`http://localhost${token.startsWith('/') ? '' : '/'}${token}`);
            }
            if (urlObj) {
              const uSid = urlObj.searchParams.get('sid') || urlObj.searchParams.get('session_id') || urlObj.searchParams.get('session');
              const uTok = urlObj.searchParams.get('token') || urlObj.searchParams.get('tok') || urlObj.searchParams.get('sessionToken') || urlObj.searchParams.get('session');
              if (uSid) sessionId = uSid;
              if (uTok) token = uTok;
            }
          } catch {}
        }

        // 3. Fallback: if sessionId missing, use activeSession if available
        if (!sessionId && (activeSession?.id || activeSession?.sessionId)) {
          sessionId = activeSession.id || activeSession.sessionId;
        }

        await validateStudentScan(token, sessionId, rawPayload, loc || undefined);
      } finally {
        setIsValidating(false);
      }
    },
    [isValidating, resetLastScanResult, studentCoords, locationStatus, requestStudentLocation, activeSession, validateStudentScan]
  );

  // Real-time jsQR video frame decoding loop
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current || !isQrScannerOpen || lastScanResult?.success) {
      return;
    }

    let isScanning = true;

    const scanLoop = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current || isProcessingScanRef.current) return;
      const video = videoRef.current;

      if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qrCode && qrCode.data && qrCode.data.trim().length > 0) {
            if (isProcessingScanRef.current) return;
            isProcessingScanRef.current = true;
            setIsProcessingScan(true);
            isScanning = false;

            // 1. Immediately stop camera stream and animation frame
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
            setCameraActive(false);

            // 2. Dispatch payload to backend
            handleScanPayload(qrCode.data.trim());
            return;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanLoop);
    };

    animationFrameRef.current = requestAnimationFrame(scanLoop);

    return () => {
      isScanning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [cameraActive, isQrScannerOpen, lastScanResult, handleScanPayload]);

  if (!isQrScannerOpen) return null;

  const handleClose = () => {
    isProcessingScanRef.current = false;
    setIsProcessingScan(false);
    setIsQrScannerOpen(false);
    resetLastScanResult();
    setShowManualInput(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleScanPayload(manualCode.trim());
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Hidden processing canvas for jsQR frame decoding */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div
        className="vs-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          borderRadius: '20px',
          position: 'relative',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(36, 59, 122, 0.1)',
                color: '#243B7A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Scan Attendance
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                Point camera at faculty&apos;s live QR code
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. SUCCESS CONFIRMATION SCREEN */}
        {lastScanResult?.success && (
          <div
            style={{
              padding: '22px 18px',
              borderRadius: '16px',
              backgroundColor: '#F0FDF4',
              border: '2px solid #BBF7D0',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#15803D',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 6px 16px rgba(21, 128, 61, 0.3)',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#15803D',
                marginBottom: '4px',
                letterSpacing: '-0.02em',
              }}
            >
              ✓ ATTENDANCE MARKED
            </div>
            <p style={{ fontSize: '0.82rem', color: '#166534', margin: '0 0 16px', fontWeight: 600 }}>
              You&apos;re marked present for:
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #DCFCE7',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Subject:</span>
                <span style={{ fontWeight: 800, color: '#172554' }}>
                  {lastScanResult.details?.course || lastScanResult.subject || 'Data Structures'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Faculty:</span>
                <span style={{ fontWeight: 700, color: '#172554' }}>
                  {lastScanResult.details?.teacher || 'Dr. Ramesh Verma'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Time:</span>
                <span style={{ fontWeight: 700, color: '#15803D' }}>
                  {lastScanResult.details?.markedAt
                    ? new Date(lastScanResult.details.markedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Status:</span>
                <span
                  style={{
                    fontWeight: 800,
                    color: '#15803D',
                    backgroundColor: '#DCFCE7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                  }}
                >
                  PRESENT
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '12px 18px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(36, 59, 122, 0.25)',
              }}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* 2. ERROR FEEDBACK */}
        {lastScanResult && !lastScanResult.success && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: lastScanResult.duplicate ? '#FFFBEB' : '#FEF2F2',
              border: `1px solid ${lastScanResult.duplicate ? '#FDE68A' : '#FECACA'}`,
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: lastScanResult.duplicate ? '#D97706' : '#DC2626',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3
              style={{
                fontSize: '0.96rem',
                fontWeight: 800,
                color: lastScanResult.duplicate ? '#B45309' : '#B91C1C',
                marginBottom: '4px',
              }}
            >
              {lastScanResult.duplicate ? 'Attendance Already Marked' : 'Attendance Not Marked'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: lastScanResult.duplicate ? '#92400E' : '#991B1B', margin: 0, lineHeight: 1.4 }}>
              {lastScanResult.message}
            </p>
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleScanAgain}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#243B7A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={14} />
                <span>Scan Again</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. LIVE CAMERA VIEWPORT (When not yet successful) */}
        {!lastScanResult?.success && (
          <>
            {/* Camera Permission / Error Warning */}
            {cameraError && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  marginBottom: '14px',
                  textAlign: 'center',
                }}
              >
                <AlertTriangle size={24} color="#DC2626" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#B91C1C', marginBottom: '4px' }}>
                  Camera Permission Required
                </div>
                <p style={{ fontSize: '0.78rem', color: '#991B1B', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {cameraError}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={startCamera}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#243B7A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Retry Camera Access
                  </button>
                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#F1F5F9',
                      color: '#172554',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {showManualInput ? 'Hide Code Input' : 'Enter Code Manually'}
                  </button>
                </div>
              </div>
            )}

            {/* Video Viewport */}
            {!cameraError && (
              <div
                style={{
                  position: 'relative',
                  height: '240px',
                  backgroundColor: '#0F172A',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  border: '2px solid #1E293B',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Reticle Aiming Frame */}
                <div
                  style={{
                    width: '180px',
                    height: '180px',
                    border: '2px dashed rgba(255, 255, 255, 0.45)',
                    borderRadius: '16px',
                    position: 'relative',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                >
                  {/* Corner accents */}
                  <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '3px solid #E7A23B', borderLeft: '3px solid #E7A23B', borderTopLeftRadius: '6px' }} />
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '3px solid #E7A23B', borderRight: '3px solid #E7A23B', borderTopRightRadius: '6px' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '3px solid #E7A23B', borderLeft: '3px solid #E7A23B', borderBottomLeftRadius: '6px' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '3px solid #E7A23B', borderRight: '3px solid #E7A23B', borderBottomRightRadius: '6px' }} />

                  {/* Scanning sweep beam */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '8px',
                      right: '8px',
                      height: '2px',
                      backgroundColor: '#38BDF8',
                      boxShadow: '0 0 8px #38BDF8',
                      animation: 'scanSweep 2s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Live Scanning Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    color: '#F8FAFC',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    zIndex: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                  <span>Align QR inside frame</span>
                </div>
              </div>
            )}

            {/* Validation Spinner Overlay */}
            {(isValidating || isProcessingScan) && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '10px',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                  color: '#1D4ED8',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #BFDBFE',
                    borderTopColor: '#1D4ED8',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                <span>Verifying attendance...</span>
              </div>
            )}

            {/* Toggle Manual Entry */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setShowManualInput(!showManualInput)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#243B7A',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Keyboard size={14} />
                <span>{showManualInput ? 'Hide manual code entry' : 'Trouble scanning? Enter code manually'}</span>
              </button>
            </div>

            {/* Manual Code Input Form */}
            {showManualInput && (
              <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="e.g. VS-CS301-A1B2-C3D4 or scan link"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  type="submit"
                  disabled={isValidating || !manualCode.trim()}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#243B7A',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Verify
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes scanSweep {
          0% { top: 10px; }
          50% { top: 168px; }
          100% { top: 10px; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
