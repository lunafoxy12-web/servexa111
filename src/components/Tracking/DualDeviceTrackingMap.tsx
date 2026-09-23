import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Maximize2,
  Minimize2,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Car,
  Compass,
  ArrowLeft,
  Layers,
  Globe
} from 'lucide-react';

interface DualDeviceTrackingMapProps {
  orderNumber: string;
  providerCoords: { lat: number; lng: number };
  customerCoords: { lat: number; lng: number };
  providerName?: string;
  customerName?: string;
  serviceName?: string;
  speedKmH?: number;
  heading?: number;
  status?: string;
  customerAddress?: string;
  className?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onGoBack?: () => void;
}

export const DualDeviceTrackingMap: React.FC<DualDeviceTrackingMapProps> = ({
  orderNumber,
  providerCoords,
  customerCoords,
  providerName = 'Specialist / Driver',
  customerName = 'Customer',
  serviceName = 'Active Dispatch',
  speedKmH = 0,
  heading = 45,
  status = 'on_the_way',
  customerAddress,
  className = 'h-[380px] w-full',
  isFullScreen = false,
  onToggleFullScreen,
  onGoBack
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const providerMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [mapMode, setMapMode] = useState<'vector' | 'google'>('vector');

  // Helper to construct custom HTML for Provider Marker (Device 1)
  const createProviderIconHtml = (deg: number, speed: number, name: string) => {
    return `
      <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -50%);">
        <!-- Live Telemetry Pill -->
        <div class="mb-1 px-2 py-0.5 rounded-full bg-slate-900/95 text-white text-[10px] font-bold font-mono shadow-md border border-emerald-500/40 whitespace-nowrap flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>${name.split(' ')[0]}</span>
          <span class="text-emerald-300 font-bold">${speed}km/h</span>
        </div>
        <!-- Outer Beacon Ripple -->
        <div class="relative w-10 h-10 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping"></div>
          <div class="w-9 h-9 rounded-2xl bg-emerald-600 text-white shadow-lg border-2 border-white flex items-center justify-center transform transition-transform duration-300" style="transform: rotate(${deg}deg);">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  };

  // Helper to construct custom HTML for Customer Marker (Device 2)
  const createCustomerIconHtml = (name: string) => {
    return `
      <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -50%);">
        <!-- Destination Label -->
        <div class="mb-1 px-2 py-0.5 rounded-full bg-slate-900/95 text-white text-[10px] font-bold font-mono shadow-md border border-blue-500/40 whitespace-nowrap flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          <span>Destination (${name.split(' ')[0]})</span>
        </div>
        <!-- Outer Beacon -->
        <div class="relative w-9 h-9 flex items-center justify-center">
          <div class="w-9 h-9 rounded-2xl bg-blue-600 text-white shadow-lg border-2 border-white flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>
    `;
  };

  // 1. Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [
        (providerCoords.lat + customerCoords.lat) / 2,
        (providerCoords.lng + customerCoords.lng) / 2
      ],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // High quality Voyager tiles by CartoDB (crisp, modern, zero billing errors)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Initial Provider Icon & Marker
    const providerIcon = L.divIcon({
      className: 'provider-leaflet-pin',
      html: createProviderIconHtml(heading, speedKmH, providerName),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const providerMarker = L.marker([providerCoords.lat, providerCoords.lng], {
      icon: providerIcon,
      zIndexOffset: 1000
    }).addTo(map);

    // Initial Customer Icon & Marker
    const customerIcon = L.divIcon({
      className: 'customer-leaflet-pin',
      html: createCustomerIconHtml(customerName),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const customerMarker = L.marker([customerCoords.lat, customerCoords.lng], {
      icon: customerIcon,
      zIndexOffset: 900
    }).addTo(map);

    // Initial Polyline route between both devices
    const polyline = L.polyline(
      [
        [providerCoords.lat, providerCoords.lng],
        [customerCoords.lat, customerCoords.lng]
      ],
      {
        color: '#4f46e5', // indigo-600
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }
    ).addTo(map);

    // Fit bounds to show both devices with generous padding
    const bounds = L.latLngBounds([
      [providerCoords.lat, providerCoords.lng],
      [customerCoords.lat, customerCoords.lng]
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

    // Track user pan/zoom so we don't forcefully yank the camera while they are inspecting
    map.on('dragstart', () => setUserInteracted(true));

    mapRef.current = map;
    providerMarkerRef.current = providerMarker;
    customerMarkerRef.current = customerMarker;
    polylineRef.current = polyline;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      providerMarkerRef.current = null;
      customerMarkerRef.current = null;
      polylineRef.current = null;
    };
  }, []);

  // 2. Smoothly update markers & polyline when coordinates, speed, or heading change
  useEffect(() => {
    if (!mapRef.current || !providerMarkerRef.current || !customerMarkerRef.current || !polylineRef.current) {
      return;
    }

    // Update Provider Marker position and HTML
    providerMarkerRef.current.setLatLng([providerCoords.lat, providerCoords.lng]);
    const updatedProviderIcon = L.divIcon({
      className: 'provider-leaflet-pin',
      html: createProviderIconHtml(heading, speedKmH, providerName),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    providerMarkerRef.current.setIcon(updatedProviderIcon);

    // Update Customer Marker position and HTML
    customerMarkerRef.current.setLatLng([customerCoords.lat, customerCoords.lng]);
    const updatedCustomerIcon = L.divIcon({
      className: 'customer-leaflet-pin',
      html: createCustomerIconHtml(customerName),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    customerMarkerRef.current.setIcon(updatedCustomerIcon);

    // Update Polyline
    polylineRef.current.setLatLngs([
      [providerCoords.lat, providerCoords.lng],
      [customerCoords.lat, customerCoords.lng]
    ]);

    // If user has not manually panned away, smoothly pan to keep provider visible
    if (!userInteracted && mapRef.current) {
      const bounds = L.latLngBounds([
        [providerCoords.lat, providerCoords.lng],
        [customerCoords.lat, customerCoords.lng]
      ]);
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
    }
  }, [
    providerCoords.lat,
    providerCoords.lng,
    customerCoords.lat,
    customerCoords.lng,
    heading,
    speedKmH,
    providerName,
    customerName,
    userInteracted
  ]);

  // Handle Resize & Fullscreen transitions
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen, mapMode]);

  // Controls Handlers
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleFitBounds = () => {
    if (!mapRef.current) return;
    setUserInteracted(false);
    const bounds = L.latLngBounds([
      [providerCoords.lat, providerCoords.lng],
      [customerCoords.lat, customerCoords.lng]
    ]);
    mapRef.current.fitBounds(bounds, { padding: [70, 70], maxZoom: 16, animate: true });
  };

  const handleCenterProvider = () => {
    if (!mapRef.current) return;
    mapRef.current.panTo([providerCoords.lat, providerCoords.lng], { animate: true });
  };

  const handleCenterCustomer = () => {
    if (!mapRef.current) return;
    mapRef.current.panTo([customerCoords.lat, customerCoords.lng], { animate: true });
  };

  const handleOpenGoogleDirections = () => {
    const origin = `${providerCoords.lat.toFixed(6)},${providerCoords.lng.toFixed(6)}`;
    const destination = `${customerCoords.lat.toFixed(6)},${customerCoords.lng.toFixed(6)}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Google Maps Directions Embed URL (guaranteed billing-free, interactive real-time route view)
  const googleMapsEmbedUrl = `https://maps.google.com/maps?saddr=${providerCoords.lat.toFixed(6)},${providerCoords.lng.toFixed(6)}&daddr=${customerCoords.lat.toFixed(6)},${customerCoords.lng.toFixed(6)}&output=embed`;

  return (
    <div className={`relative bg-slate-950 overflow-hidden select-none ${className}`}>
      {/* Map Content View: Vector Radar or Google Maps */}
      {mapMode === 'google' ? (
        <div className="w-full h-full relative z-0 bg-slate-900">
          <iframe
            title={`Google Maps Live Route #${orderNumber}`}
            src={googleMapsEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
      ) : (
        /* Map DOM mount element for Leaflet */
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      )}

      {/* Floating Header Overlay: Order Number, Controls & Mode Toggle */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Go Back / Exit Fullscreen if active */}
          {(isFullScreen || onGoBack) && (
            <button
              type="button"
              onClick={onGoBack || onToggleFullScreen}
              className="px-3 py-1.5 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-white shadow-xl border border-slate-700/80 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              title="Go Back / Exit Full Screen"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>
          )}

          <div className="bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white shadow-xl border border-slate-700/80 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-extrabold text-indigo-300">
              Order #{orderNumber}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-200">
              {serviceName}
            </span>
          </div>
        </div>

        {/* Map Control Buttons: Style Switcher & Full Screen */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Switcher: Google Maps vs Vector Live Radar */}
          <div className="flex items-center rounded-2xl p-0.5 bg-slate-900/95 border border-slate-700/80 shadow-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMapMode('vector')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                mapMode === 'vector'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Live Telemetry Vector Radar Map"
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">Radar</span> Map
            </button>
            <button
              type="button"
              onClick={() => setMapMode('google')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                mapMode === 'google'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Interactive Google Maps View"
            >
              <Globe className="w-3 h-3" />
              <span>Google Maps</span>
            </button>
          </div>

          {/* Full Screen Toggle Button */}
          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className={`p-2 rounded-xl shadow-lg border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isFullScreen
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700'
              }`}
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Map'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
            </button>
          )}

          {mapMode === 'vector' && (
            <>
              <button
                type="button"
                onClick={handleFitBounds}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl shadow-lg border border-slate-700 transition-all cursor-pointer"
                title="Fit Both Devices in View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <div className="flex flex-col rounded-xl overflow-hidden bg-slate-900/90 border border-slate-700 shadow-lg">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 border-t border-slate-700 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Real-Time Live Devices Coordinates Bar (Bottom) */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Device Coordinate Badges */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleCenterProvider}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900/90 text-emerald-300 text-xs font-mono border border-emerald-600/80 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Click to Center on Specialist Device"
          >
            <Car className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">Provider:</span>
            <span>{providerCoords.lat.toFixed(5)}, {providerCoords.lng.toFixed(5)}</span>
            <span className="text-[10px] font-bold text-emerald-400">({speedKmH} km/h)</span>
          </button>

          <button
            type="button"
            onClick={handleCenterCustomer}
            className="px-3 py-1.5 rounded-xl bg-blue-950/90 hover:bg-blue-900/90 text-blue-300 text-xs font-mono border border-blue-600/80 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Click to Center on Customer Destination Device"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold">Customer:</span>
            <span>{customerCoords.lat.toFixed(5)}, {customerCoords.lng.toFixed(5)}</span>
          </button>
        </div>

        {/* Turn-by-Turn Navigation External Google Maps link */}
        <button
          type="button"
          onClick={handleOpenGoogleDirections}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all pointer-events-auto cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Google Maps App</span>
        </button>
      </div>
    </div>
  );
};
