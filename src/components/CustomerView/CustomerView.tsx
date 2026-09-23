import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProviderProfile, ServiceCategory, Booking, ServiceItem } from '../../types';
import {
  Search,
  Star,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  MapPin,
  Car,
  Package,
  Wrench,
  Zap,
  Sparkles,
  SlidersHorizontal,
  Navigation,
  Clock,
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  AlertTriangle,
  Utensils,
  Stethoscope,
  Store,
  X,
  Wallet
} from 'lucide-react';
import { CategoryCards } from './CategoryCards';
import { ProviderStoreSection } from './ProviderStoreSection';
import { DispatchChatModal } from './DispatchChatModal';

interface CustomerViewProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onOpenBookingModal: (provider: ProviderProfile, service: ServiceItem) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  selectedCategoryId,
  onSelectCategory,
  onOpenBookingModal
}) => {
  const {
    currentUser,
    initiateCall,
    openChat,
    openProviderProfile,
    setIsAiModalOpen,
    openAiModalWithPrompt,
    globalRefreshKey,
    openLiveTracking,
    openFileComplaint,
    openStorefrontSubdomain,
    setIsAuthModalOpen,
    setAuthModalTab,
    loginWithWallet
  } = useAuth();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [dispatchCategory, setDispatchCategory] = useState<ServiceCategory | null>(null);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'services' | 'rides'>('services');
  const [loading, setLoading] = useState(true);
  const marqueeContainerRef = useRef<HTMLDivElement>(null);

  const handleConnectServexaAi = (promptText?: string) => {
    if (!currentUser) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    const text = promptText !== undefined ? promptText : searchQuery.trim();
    openAiModalWithPrompt(text || undefined);
  };

  // Ride planner state
  const [ridePickup, setRidePickup] = useState('742 Market St, San Francisco, CA');
  const [rideDropoff, setRideDropoff] = useState('Union Square Plaza, San Francisco, CA');
  const [selectedVehicle, setSelectedVehicle] = useState<'sedan' | 'ev' | 'van'>('sedan');
  const [simulatedDistanceKm, setSimulatedDistanceKm] = useState(4.8);

  // Review modal state
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Fetch categories, providers, and bookings
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/providers').then((r) => r.json()),
      fetch('/api/bookings').then((r) => r.json())
    ])
      .then(([cats, provs, bks]) => {
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(provs)) setProviders(provs);
        if (Array.isArray(bks)) {
          const userBks = currentUser?.id
            ? bks.filter((b: Booking) => b.customerId === currentUser.id)
            : [];
          setActiveBookings(userBks);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser?.id, globalRefreshKey]);

  // Filter providers
  const filteredProviders = providers.filter((p) => {
    const matchesCat =
      !selectedCategoryId || selectedCategoryId === 'all' || p.category === selectedCategoryId;
    const matchesSearch =
      !searchQuery ||
      p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subcategories.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (iconName: string, cls = 'w-3.5 h-3.5') => {
    switch (iconName) {
      case 'Car':
        return <Car className={cls} />;
      case 'Package':
        return <Package className={cls} />;
      case 'Wrench':
        return <Wrench className={cls} />;
      case 'Zap':
        return <Zap className={cls} />;
      case 'Utensils':
        return <Utensils className={cls} />;
      case 'Stethoscope':
        return <Stethoscope className={cls} />;
      default:
        return <Sparkles className={cls} />;
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingId || !currentUser) return;

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reviewBookingId,
          rating: reviewRating,
          comment: reviewComment,
          customerName: currentUser.name,
          customerAvatar: currentUser.avatar
        })
      });
      setReviewBookingId(null);
      setReviewComment('');
    } catch (e) {
      console.error(e);
    }
  };

  // Sort bookings so that active orders (on_the_way, in_progress, arrived, accepted) always appear at the very top
  const sortedBookings = [...activeBookings].sort((a, b) => {
    const statusWeight: Record<string, number> = {
      on_the_way: 1,
      in_progress: 2,
      arrived: 3,
      accepted: 4,
      pending: 5,
      completed: 6,
      cancelled: 7
    };
    const diff = (statusWeight[a.status] || 99) - (statusWeight[b.status] || 99);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'on_the_way':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Specialist On The Way
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            Booking Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Service Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Pending Dispatch
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Service Specialists: 3D Animated Trade Characters */}
        <CategoryCards
          categories={categories}
          onSelectCategory={(cat) => {
            if (!currentUser) {
              setAuthModalTab('login');
              setIsAuthModalOpen(true);
              return;
            }
            setDispatchCategory(cat);
          }}
        />

        {/* Products from Service Provider Stores */}
        <ProviderStoreSection
          onOpenStorefront={(subdomain) => openStorefrontSubdomain(subdomain)}
        />

        {/* Booked Orders & Active Dispatches - Displayed at the Top */}
        {sortedBookings.length > 0 && (
          <div className="mb-8 bg-white rounded-3xl border border-indigo-100 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Your Booked Orders</h2>
                  <p className="text-xs text-slate-500">
                    Real-time status tracking, live map dispatch radar, VoIP calling, and support.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 self-start sm:self-auto">
                {sortedBookings.filter((b) => ['on_the_way', 'in_progress', 'arrived', 'accepted'].includes(b.status)).length} Active Dispatch
              </span>
            </div>

            <div className="space-y-4">
              {sortedBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {getStatusBadge(b.status)}
                      <span className="text-xs font-mono font-bold text-slate-500">#{b.id}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{b.serviceName}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{b.providerName}</span>
                        <span>•</span>
                        <span className="text-slate-500 capitalize">{b.pricingModel} pricing</span>
                      </div>
                    </div>

                    {/* Pickup & Destination */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">{b.pickupLocation.address}</span>
                      </div>
                      {b.destinationLocation && (
                        <div className="flex items-start gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="truncate">{b.destinationLocation.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Exact User Handover Security PIN */}
                    {b.deliveryPin && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          {b.deliveryVerified ? 'Delivery Verified on Exact User' : `Handover PIN: ${b.deliveryPin}`}
                        </span>
                        {!b.deliveryVerified && (
                          <span className="text-[10px] text-slate-500">
                            Give to specialist upon arrival to confirm exact handover
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-base font-extrabold text-slate-900 font-mono block">
                        ${b.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        {b.paymentStatus === 'paid' ? 'Paid & Escrowed' : 'Payment Authorized'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Live GPS Radar Tracking Button */}
                      {['accepted', 'confirmed', 'on_the_way', 'arrived', 'in_progress'].includes(b.status) && (
                        <button
                          type="button"
                          onClick={() => openLiveTracking(b.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Navigation className="w-3.5 h-3.5 text-amber-300" />
                          Track Live Dispatch
                        </button>
                      )}

                      {/* PBX VoIP Call Button */}
                      <button
                        type="button"
                        onClick={() => initiateCall(b.providerId, b.providerName, 'provider')}
                        className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                        title="Instant PBX Call"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>

                      {/* Live Chat Button - Available once provider accepts order */}
                      {['accepted', 'confirmed', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(b.status) ? (
                        <button
                          type="button"
                          onClick={() => openChat(b.id, b.providerId, b.providerName)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
                          title="Open Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                          <span>Chat</span>
                        </button>
                      ) : (
                        <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Awaiting Acceptance</span>
                        </span>
                      )}

                      {/* Dispute Support */}
                      <button
                        type="button"
                        onClick={() => openFileComplaint(b.id)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 transition-colors cursor-pointer"
                        title="File Support Ticket"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>

                      {/* Rate and Review if completed */}
                      {b.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewBookingId(b.id);
                            setReviewRating(5);
                            setReviewComment('');
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          Rate Service
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Taxi, Rides & Delivery Route Planner */}
        {(viewMode === 'rides' || selectedCategoryId === 'cat-taxi') && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <Navigation className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Instant Ride & Delivery Dispatch</h3>
              </div>
              <p className="text-xs text-slate-500">
                Live GPS route planning with upfront pricing and transparent platform commission.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pickup Location</label>
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={ridePickup}
                    onChange={(e) => setRidePickup(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Drop-off Destination</label>
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={rideDropoff}
                    onChange={(e) => setRideDropoff(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Vehicle selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Vehicle Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle('sedan')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedVehicle === 'sedan'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Car className="w-5 h-5 mx-auto mb-1 text-slate-700" />
                    <span className="text-xs font-bold block">Sedan</span>
                    <span className="text-[10px] text-slate-500">$2.40/km</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVehicle('ev')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedVehicle === 'ev'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Zap className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs font-bold block">Tesla EV</span>
                    <span className="text-[10px] text-slate-500">$3.10/km</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVehicle('van')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedVehicle === 'van'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Package className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                    <span className="text-xs font-bold block">XL / Cargo</span>
                    <span className="text-[10px] text-slate-500">$3.80/km</span>
                  </button>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Estimated Fare</span>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    ${(simulatedDistanceKm * (selectedVehicle === 'sedan' ? 2.4 : selectedVehicle === 'ev' ? 3.1 : 3.8) + 8).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Est. {Math.round(simulatedDistanceKm * 2.8)} mins • {simulatedDistanceKm} km
                  </span>
                </div>

                <button
                  onClick={() => {
                    const taxiProv = providers.find((p) => p.category === 'cat-taxi') || providers[0];
                    if (taxiProv) {
                      const srv = taxiProv.services?.[0] || {
                        id: 'srv-default-taxi',
                        name: 'Direct Transport / Ride Dispatch',
                        categoryId: 'cat-taxi',
                        price: 32.00,
                        priceType: 'km',
                        durationMinutes: 25,
                        description: 'Point-to-point dispatch service.'
                      };
                      onOpenBookingModal(taxiProv, srv);
                    }
                  }}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  Book Instant Ride
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Vector GPS Map Simulation */}
            <div className="lg:col-span-7 bg-slate-100 rounded-2xl border border-slate-200 relative overflow-hidden min-h-[300px] flex items-center justify-center p-4">
              {/* Simulated Map SVG */}
              <svg className="w-full h-full absolute inset-0 opacity-40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Simulated roads */}
                <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="#94a3b8" strokeWidth="6" />
                <line x1="20%" y1="90%" x2="80%" y2="10%" stroke="#94a3b8" strokeWidth="4" />
                {/* Animated active route */}
                <line
                  x1="25%"
                  y1="35%"
                  x2="75%"
                  y2="65%"
                  stroke="#4f46e5"
                  strokeWidth="5"
                  strokeDasharray="8 4"
                  className="animate-pulse"
                />
              </svg>

              {/* Pickup Pin */}
              <div className="absolute top-[32%] left-[23%] flex flex-col items-center animate-bounce">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold shadow-md">
                  Pickup
                </span>
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-md mt-0.5" />
              </div>

              {/* Dropoff Pin */}
              <div className="absolute top-[62%] left-[73%] flex flex-col items-center">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold shadow-md">
                  Drop-off
                </span>
                <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-md mt-0.5" />
              </div>

              {/* Moving vehicle pin */}
              <div className="absolute top-[46%] left-[46%] p-2 rounded-xl bg-slate-900 text-white shadow-lg flex items-center gap-1.5 animate-pulse">
                <Car className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold font-mono">Driver 3m away</span>
              </div>

              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 shadow-2xs">
                GPS Lat: 37.7749 • Lng: -122.4194 (San Francisco)
              </div>
            </div>
          </div>
        )}

        {/* Small Search Bar with Option to Connect with Servexa Match */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>
                {selectedCategoryId
                  ? `${categories.find((c) => c.id === selectedCategoryId)?.name || 'Specialists'}`
                  : 'Top Rated Verified Specialists'}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {filteredProviders.length} available
              </span>
            </h2>
          </div>

          {/* Small Search Bar with Option to Connect with Servexa */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all p-1 h-9 w-full sm:w-84">
              <Search className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  if (!currentUser) {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setSearchQuery(e.target.value);
                }}
                onClick={() => {
                  if (!currentUser) {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConnectServexaAi();
                  }
                }}
                placeholder={!currentUser ? 'Sign in to search services...' : 'Search services or ask Servexa...'}
                className="w-full bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden py-1 px-1 min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer mr-1 shrink-0"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Small Option to Connect with Servexa */}
              <button
                type="button"
                onClick={() => handleConnectServexaAi()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shrink-0 transition-all shadow-xs cursor-pointer active:scale-95 group"
                title="Connect with Servexa for instant GPS matching & diagnosis"
              >
                <Sparkles className="w-3 h-3 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Servexa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Prompt Chips linked directly to Servexa */}
        <div className="flex items-center flex-wrap gap-1.5 mb-5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 font-semibold text-indigo-700 shrink-0">
            <Sparkles className="w-3 h-3" />
            Instant Search:
          </span>
          {[
            'Kitchen sink leak repair',
            'EV ride to airport',
            'Circuit breaker sparking',
            'Deep home cleaning'
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => {
                setSearchQuery(promptText);
                handleConnectServexaAi(promptText);
              }}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer text-[10px] font-medium"
            >
              "{promptText}"
            </button>
          ))}
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProviders.map((prov) => (
            <div
              key={prov.userId}
              className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Header: Avatar, Name, Verification, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                        alt={prov.businessName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200"
                      />
                      {prov.isVerified && (
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-indigo-600 rounded-full text-white ring-2 ring-white">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                        {prov.businessName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {prov.rating}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {prov.completedJobs} jobs
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      prov.activeStatus === 'online'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {prov.activeStatus}
                  </span>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {prov.bio}
                </p>

                {/* Subcategory pills */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {prov.subcategories.slice(0, 3).map((sub, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80"
                    >
                      {sub}
                    </span>
                  ))}
                </div>

                {/* Location & Rates */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{prov.serviceArea.split(',')[0]}</span>
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm font-mono">
                    ${prov.hourlyRate}
                    <span className="text-[11px] font-normal text-slate-500">
                      {prov.category === 'cat-taxi' ? '/km' : '/hr'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions - Direct Booking and Contact (Service Provider Profile removed from home page) */}
              <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    const srv = prov.services?.[0] || {
                      id: `srv-${prov.userId}-default`,
                      name: prov.businessName || 'Standard Service',
                      categoryId: prov.category,
                      price: prov.hourlyRate || 45.00,
                      priceType: 'fixed',
                      durationMinutes: 60,
                      description: prov.bio || 'Professional service dispatch.'
                    };
                    onOpenBookingModal(prov, srv);
                  }}
                  className="flex-1 py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Get Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => initiateCall(prov.userId, prov.businessName, 'provider')}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                  title="Call via PBX VoIP"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>

                {prov.storefront?.subdomain && (
                  <button
                    onClick={() => openStorefrontSubdomain(prov.storefront!.subdomain)}
                    className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                    title={`Visit ${prov.storefront.subdomain}.servexa.com Storefront`}
                  >
                    <Store className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Customer Review Modal */}
      {reviewBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Rate Your Service Experience</h3>
                <p className="text-[11px] text-slate-500">Your review helps verified specialists maintain high standards.</p>
              </div>
              <button
                onClick={() => setReviewBookingId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setReviewRating(starVal)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          starVal <= reviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-200 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-900 ml-2 font-mono">
                    {reviewRating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Detailed Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about punctuality, craftsmanship, and service quality..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBookingId(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immediate Dispatch & In-Chat Consultation Modal */}
      {dispatchCategory && (
        <DispatchChatModal
          category={dispatchCategory}
          onClose={() => setDispatchCategory(null)}
        />
      )}
    </div>
  );
};
