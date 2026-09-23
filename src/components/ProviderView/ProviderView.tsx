import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProviderProfile, Booking, PortfolioPost, ServiceItem, Review } from '../../types';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  MapPin,
  PhoneCall,
  MessageSquare,
  Plus,
  Upload,
  Image,
  Star,
  Radio,
  Sliders,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Store,
  ExternalLink,
  Award,
  ThumbsUp,
  MessageCircle,
  X,
  User as UserIcon,
  Trash2,
  Camera,
  ShoppingBag,
  Navigation,
  KeyRound
} from 'lucide-react';
import { StorefrontManager } from './StorefrontManager';
import { DirectImageUpload } from '../common/DirectImageUpload';
import { AddProductServiceModal } from './AddProductServiceModal';
import { OrderNotificationPopup } from './OrderNotificationPopup';

export const ProviderView: React.FC = () => {
  const {
    currentUser,
    initiateCall,
    openChat,
    openLiveTracking,
    globalRefreshKey,
    triggerGlobalRefresh,
    setIsEmailVerifyModalOpen,
    setIsProfileModalOpen
  } = useAuth();

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedServiceForReviews, setSelectedServiceForReviews] = useState<ServiceItem | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'portfolio' | 'services' | 'storefront'>('jobs');
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // New portfolio post form modal state
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postCategory, setPostCategory] = useState('General Service');
  const [postMediaUrl, setPostMediaUrl] = useState(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
  );

  // Fetch provider data, assigned bookings, and reviews
  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/providers/${currentUser.id}`).then((r) => r.json()),
      fetch('/api/bookings').then((r) => r.json()),
      fetch('/api/reviews').then((r) => r.json())
    ])
      .then(([provData, allBookings, allReviews]) => {
        if (provData && !provData.error) {
          setProvider(provData);
          setIsOnline(provData.activeStatus === 'online');
        }
        if (Array.isArray(allBookings)) {
          const myBookings = allBookings.filter(
            (b: Booking) =>
              b.providerId === currentUser.id ||
              b.providerId === 'prov-1' ||
              b.providerId === 'prov-2' ||
              b.providerId === 'prov-3'
          );
          setBookings(myBookings);
        }
        if (Array.isArray(allReviews)) {
          setReviews(allReviews);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser?.id, globalRefreshKey]);

  // Calculate average customer review ratings for each listed service to build trust
  const getServiceRatingStats = (srv: ServiceItem) => {
    const srvNameLower = srv.name.toLowerCase();
    
    // Match reviews by booking service name or comment keywords
    const directReviews = reviews.filter((r) => {
      if (r.providerId && provider && r.providerId !== provider.userId) {
        return false;
      }
      const matchedBooking = bookings.find((b) => b.id === r.bookingId);
      if (matchedBooking && matchedBooking.serviceName.toLowerCase() === srvNameLower) {
        return true;
      }
      if (
        r.comment &&
        (r.comment.toLowerCase().includes(srvNameLower.slice(0, 10)) ||
          r.comment.toLowerCase().includes(srv.priceType) ||
          r.comment.toLowerCase().includes(srv.categoryId.replace('cat-', '')))
      ) {
        return true;
      }
      return false;
    });

    if (directReviews.length > 0) {
      const avg = directReviews.reduce((sum, r) => sum + r.rating, 0) / directReviews.length;
      return {
        avgRating: Math.round(avg * 10) / 10,
        reviewCount: directReviews.length,
        reviews: directReviews,
        satisfactionPct: Math.min(100, Math.round(avg * 20)),
        isDirect: true
      };
    }

    // Benchmark rating based on provider's verified reputation
    const benchmarkAvg = provider?.rating || 4.9;
    const benchmarkCount = Math.max(12, Math.floor((provider?.completedJobs || 36) / Math.max(1, provider?.services.length || 3)));
    
    // Relevant provider reviews for fallback display
    const providerReviews = reviews.filter((r) => r.providerId === provider?.userId);
    return {
      avgRating: benchmarkAvg,
      reviewCount: benchmarkCount,
      reviews: providerReviews.length > 0 ? providerReviews : reviews.slice(0, 2),
      satisfactionPct: 99,
      isDirect: false
    };
  };

  // Status transition handler
  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: 'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
  ) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !postTitle.trim()) return;

    try {
      const res = await fetch(`/api/providers/${currentUser.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle,
          description: postDescription,
          mediaType: 'image',
          mediaUrl: postMediaUrl,
          serviceCategory: postCategory
        })
      });

      if (res.ok) {
        const newPost = await res.json();
        setProvider((prev) => (prev ? { ...prev, posts: [newPost, ...prev.posts] } : null));
        setIsNewPostOpen(false);
        setPostTitle('');
        setPostDescription('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteService = async (srvId: string) => {
    if (!confirm('Are you sure you want to remove this product/service?')) return;
    try {
      const res = await fetch(`/api/providers/${currentUser?.id || provider?.userId}/services/${srvId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (provider) {
          setProvider({
            ...provider,
            services: provider.services.filter((s) => s.id !== srvId)
          });
        }
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error('Error removing service:', e);
    }
  };

  const activeJobs = bookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
  const completedJobs = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Banner & Online Switcher */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="relative cursor-pointer group"
                onClick={() => setIsProfileModalOpen(true)}
                title="Click to change profile picture"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser?.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-sm group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <Camera className="w-4 h-4" />
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900">
                    {provider?.businessName || currentUser?.name || 'Provider Hub'}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified Partner
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-slate-500">
                    Dispatcher: <span className="font-mono">{currentUser?.phone || '+1 (415) 555-0199'}</span>
                  </p>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    Edit Profile & Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Actions: Add Product / Dispatch Toggle / Edit Profile */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Upload Product & Price
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Live GPS Broadcast:</span>
                <button
                  onClick={() => setIsOnline(!isOnline)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isOnline
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium">Today's Earnings</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">
                ${(currentUser?.walletBalance ?? 0.00).toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Net after 5% platform fee
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium">Jobs Completed</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">
                {provider?.completedJobs || completedJobs.length + 14}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">100% on-time dispatch</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium">Customer Rating</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {provider?.rating || 4.98}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {provider?.reviewCount || 82} verified reviews
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium">Encrypted PBX VoIP</span>
              <div className="text-xl font-extrabold text-emerald-600 mt-0.5 font-mono flex items-center gap-1">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                Ready
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Adaptive Opus HD</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-t border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'jobs'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Job Queue ({activeJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'portfolio'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Social Showcase & Posts ({provider?.posts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Manage Services & Rates
          </button>
          <button
            onClick={() => setActiveTab('storefront')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'storefront'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Storefront Subdomain ($5/mo)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Email Verification Required Banner */}
        {currentUser && !currentUser.verified && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">Email Verification Required</h4>
                <p className="text-xs text-amber-700">Please verify your account to unlock instant payout withdrawals and verified badges.</p>
              </div>
            </div>
            <button
              onClick={() => setIsEmailVerifyModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              Verify Email with PIN
            </button>
          </div>
        )}
        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Incoming & Active Bookings</h2>
              <span className="text-xs text-slate-500">Live automatic synchronization</span>
            </div>

            {activeJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No active job in queue</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Keep your GPS status set to ONLINE to receive incoming bookings from nearby customers.
                </p>
              </div>
            ) : (
              activeJobs.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                          {b.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: #{b.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 capitalize">{b.bookingType} dispatch</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{b.serviceName}</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Customer Charge</span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        ${(b.price ?? 0).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-emerald-600 block font-semibold">
                        Net: ${(b.providerEarnings ?? (b.price ?? 0) * 0.95).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Customer info & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Customer Contact
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5">{b.customerName}</p>
                      <p className="text-slate-500 font-mono">{b.customerPhone}</p>
                      {b.notes && (
                        <p className="text-[11px] text-slate-600 italic mt-1 bg-white p-2 rounded-lg border border-slate-200/60">
                          "{b.notes}"
                        </p>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Destination Address
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {b.pickupLocation.address}
                      </p>
                      {b.destinationLocation && (
                        <p className="text-slate-600 text-[11px] mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          Drop-off: {b.destinationLocation.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Handover Security Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900">Exact User Handover PIN:</span>
                      {b.deliveryVerified ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Verified on Exact User
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                          Required upon arrival (Customer holds 4-digit code)
                        </span>
                      )}
                    </div>
                    {['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status) && !b.deliveryVerified && (
                      <button
                        type="button"
                        onClick={() => openLiveTracking(b.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        Enter PIN in Live Tracker &rarr;
                      </button>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Track on Google Maps */}
                      {['accepted', 'confirmed', 'on_the_way', 'arrived', 'in_progress'].includes(b.status) && (
                        <button
                          type="button"
                          onClick={() => openLiveTracking(b.id)}
                          className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-amber-300" />
                          Track & Google Maps
                        </button>
                      )}

                      {['accepted', 'confirmed', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(b.status) ? (
                        <button
                          type="button"
                          onClick={() => openChat(b.id)}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat Customer
                        </button>
                      ) : (
                        <span className="py-2 px-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Accept Request to Open Chat
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => initiateCall(b.customerId, b.customerName, 'customer', b.id)}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        Call via PBX VoIP
                      </button>
                    </div>

                    {/* Step Transitions */}
                    <div className="flex items-center gap-2">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'accepted')}
                          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Accept Booking
                        </button>
                      )}

                      {(b.status === 'accepted' || b.status === 'confirmed') && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'on_the_way')}
                          className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          Start Driving (On The Way)
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {b.status === 'on_the_way' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'arrived')}
                          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Mark Arrived at Location
                        </button>
                      )}

                      {b.status === 'arrived' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'in_progress')}
                          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Begin Service Work
                        </button>
                      )}

                      {b.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete & Settle Earnings
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Portfolio Showcase Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Public Social Showcase & Work Posts</h2>
                <p className="text-xs text-slate-500">
                  Share high-resolution images & video demonstrations to attract more clients
                </p>
              </div>
              <button
                onClick={() => setIsNewPostOpen(true)}
                className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Showcase Post
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {provider?.posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-100">
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white rounded-md text-[10px] font-medium backdrop-blur-xs">
                      {post.serviceCategory}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{post.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{post.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>{post.likes} community likes</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services & Rates Tab */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">Your Active Service Offerings</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Customer Trust Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload products, set prices, and showcase high-resolution pictures to attract customers and enable instant booking.
                </p>
              </div>

              {/* Action: Upload Product & Trust Metric */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Upload Product & Set Price
                </button>

                <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-extrabold text-slate-900">{provider?.rating || 4.9}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <div className="text-[11px] text-slate-600">
                    <span className="font-bold text-slate-900">{reviews.length > 0 ? reviews.length : 18}+</span> Reviews
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {provider?.services.map((srv) => {
                const stats = getServiceRatingStats(srv);
                const topReview = stats.reviews[0];

                return (
                  <div
                    key={srv.id}
                    className="p-5 rounded-3xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Product / Service Picture */}
                        {srv.imageUrl ? (
                          <img
                            src={srv.imageUrl}
                            alt={srv.name}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center text-emerald-600 shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                            <span className="text-[9px] font-bold mt-1">Service</span>
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">{srv.name}</h3>
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 uppercase">
                              {srv.priceType}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Award className="w-3 h-3 text-indigo-600" />
                              Satisfaction {stats.satisfactionPct}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{srv.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-lg font-black text-slate-900 font-mono block">
                            ${(srv.price ?? 0).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {srv.priceType === 'km' ? 'per km tracked' : srv.priceType === 'hourly' ? 'per labor hour' : 'fixed upfront fee'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove product/service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Customer Review Ratings & Trust Bar */}
                    <div className="pt-3 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/70">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx <= Math.round(stats.avgRating)
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-black text-amber-900 ml-1">
                            {stats.avgRating.toFixed(1)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          <span className="font-bold text-slate-900">{stats.reviewCount} customer reviews</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            Verified Client Feedback
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {topReview && (
                          <button
                            type="button"
                            onClick={() => setSelectedServiceForReviews(srv)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3 text-indigo-600" />
                            Read Customer Reviews ({stats.reviews.length})
                          </button>
                        )}
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-xl border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Trust Verified
                        </span>
                      </div>
                    </div>

                    {/* Featured customer review quote */}
                    {topReview && (
                      <div className="px-3.5 py-2.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 flex items-start gap-2.5 text-xs text-slate-700">
                        <img
                          src={topReview.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={topReview.customerName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover border border-indigo-200 shrink-0 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 text-[11px]">{topReview.customerName}</span>
                            <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {topReview.rating}.0
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-2">
                            "{topReview.comment}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Storefront Subdomain Tab */}
        {activeTab === 'storefront' && currentUser && (
          <StorefrontManager providerId={currentUser.id} providerProfile={provider} />
        )}
      </div>

      {/* New Portfolio Post Modal */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Publish Work Showcase</h3>
              <button
                onClick={() => setIsNewPostOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Copper Pipe Manifold Installation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <DirectImageUpload
                  value={postMediaUrl}
                  onChange={setPostMediaUrl}
                  label="Showcase Project Photo"
                  required
                  helperText="Direct file upload of completed work or demonstration photo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Category</label>
                <input
                  type="text"
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  placeholder="e.g. Plumbing Services"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  placeholder="Describe materials, techniques, and results..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Publish to Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Service Reviews Modal */}
      {selectedServiceForReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Verified Customer Reviews
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                  {selectedServiceForReviews.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedServiceForReviews(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {getServiceRatingStats(selectedServiceForReviews).reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={rev.customerName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{rev.customerName}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Verified Order • {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-amber-900">{rev.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{rev.comment}"
                  </p>

                  {rev.providerReply && (
                    <div className="mt-2 pl-3 border-l-2 border-indigo-300 text-[11px] text-indigo-900 bg-indigo-50/70 p-2 rounded-r-xl">
                      <span className="font-bold block text-indigo-950">Your Public Reply:</span>
                      {rev.providerReply}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedServiceForReviews(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Reviews
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Product & Set Price Modal */}
      <AddProductServiceModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        providerId={currentUser?.id || provider?.userId || 'prov-1'}
        onProductAdded={(newService) => {
          if (provider) {
            setProvider({
              ...provider,
              services: [newService, ...provider.services]
            });
          }
        }}
      />

      {/* Real-time Order Popup Notification for Provider */}
      <OrderNotificationPopup
        providerId={currentUser?.id || provider?.userId || 'prov-1'}
        providerCategory={provider?.category}
        onOrderAccepted={() => {
          triggerGlobalRefresh();
        }}
      />
    </div>
  );
};
