import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Crosshair, Loader2 } from 'lucide-react';

interface GoogleDeliveryMapProps {
  lat: number;
  lng: number;
  onLocationChange?: (lat: number, lng: number) => void;
  address?: string;
  accuracy?: string;
  statusText?: string;
  isLocating?: boolean;
  onLocateGps?: () => void;
  heightClass?: string;
}

export const GoogleDeliveryMap: React.FC<GoogleDeliveryMapProps> = ({
  lat,
  lng,
  onLocationChange,
  address,
  accuracy,
  statusText,
  isLocating,
  onLocateGps,
  heightClass = 'h-48'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // CartoDB Voyager tiles - ultra high performance, reliable, zero billing required
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Custom Interactive Pin
    const customPinIcon = L.divIcon({
      className: 'delivery-custom-marker',
      html: `
        <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -100%);">
          <div class="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold font-sans shadow-md border border-slate-700 whitespace-nowrap mb-1">
            ${address ? address.split(',')[0] : 'Delivery Pin'}
          </div>
          <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    const marker = L.marker([lat, lng], {
      icon: customPinIcon,
      draggable: !!onLocationChange
    }).addTo(map);

    if (onLocationChange) {
      marker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        onLocationChange(newLatLng.lat, newLatLng.lng);
      });

      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        onLocationChange(clickLat, clickLng);
      });
    }

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, []);

  // Update center and marker on external prop change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerInstanceRef.current) return;
    markerInstanceRef.current.setLatLng([lat, lng]);
    mapInstanceRef.current.panTo([lat, lng], { animate: true });
  }, [lat, lng]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 shadow-xs relative">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Real-time GPS Coordinate & Telemetry Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-white text-[11px] font-mono shadow-md border border-white/10 flex items-center gap-1.5 pointer-events-auto">
          <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="font-bold">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
          {accuracy && <span className="text-slate-400 text-[10px]">({accuracy})</span>}
        </div>

        {onLocateGps && (
          <button
            type="button"
            onClick={onLocateGps}
            disabled={isLocating}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3 py-1 rounded-xl text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 pointer-events-auto cursor-pointer"
            title="Recalculate Real-Time Device GPS"
          >
            {isLocating ? (
              <Loader2 className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Crosshair className="w-3 h-3 text-amber-300" />
            )}
            <span>GPS Lock</span>
          </button>
        )}
      </div>

      {statusText && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-slate-200 text-[10px] font-mono shadow-xs border border-white/10 truncate z-10">
          {statusText}
        </div>
      )}
    </div>
  );
};
