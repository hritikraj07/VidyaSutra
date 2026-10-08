'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Compass,
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [studentCoords, setStudentCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied'
  >('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Acquire student device geolocation
  const requestStudentLocation = (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setLocationStatus('denied');
        setLocationError('Geolocation is not supported by your browser.');
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
          setLocationError(null);
          resolve(coords);
        },
        (err) => {
          console.warn('Student geolocation error:', err.message);
          setLocationStatus('denied');
          setLocationError('Device location permission required to verify physical classroom presence.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  // Initialize camera and location when modal opens
  useEffect(() => {
    if (!isQrScannerOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      return;
    }

    // Automatically prompt for location when scanner opens
    requestStudentLocation();

    let isMounted = true;
    async function startCamera() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access not supported by this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn('Camera preview not started:', err.message);
        setCameraError(null);
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isQrScannerOpen]);

  // BarcodeDetector interval scanner for live video
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !('BarcodeDetector' in window)) return;

    let detector: any;
    try {
      // @ts-expect-error BarcodeDetector browser API
      detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      return;
    }

    const interval = setInterval(async () => {
      if (!videoRef.current || isValidating || lastScanResult?.success) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          if (rawValue) {
            handleScanPayload(rawValue);
          }
        }
      } catch {
        // detection frame error
      }
    }, 400);

    return () => clearInterval(interval);
  }, [cameraActive, isValidating, lastScanResult]);

  if (!isQrScannerOpen) return null;

  const handleScanPayload = async (rawPayload: string, forcedLocation?: any) => {
    if (isValidating) return;
    setIsValidating(true);
    resetLastScanResult();

    try {
      let loc = forcedLocation || studentCoords;
      if (!loc) {
        loc = await requestStudentLocation();
      }

      let sessionId = activeSession?.id || activeSession?.sessionId || '';
      let token = rawPayload;

      try {
        const parsed = JSON.parse(rawPayload);
        if (parsed.sid) sessionId = parsed.sid;
        if (parsed.tok) token = parsed.tok;
      } catch {
        // Raw token string
      }

      await validateStudentScan(token, sessionId, rawPayload, loc || undefined);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSimulateActiveScan = async (testScenario: 'inside' | 'outside' = 'inside') => {
    let loc = studentCoords;
    if (testScenario === 'inside') {
      // If studentCoords not set, provide simulated within classroom coordinates (28.6139, 77.2090)
      if (!loc) {
        loc = { latitude: 28.6139, longitude: 77.2090, accuracy: 8 };
        setStudentCoords(loc);
      }
    } else {
      // Outside radius test: far away location (e.g. 500m away)
      loc = { latitude: 28.6200, longitude: 77.2150, accuracy: 12 };
    }

    if (!activeSession?.currentToken) {
      await validateStudentScan('VS-CS301-A1B2-C3D4', 'ses_demo', undefined, loc || undefined);
      return;
    }

    const payload =
      activeSession.qrPayload ||
      JSON.stringify({
        sid: activeSession.id || activeSession.sessionId,
        tok: activeSession.currentToken,
      });

    await handleScanPayload(payload, loc);
  };

  const handleExpiredTestScan = async () => {
    setIsValidating(true);
    resetLastScanResult();
    const loc = studentCoords || { latitude: 28.6139, longitude: 77.2090, accuracy: 8 };
    await validateStudentScan(
      'VS-CS301-EXPIRED-SCREENSHOT',
      activeSession?.id || activeSession?.sessionId || 'test_ses',
      undefined,
      loc
    );
    setIsValidating(false);
  };

  const handleClose = () => {
    resetLastScanResult();
    setIsQrScannerOpen(false);
  };

  return (
    <div className="vs-modal-backdrop" onClick={handleClose}>
      <div
        className="vs-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 20px 40px -10px rgba(23, 37, 84, 0.25)',
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
                width: '36px',
                height: '36px',
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
                Dynamic QR + Classroom GPS Verification
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

        {/* Location Status Badge */}
        {!lastScanResult?.success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: locationStatus === 'granted' ? '#ECFDF5' : '#F8FAFC',
              border: `1px solid ${locationStatus === 'granted' ? '#A7F3D0' : '#E2E8F0'}`,
              marginBottom: '12px',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin
                size={14}
                color={locationStatus === 'granted' ? '#166534' : '#64748B'}
              />
              <span
                style={{
                  fontWeight: 600,
                  color: locationStatus === 'granted' ? '#166534' : '#475569',
                }}
              >
                {locationStatus === 'granted'
                  ? 'Device Location Active (GPS Ready)'
                  : locationStatus === 'requesting'
                  ? 'Requesting Device Geolocation...'
                  : 'Classroom Location Verification'}
              </span>
            </div>

            {locationStatus !== 'granted' && (
              <button
                onClick={() => requestStudentLocation()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#243B7A',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Enable GPS
              </button>
            )}
          </div>
        )}

        {/* CAMERA / SCANNER VIEWPORT (When not yet successfully marked) */}
        {!lastScanResult?.success && (
          <div
            style={{
              position: 'relative',
              height: '240px',
              backgroundColor: '#0F172A',
              borderRadius: '18px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              border: '2px solid #1E293B',
            }}
          >
            {/* Live Video Feed */}
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
                display: cameraActive ? 'block' : 'none',
              }}
            />

            {/* Viewfinder Target Reticle Frame */}
            <div
              style={{
                width: '180px',
                height: '180px',
                border: '2px dashed rgba(255, 255, 255, 0.45)',
                borderRadius: '16px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              {/* Corner accent brackets */}
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  width: '18px',
                  height: '18px',
                  borderTop: '3px solid #E7A23B',
                  borderLeft: '3px solid #E7A23B',
                  borderTopLeftRadius: '6px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '18px',
                  height: '18px',
                  borderTop: '3px solid #E7A23B',
                  borderRight: '3px solid #E7A23B',
                  borderTopRightRadius: '6px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '-2px',
                  width: '18px',
                  height: '18px',
                  borderBottom: '3px solid #E7A23B',
                  borderLeft: '3px solid #E7A23B',
                  borderBottomLeftRadius: '6px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '18px',
                  height: '18px',
                  borderBottom: '3px solid #E7A23B',
                  borderRight: '3px solid #E7A23B',
                  borderBottomRightRadius: '6px',
                }}
              />

              {/* Animated Laser Scanning Line */}
              <div
                className="animate-scan-laser"
                style={{
                  position: 'absolute',
                  left: '6px',
                  right: '6px',
                  height: '2px',
                  backgroundColor: '#38BDF8',
                  boxShadow: '0 0 12px 2px #38BDF8',
                  borderRadius: '1px',
                }}
              />

              {!cameraActive && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                  <Camera size={26} style={{ margin: '0 auto 6px auto', display: 'block', opacity: 0.8 }} />
                  <span>Align Teacher&apos;s Live QR</span>
                </div>
              )}
            </div>

            {/* Dynamic Security Indicator Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: '#94A3B8',
                zIndex: 2,
              }}
            >
              <ShieldCheck size={14} color="#10B981" />
              <span>5s Rotating Window + Geofencing</span>
            </div>
          </div>
        )}

        {/* SUCCESS STATE FEEDBACK (Exact Format from Specification) */}
        {lastScanResult?.success && (
          <div
            style={{
              padding: '24px 20px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: '#F0FDF4',
              border: '2px solid #BBF7D0',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {/* Success Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#198754',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                boxShadow: '0 6px 16px rgba(25, 135, 84, 0.3)',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <div
              style={{
                fontSize: '1.3rem',
                fontWeight: 900,
                color: '#15803D',
                marginBottom: '14px',
                letterSpacing: '-0.02em',
              }}
            >
              ✓ Attendance Marked
            </div>

            {/* Receipt Summary Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                border: '1px solid #DCFCE7',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Subject:</span>
                <span style={{ fontWeight: 800, color: '#172554' }}>
                  {lastScanResult.details?.course || lastScanResult.subject || 'Data Structures'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Class:</span>
                <span style={{ fontWeight: 700, color: '#243B7A' }}>
                  {lastScanResult.details?.section || 'CSE-A'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Period:</span>
                <span style={{ fontWeight: 700, color: '#172554' }}>
                  {lastScanResult.details?.period || 'Period 1'}
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

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.86rem',
                  paddingTop: '6px',
                  borderTop: '1px dashed #E2E8F0',
                }}
              >
                <span style={{ color: '#64748B', fontWeight: 600 }}>Verification:</span>
                <span
                  style={{
                    fontWeight: 800,
                    color: '#166534',
                    backgroundColor: '#DCFCE7',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                  }}
                >
                  QR + Location
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: '#4B5563',
                display: 'flex',
                justifyContent: 'space-around',
              }}
            >
              <span>Teacher: <strong>{lastScanResult.details?.teacher || 'Dr. Verma'}</strong></span>
              <span>Student: <strong>{lastScanResult.details?.student || currentUser?.name || 'Student'}</strong></span>
            </div>
          </div>
        )}

        {/* ERROR / REJECTION FEEDBACK */}
        {lastScanResult && !lastScanResult.success && (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: lastScanResult.duplicate ? '#FFFBEB' : '#FEF2F2',
              border: `1px solid ${lastScanResult.duplicate ? '#FDE68A' : '#FECACA'}`,
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: lastScanResult.duplicate ? '#D97706' : '#DC2626',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <h3
              style={{
                fontSize: '0.98rem',
                fontWeight: 800,
                color: lastScanResult.duplicate ? '#B45309' : '#B91C1C',
                marginBottom: '4px',
              }}
            >
              {lastScanResult.duplicate ? 'Already Marked' : 'Attendance Rejected'}
            </h3>
            <p
              style={{
                fontSize: '0.84rem',
                color: lastScanResult.duplicate ? '#92400E' : '#991B1B',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {lastScanResult.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!lastScanResult?.success ? (
            <>
              {/* Primary Scan Button */}
              <button
                onClick={() => handleSimulateActiveScan('inside')}
                disabled={isValidating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#243B7A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: isValidating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(36, 59, 122, 0.25)',
                }}
              >
                {isValidating ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Verifying QR & Geolocation...</span>
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    <span>Scan Classroom QR</span>
                  </>
                )}
              </button>

              {/* Edge-case simulation testing buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={handleExpiredTestScan}
                  disabled={isValidating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    border: '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: isValidating ? 'not-allowed' : 'pointer',
                  }}
                  title="Test expired QR rejection"
                >
                  <RotateCcw size={13} />
                  <span>Test Expired QR</span>
                </button>

                <button
                  onClick={() => handleSimulateActiveScan('outside')}
                  disabled={isValidating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    border: '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: isValidating ? 'not-allowed' : 'pointer',
                  }}
                  title="Test out-of-radius student rejection"
                >
                  <Compass size={13} />
                  <span>Test Outside Area</span>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#243B7A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Back to Portal</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
