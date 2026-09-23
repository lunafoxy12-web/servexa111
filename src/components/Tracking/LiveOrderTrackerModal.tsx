import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';
import { DualDeviceTrackingMap } from './DualDeviceTrackingMap';
import {
  X,
  MapPin,
  Navigation,
  Compass,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  Gauge,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  KeyRound,
  Car,
  Smartphone,
  Layers,
  ChevronRight
} from 'lucide-react';

export const LiveOrderTrackerModal: React.FC = () => {
  const {
    activeTrackingBookingId,
    openLiveTracking,
    closeLiveTracking,
    initiateCall,
    openChat,
    openFileComplaint,
    currentUser,
    triggerGlobalRefresh
  } = useAuth();

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Live telemetry for both devices
  const [currentProviderCoords, setCurrentProviderCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.7833,
    lng: -122.4167
  });
  const [currentCustomerCoords, setCurrentCustomerCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.7749,
    lng: -122.4194
  });
  const [heading, setHeading] = useState(42);
  const [speedKmH, setSpeedKmH] = useState(38);
  const [etaMinutes, setEtaMinutes] = useState(6);
  const [distanceKm, setDistanceKm] = useState(1.8);
  const [isSimulatingTransit, setIsSimulatingTransit] = useState(true);
  const [isSharingDeviceGps, setIsSharingDeviceGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);

  // Close full screen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenMap) {
        setIsFullScreenMap(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenMap]);

  // PIN Verification State
  const [enteredPin, setEnteredPin] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinVerificationMsg, setPinVerificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // 1. Fetch all bookings to support multi-order tracking and switching
  const fetchAllBookings = useCallback(() => {
    fetch('/api/bookings')
      .then((res) => res.json())
      .then((bks: Booking[]) => {
        if (Array.isArray(bks)) {
          setAllBookings(bks);
          const found = bks.find((b) => b.id === activeTrackingBookingId);
          if (found) {
            setCurrentBooking(found);
          }
        }
      })
      .catch(console.error);
  }, [activeTrackingBookingId]);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  // 2. Fetch tracking telemetry for currently selected order
  useEffect(() => {
    if (!activeTrackingBookingId) return;

    setLoading(true);
    fetch(`/api/bookings/${activeTrackingBookingId}/tracking`)
      .then((res) => res.json())
      .then((data) => {
        if (data.providerLocation) {
          setCurrentProviderCoords({
            lat: Number(data.providerLocation.lat),
            lng: Number(data.providerLocation.lng)
          });
        }
        if (data.customerLocation) {
          setCurrentCustomerCoords({
            lat: Number(data.customerLocation.lat),
            lng: Number(data.customerLocation.lng)
          });
        }
        if (data.heading) setHeading(Number(data.heading));
        if (data.speedKmH) setSpeedKmH(Number(data.speedKmH));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Periodic sync across multiple devices & providers
    const interval = setInterval(() => {
      fetch(`/api/bookings/${activeTrackingBookingId}/tracking`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status && currentBooking?.status !== data.status) {
            setCurrentBooking((prev) => (prev ? { ...prev, status: data.status, deliveryVerified: data.deliveryVerified } : null));
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTrackingBookingId, currentBooking?.status]);

  // Calculate distance and ETA dynamically based on device coordinates
  useEffect(() => {
    const latDiff = (currentCustomerCoords.lat - currentProviderCoords.lat) * 111;
    const lngDiff = (currentCustomerCoords.lng - currentProviderCoords.lng) * 85;
    const dist = Math.max(0.05, Math.sqrt(latDiff * latDiff + lngDiff * lngDiff));
    setDistanceKm(parseFloat(dist.toFixed(2)));
    setEtaMinutes(Math.max(1, Math.round(dist * 3.2)));
  }, [currentCustomerCoords, currentProviderCoords]);

  // 3. Smooth Transit Simulation: advances specialist device towards customer destination
  useEffect(() => {
    if (!isSimulatingTransit || !activeTrackingBookingId) return;
    if (currentBooking?.status === 'completed' || currentBooking?.deliveryVerified) return;

    const interval = setInterval(() => {
      setCurrentProviderCoords((prev) => {
        const dLat = (currentCustomerCoords.lat - prev.lat) * 0.05;
        const dLng = (currentCustomerCoords.lng - prev.lng) * 0.05;

        // If very close, stop moving
        if (Math.abs(dLat) < 0.00005 && Math.abs(dLng) < 0.00005) {
          setSpeedKmH(0);
          return prev;
        }

        const nextLat = prev.lat + dLat;
        const nextLng = prev.lng + dLng;

        // Compute angle/heading towards customer
        const angleRad = Math.atan2(dLng, dLat);
        const deg = ((angleRad * 180) / Math.PI + 360) % 360;
        setHeading(Math.round(deg));
        setSpeedKmH(Math.round(32 + Math.sin(Date.now() / 1500) * 6));

        // Periodically sync live coordinates to backend
        fetch(`/api/bookings/${activeTrackingBookingId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'provider',
            lat: nextLat,
            lng: nextLng,
            speed: speedKmH,
            heading: Math.round(deg)
          })
        }).catch(() => {});

        return { lat: nextLat, lng: nextLng };
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [
    isSimulatingTransit,
    currentCustomerCoords,
    activeTrackingBookingId,
    speedKmH,
    currentBooking?.status,
    currentBooking?.deliveryVerified
  ]);

  // 4. Real Browser Device GPS Lock (navigator.geolocation)
  const handleToggleDeviceGps = () => {
    if (isSharingDeviceGps) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsSharingDeviceGps(false);
      setGpsStatusMessage('Device GPS broadcasting paused.');
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatusMessage('Geolocation not supported by device browser.');
      return;
    }

    setGpsStatusMessage('Acquiring high-precision device GPS lock...');
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading: dir } = pos.coords;
        setIsSharingDeviceGps(true);
        setGpsStatusMessage(
          `GPS Active: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`
        );

        if (currentUser?.role === 'provider') {
          setCurrentProviderCoords({ lat: latitude, lng: longitude });
        } else {
          setCurrentCustomerCoords({ lat: latitude, lng: longitude });
        }

        if (activeTrackingBookingId) {
          fetch(`/api/bookings/${activeTrackingBookingId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: currentUser?.role || 'customer',
              lat: latitude,
              lng: longitude,
              speed: speed ? Math.round(speed * 3.6) : undefined,
              heading: dir || undefined
            })
          }).catch(console.error);
        }
      },
      (err) => {
        setGpsStatusMessage(`GPS: ${err.message}. Using high-precision network coordinates.`);
        setIsSharingDeviceGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    watchIdRef.current = id;
  };

  // 5. Verify Handover PIN
  const handleVerifyDeliveryPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim() || !activeTrackingBookingId) return;

    setIsVerifyingPin(true);
    setPinVerificationMsg(null);

    try {
      const res = await fetch(`/api/bookings/${activeTrackingBookingId}/verify-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPin: enteredPin.trim(),
          actorRole: currentUser?.role || 'provider'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. PIN did not match.');
      }

      setPinVerificationMsg({
        type: 'success',
        text: 'Handover verified on exact user! Order completed successfully.'
      });
      if (data.booking) {
        setCurrentBooking(data.booking);
      }
      fetchAllBookings();
      triggerGlobalRefresh();
    } catch (err: any) {
      setPinVerificationMsg({
        type: 'error',
        text: err.message || 'Incorrect PIN. Ask the customer for their 4-digit code.'
      });
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const copyOrderId = () => {
    if (!activeTrackingBookingId) return;
    navigator.clipboard.writeText(activeTrackingBookingId);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  if (!activeTrackingBookingId) return null;

  // Filter relevant active orders for multi-order switcher
  const relevantOrders = allBookings.filter((b) => {
    if (currentUser?.role === 'provider') {
      return b.providerId === currentUser.id || ['accepted', 'on_the_way', 'arrived', 'in_progress', 'pending'].includes(b.status);
    }
    return b.customerId === currentUser?.id || ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(b.status);
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'on_the_way':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Specialist On The Way
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Service In Progress
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            Arrived on Site
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            Booking Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Service Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            Order Pending
          </span>
        );
    }
  };

  const currentStatus = currentBooking?.status || 'on_the_way';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Top Header: Order Number, Multi-Order Switcher & Close */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col gap-3 border-b border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold tracking-tight font-mono text-white">
                    Order #{activeTrackingBookingId}
                  </h2>
                  <button
                    type="button"
                    onClick={copyOrderId}
                    className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                    title="Copy Order ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedOrderId && (
                    <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {currentBooking?.serviceName || 'Active Service Dispatch'} • Provider: {currentBooking?.providerName || 'Specialist'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeLiveTracking}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Tracker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multi-Order Tabs Switcher (If multiple orders exist) */}
          {relevantOrders.length > 1 && (
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Active Orders ({relevantOrders.length}):
              </span>
              {relevantOrders.map((order) => {
                const isSelected = order.id === activeTrackingBookingId;
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => openLiveTracking(order.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <span>#{order.id}</span>
                    <span className="text-[10px] font-sans opacity-80 capitalize">({order.status.replace('_', ' ')})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status & Progression Timeline */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Current Status:</span>
            {getStatusBadge(currentStatus)}
          </div>

          {/* Linear Step Progression */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className={['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(currentStatus) ? 'text-indigo-600 dark:text-indigo-400 font-black' : ''}>
              1. Confirmed
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className={['on_the_way', 'arrived', 'in_progress', 'completed'].includes(currentStatus) ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>
              2. Dispatched
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className={['arrived', 'in_progress', 'completed'].includes(currentStatus) ? 'text-blue-600 dark:text-blue-400 font-black' : ''}>
              3. In Progress
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className={['completed'].includes(currentStatus) || currentBooking?.deliveryVerified ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>
              4. Completed
            </span>
          </div>
        </div>

        {/* Real-Time Tracking of Both Devices: Provider Device & Customer Device */}
        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Device 1: Provider Specialist Device */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs mt-0.5">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Provider Device ({currentBooking?.providerName || 'Specialist'})
                  </h4>
                </div>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
                  {currentProviderCoords.lat.toFixed(5)}, {currentProviderCoords.lng.toFixed(5)}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{speedKmH} km/h</span>
                  <span>•</span>
                  <span>Heading {heading}°</span>
                  <span>•</span>
                  <span>GPS Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Device 2: Customer Destination Device */}
          <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Customer Device ({currentBooking?.customerName || 'Alex Rivera'})
                  </h4>
                </div>
                <p className="text-[11px] font-mono text-blue-700 dark:text-blue-300 font-bold mt-0.5">
                  {currentCustomerCoords.lat.toFixed(5)}, {currentCustomerCoords.lng.toFixed(5)}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[180px]">
                    {currentBooking?.destinationLocation?.address || currentBooking?.pickupLocation?.address || 'Delivery Location'}
                  </span>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Destination Lock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Distance & ETA Metrics Ribbon */}
        <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-center">
          <div className="bg-white dark:bg-slate-900 p-2.5">
            <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Est. Arrival</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {etaMinutes} <span className="text-xs font-semibold text-slate-500">mins</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5">
            <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Distance Apart</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {distanceKm} <span className="text-xs font-semibold text-slate-500">km</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5">
            <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              <Gauge className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Current Transit</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {speedKmH} <span className="text-xs font-semibold text-slate-500">km/h</span>
            </p>
          </div>
        </div>

        {/* Stable, Glitch-Free Dual Device Map Canvas */}
        <div className="relative flex-1 min-h-[350px] bg-slate-950 overflow-hidden">
          <DualDeviceTrackingMap
            orderNumber={activeTrackingBookingId}
            providerCoords={currentProviderCoords}
            customerCoords={currentCustomerCoords}
            providerName={currentBooking?.providerName || 'Specialist'}
            customerName={currentBooking?.customerName || 'Customer'}
            serviceName={currentBooking?.serviceName || 'Service Dispatch'}
            speedKmH={speedKmH}
            heading={heading}
            status={currentStatus}
            customerAddress={currentBooking?.destinationLocation?.address || currentBooking?.pickupLocation?.address}
            className="w-full h-full min-h-[350px]"
            isFullScreen={false}
            onToggleFullScreen={() => setIsFullScreenMap(true)}
          />
        </div>

        {/* Full Screen Interactive Tracking Map Overlay */}
        {isFullScreenMap && (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col w-screen h-screen animate-in fade-in zoom-in-95 duration-200">
            <DualDeviceTrackingMap
              orderNumber={activeTrackingBookingId}
              providerCoords={currentProviderCoords}
              customerCoords={currentCustomerCoords}
              providerName={currentBooking?.providerName || 'Specialist'}
              customerName={currentBooking?.customerName || 'Customer'}
              serviceName={currentBooking?.serviceName || 'Service Dispatch'}
              speedKmH={speedKmH}
              heading={heading}
              status={currentStatus}
              customerAddress={currentBooking?.destinationLocation?.address || currentBooking?.pickupLocation?.address}
              className="w-full h-full flex-1"
              isFullScreen={true}
              onToggleFullScreen={() => setIsFullScreenMap(false)}
              onGoBack={() => setIsFullScreenMap(false)}
            />
          </div>
        )}

        {/* Real Device GPS Broadcast Bar */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleToggleDeviceGps}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              isSharingDeviceGps
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            {isSharingDeviceGps ? 'Device GPS Active (Transmitting Live)' : 'Broadcast My Live Device GPS'}
          </button>

          {gpsStatusMessage && (
            <span className="text-[11px] font-mono text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {gpsStatusMessage}
            </span>
          )}
        </div>

        {/* Handover PIN Verification Section */}
        {currentBooking?.deliveryVerified ? (
          <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="block font-extrabold">Handover Verified on Exact User</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-normal">
                  Order completed successfully with 4-digit security PIN.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-white font-mono text-xs font-bold">
              Verified PIN: {currentBooking.deliveryPin || '****'}
            </span>
          </div>
        ) : currentUser?.role === 'provider' ? (
          <div className="px-5 py-3 bg-amber-50/90 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-amber-950 dark:text-amber-200">Confirm Exact User Handover</h5>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Ask customer for their 4-digit handover PIN to confirm delivery and unlock payment
                </p>
                {pinVerificationMsg && (
                  <p className={`text-xs mt-1 font-semibold ${pinVerificationMsg.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {pinVerificationMsg.text}
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handleVerifyDeliveryPin} className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <input
                type="text"
                maxLength={4}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN"
                className="w-28 px-3 py-1.5 text-center font-mono font-bold text-sm bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={isVerifyingPin || enteredPin.length !== 4}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isVerifyingPin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Verify PIN
              </button>
            </form>
          </div>
        ) : (
          <div className="px-5 py-3 bg-indigo-50/90 dark:bg-indigo-950/40 border-t border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Exact User Handover Security PIN</h5>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                  Share this 4-digit PIN with the specialist upon arrival to confirm receipt
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-indigo-200 dark:border-indigo-700 shadow-xs shrink-0">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Your PIN:</span>
              <span className="font-mono text-base font-black text-indigo-950 dark:text-white tracking-widest bg-indigo-50 dark:bg-indigo-900/50 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-700">
                {currentBooking?.deliveryPin || '4920'}
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions: VoIP Call, Live Chat, Report Dispute */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {currentBooking?.providerName?.charAt(0) || 'P'}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {currentBooking?.providerName || 'Assigned Specialist'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Encrypted PBX channel • Order #{activeTrackingBookingId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                closeLiveTracking();
                openFileComplaint(activeTrackingBookingId);
              }}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Dispute</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeLiveTracking();
                openChat(activeTrackingBookingId);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentBooking) {
                  closeLiveTracking();
                  initiateCall(currentBooking.providerId, currentBooking.providerName, 'provider', currentBooking.id);
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>PBX Call</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
