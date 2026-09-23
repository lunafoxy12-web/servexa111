import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProviderStorefront, ProviderProfile, ServiceItem, StoreProduct } from '../../types';
import {
  Store,
  Globe,
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  PhoneCall,
  Video,
  MessageSquare,
  Share2,
  ExternalLink,
  Copy,
  CheckCircle2,
  X,
  ChevronRight,
  RefreshCw,
  Mail,
  Phone,
  Package,
  Layers,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Check
} from 'lucide-react';

export const StorefrontViewModal: React.FC = () => {
  const {
    activeStorefrontSubdomain,
    closeStorefrontSubdomain,
    initiateCall,
    openChat,
    currentUser,
    setIsAuthModalOpen,
    triggerGlobalRefresh
  } = useAuth();

  const [storefront, setStorefront] = useState<ProviderStorefront | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isFullscreenMap, setIsFullscreenMap] = useState<boolean>(false);

  useEffect(() => {
    if (!activeStorefrontSubdomain) return;
    setLoading(true);

    fetch(`/api/storefront/${activeStorefrontSubdomain}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.storefront || data.provider)) {
          setStorefront(data.storefront || data.provider.storefront);
          setProvider(data.provider);
          if (data.provider?.services && data.provider.services.length > 0) {
            setSelectedService(data.provider.services[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeStorefrontSubdomain]);

  if (!activeStorefrontSubdomain) return null;

  const providerId = provider?.id || (provider as any)?.userId;
  const providerName = provider?.name || provider?.businessName || 'Verified Specialist';

  // Direct Booking for a Service
  const handleBookDirect = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!provider || !selectedService) return;

    setBookingLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerPhone: currentUser.phone,
          providerId: providerId,
          providerName: providerName,
          serviceName: selectedService.name,
          price: selectedService.price,
          source: 'storefront',
          sourceSubdomain: activeStorefrontSubdomain,
          pickupLocation: 'Client Delivery Address',
          destinationLocation: provider.location?.address || 'Provider Office'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBookingSuccess(`Direct booking confirmed! Order #${data.id}`);
        triggerGlobalRefresh();
        setTimeout(() => setBookingSuccess(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingLoading(false);
    }
  };

  // Direct Order for a Product
  const handleOrderProduct = async (product: StoreProduct) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!provider) return;

    setBookingLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerPhone: currentUser.phone,
          providerId: providerId,
          providerName: providerName,
          serviceName: `${product.name} (Direct Product Order)`,
          price: product.price,
          source: 'storefront',
          sourceSubdomain: activeStorefrontSubdomain,
          pickupLocation: 'Client Address',
          destinationLocation: provider.location?.address || 'Provider Store'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBookingSuccess(`Product order placed successfully! Order #${data.id}`);
        triggerGlobalRefresh();
        setTimeout(() => setBookingSuccess(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingLoading(false);
    }
  };

  const shareStore = () => {
    const text = `Explore ${storefront?.storeName || 'Custom Storefront'} on Servexa:\n${window.location.origin}/?store=${activeStorefrontSubdomain}`;
    if (navigator.share) {
      navigator.share({
        title: storefront?.storeName || 'Servexa Storefront',
        text: text,
        url: `${window.location.origin}/?store=${activeStorefrontSubdomain}`
      }).catch(() => copyStoreUrl());
    } else {
      copyStoreUrl();
    }
  };

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?store=${activeStorefrontSubdomain}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filter products by selected category
  const allProducts = storefront?.products || [];
  const filteredProducts =
    selectedCategory === 'all'
      ? allProducts
      : allProducts.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  const categories = storefront?.categories || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Fullscreen Map Modal (if toggled) */}
      {isFullscreenMap && provider?.location && (
        <div className="fixed inset-0 z-60 bg-slate-950 flex flex-col">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold">{storefront?.storeName || providerName} - Live Location</h4>
                <p className="text-xs text-slate-400">{provider.location.address}</p>
              </div>
            </div>
            <button
              onClick={() => setIsFullscreenMap(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Back to Store</span>
            </button>
          </div>
          <div className="flex-1 w-full h-full relative">
            <iframe
              title="Fullscreen Storefront Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${provider.location.lat},${provider.location.lng}&hl=en&z=16&output=embed`}
            />
          </div>
        </div>
      )}

      {/* Main Responsive Storefront Modal Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">
        {/* Top Direct Domain URL Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center space-x-2 truncate">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-md truncate">
              <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate">
                {storefront?.customDomain || `${activeStorefrontSubdomain}.servexa.com`}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={shareStore}
              title="Share Store Link"
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={copyStoreUrl}
              title="Copy URL"
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={closeStorefrontSubdomain}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-500">Connecting to verified storefront...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Store Banner Hero */}
            <div
              className="h-44 sm:h-56 relative flex items-end p-6 sm:p-8 text-white"
              style={{ backgroundColor: storefront?.themeColor || '#4f46e5' }}
            >
              {storefront?.bannerUrl && (
                <img
                  src={storefront.bannerUrl}
                  alt="Storefront Banner"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-25"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

              <div className="relative z-10 space-y-1 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase">
                    Verified Independent Merchant
                  </span>
                  <span className="flex items-center space-x-1 text-xs text-amber-300 font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{provider?.rating || 4.9}</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                  {storefront?.storeName || providerName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 drop-shadow-sm">
                  {storefront?.tagline || provider?.bio || 'Professional direct booking portal & storefront.'}
                </p>
              </div>
            </div>

            {/* Notification Banner */}
            {bookingSuccess && (
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bookingSuccess}</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-600 uppercase">Provider Notified</span>
              </div>
            )}

            {/* Main Content Area */}
            <div className="p-4 sm:p-6 md:p-8 space-y-8">
              {/* Provider Quick Profile Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-base font-bold text-slate-900">About Our Store & Team</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {storefront?.bio || provider?.bio || 'Dedicated full-service specialist available for direct bookings, emergency callouts, and tailored estimates.'}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{provider?.location?.address || 'Service Area Verified'}</span>
                    </div>
                    {storefront?.contactEmail && (
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{storefront.contactEmail}</span>
                      </div>
                    )}
                    {storefront?.contactPhone && (
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{storefront.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Card (Video & Audio Consultation) */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Direct Specialist Contact
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Real-time video & voice calls with camera flip and price estimation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (providerId) {
                          closeStorefrontSubdomain();
                          initiateCall(providerId, providerName, 'provider', undefined, 'video');
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Encrypted Video Call (Live Camera)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (providerId) {
                          closeStorefrontSubdomain();
                          initiateCall(providerId, providerName, 'provider', undefined, 'audio');
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Encrypted Voice Call</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (providerId) {
                          closeStorefrontSubdomain();
                          openChat('preorder_' + providerId);
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer border border-slate-200"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span>Private Chat & Price Setting</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Categories Navigation Bar */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Browse Store Categories</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedCategory === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All Items ({allProducts.length + (provider?.services?.length || 0)})
                    </button>
                    {categories.map((c) => {
                      const count = allProducts.filter(
                        (p) => p.category?.toLowerCase() === c.name.toLowerCase()
                      ).length;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCategory(c.name)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedCategory.toLowerCase() === c.name.toLowerCase()
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {c.name} {count > 0 && `(${count})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Store Products Section */}
              {filteredProducts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {selectedCategory === 'all' ? 'Store Products & Hardware' : `${selectedCategory} Products`}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Direct Provider Inventory</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div className="relative h-36 bg-slate-100 overflow-hidden">
                          <img
                            src={prod.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80'}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
                            {prod.category}
                          </span>
                          <span className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-mono font-bold shadow-xs">
                            ${prod.price.toFixed(2)}
                          </span>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{prod.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{prod.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              In Stock
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOrderProduct(prod)}
                              disabled={bookingLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Order Product</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Offerings */}
              {(selectedCategory === 'all' || !categories.some(c => c.name.toLowerCase() === selectedCategory.toLowerCase())) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Direct Services & Booking Menu</h3>
                    <span className="text-xs text-slate-500 font-medium">Fixed Transparent Pricing</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {provider?.services?.map((service) => {
                      const isSelected = selectedService?.id === service.id;
                      return (
                        <div
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
                              <p className="text-xs text-slate-500 mt-1">{service.description}</p>
                            </div>
                            <span className="text-base font-extrabold text-slate-900 font-mono ml-3">
                              ${service.price}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                            <span className="text-slate-400 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{service.durationMinutes} mins</span>
                            </span>
                            <span
                              className={`font-semibold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}
                            >
                              {isSelected ? '✓ Selected' : 'Select'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Real-Time Google Map Location for Provider Products */}
              {provider?.location && (
                <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200/90">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Real-Time Google Maps Location & Dispatch Zone
                        </h4>
                        <p className="text-xs text-slate-500">
                          Live coordinates: {provider.location.lat.toFixed(4)}, {provider.location.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFullscreenMap(true)}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Full Screen Map</span>
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${provider.location.lat},${provider.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
                      >
                        <span>Open External</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100">
                    <iframe
                      title="Storefront Realtime Google Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${provider.location.lat},${provider.location.lng}&hl=en&z=15&output=embed`}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      <span className="font-semibold text-slate-900">Address:</span>
                      <span className="truncate">{provider.location.address}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">Direct Subdomain Synced</span>
                  </div>
                </div>
              )}

              {/* Instant Book Direct Action */}
              {selectedService && (
                <div className="p-5 sm:p-6 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      Ready to reserve
                    </span>
                    <h4 className="text-lg font-bold text-white mt-0.5">
                      {selectedService.name} • ${selectedService.price}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Dispatched directly from {storefront?.storeName || providerName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBookDirect}
                    disabled={bookingLoading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {bookingLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-200" />
                        <span>Book Instant Direct Dispatch</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
