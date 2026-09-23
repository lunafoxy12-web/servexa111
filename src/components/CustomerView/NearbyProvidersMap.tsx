import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Crosshair,
  Star,
  ShieldCheck,
  Clock,
  PhoneCall,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers
} from 'lucide-react';
import { ProviderProfile, ServiceItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NearbyProvidersMapProps {
  providers: ProviderProfile[];
  onOpenBookingModal: (provider: ProviderProfile, service: ServiceItem) => void;
}

export const NearbyProvidersMap: React.FC<NearbyProvidersMapProps> = ({
  providers,
  onOpenBookingModal
}) => {
  const { openProviderProfile, initiateCall, openChat } = useAuth();

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.7749,
    lng: -122.4194
  });
  const [isLocating, setIsLocating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('Detecting GPS location...');

  // Auto acquire real-time user location
  const locateUser = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by this browser. Using San Francisco.');
      return;
    }

    setIsLocating(true);
    setGpsStatus('Acquiring real-time GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setGpsStatus(`Live GPS locked: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (err) => {
        console.warn('Geolocation error in NearbyProvidersMap:', err);
        setIsLocating(false);
        setGpsStatus('Location access denied or unavailable. Centered on San Francisco.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  // Compute calculated relative offsets around userCoords for visual markers
  const providersWithCalculatedCoords = providers.map((p, idx) => {
    // Generate deterministic nearby offsets around user position if no exact GPS is on record
    const angle = (idx * (360 / Math.max(1, providers.length))) * (Math.PI / 180);
    const radius = 0.015 + (idx % 3) * 0.008; // ~1-3 km
    const lat = p.currentLocation?.lat ?? (userCoords.lat + Math.sin(angle) * radius);
    const lng = p.currentLocation?.lng ?? (userCoords.lng + Math.cos(angle) * radius);

    // approximate distance
    const distKm = Math.sqrt(Math.pow(lat - userCoords.lat, 2) + Math.pow(lng - userCoords.lng, 2)) * 111;

    return {
      ...p,
      mapLat: lat,
      mapLng: lng,
      distanceKm: Math.max(0.4, Math.round(distKm * 10) / 10),
      etaMins: Math.max(5, Math.round(distKm * 3.5))
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs mb-8 transition-colors">
      {/* Top Map Action Bar */}
      <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Navigation className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Nearby Verified Service Providers
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Google Maps Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
            {gpsStatus}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={locateUser}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>Recenter My GPS</span>
          </button>
          <a
            href={`https://www.google.com/maps/search/services/@${userCoords.lat},${userCoords.lng},14z`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Grid: Google Maps View & Interactive Provider Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
        {/* Map Container */}
        <div className="lg:col-span-8 relative bg-slate-900 min-h-[380px] lg:min-h-[460px] overflow-hidden">
          {/* Live Google Maps Embed centered on real user GPS */}
          <iframe
            title="Nearby Providers Live Google Map"
            width="100%"
            height="100%"
            className="w-full h-full border-0 absolute inset-0 opacity-90 contrast-[1.05]"
            loading="lazy"
            src={`https://maps.google.com/maps?q=${userCoords.lat},${userCoords.lng}&hl=en&z=14&output=embed`}
          />

          {/* Real-time GPS beacon floating badge */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <span>Your Live Location: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-950/85 backdrop-blur-md border border-emerald-700 text-emerald-300 text-[11px] font-semibold">
              {providersWithCalculatedCoords.length} verified specialists active in dispatch radius
            </div>
          </div>

          {/* Floating Markers list overlay over map bottom */}
          <div className="absolute bottom-3 left-3 right-3 z-20 overflow-x-auto pb-1 flex gap-2 scrollbar-none pointer-events-auto">
            {providersWithCalculatedCoords.slice(0, 5).map((p) => {
              const isSelected = selectedProvider?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p)}
                  className={`shrink-0 p-2.5 rounded-2xl backdrop-blur-md border text-left transition-all cursor-pointer shadow-lg flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-white/50 scale-102'
                      : 'bg-slate-950/85 hover:bg-slate-900 text-white border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt={p.businessName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/30 shrink-0"
                  />
                  <div className="min-w-[120px]">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold truncate max-w-[130px]">{p.businessName}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <span className="flex items-center text-amber-300 font-bold">
                        ★ {p.rating}
                      </span>
                      <span>•</span>
                      <span>{p.distanceKm} km</span>
                      <span>•</span>
                      <span className="text-emerald-300">{p.etaMins}m ETA</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Provider Details & Dispatch Rail */}
        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          {selectedProvider ? (
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl ring-2 ring-indigo-500/20 overflow-hidden shrink-0 shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                      alt={selectedProvider.businessName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {selectedProvider.businessName}
                      </h4>
                      {selectedProvider.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      @{selectedProvider.handle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {selectedProvider.rating}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {selectedProvider.completedJobs} jobs done
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <span className="text-[10px] text-slate-400 block">Proximity Distance</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    ~{(selectedProvider as any).distanceKm || 1.8} km away
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <span className="text-[10px] text-slate-400 block">Rapid Dispatch ETA</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ~{(selectedProvider as any).etaMins || 8} minutes
                  </span>
                </div>
              </div>

              {/* Service list preview */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Popular Services Available Now:
                </p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {selectedProvider.services.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {srv.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {srv.durationMins ? `${srv.durationMins} mins` : 'Instant dispatch'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          ${srv.price}
                        </span>
                        <button
                          onClick={() => onOpenBookingModal(selectedProvider, srv)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <MapPin className="w-10 h-10 mx-auto text-indigo-400 mb-2 opacity-50" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select a Pin or Specialist
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] mx-auto">
                Click any nearby specialist on the map or bottom carousel to inspect live credentials and instant dispatch rates.
              </p>
            </div>
          )}

          {selectedProvider && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => openProviderProfile(selectedProvider.id)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Full Profile
              </button>
              <button
                onClick={() => initiateCall(selectedProvider.userId, selectedProvider.businessName, 'voice')}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                title="PBX Call Provider"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
              <button
                onClick={() => openChat(selectedProvider.id)}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                title="Chat with Provider"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
