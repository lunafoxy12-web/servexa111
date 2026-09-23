import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProviderProfile, Review, ServiceItem } from '../types';
import { ReviewStar } from './common/ReviewStar';
import {
  X,
  Star,
  CheckCircle2,
  PhoneCall,
  Calendar,
  MapPin,
  Clock,
  Briefcase,
  Heart,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Video,
  ThumbsUp
} from 'lucide-react';

interface ProviderProfileModalProps {
  providerId: string | null;
  onClose: () => void;
  onBookService: (provider: ProviderProfile, service: ServiceItem) => void;
}

export const ProviderProfileModal: React.FC<ProviderProfileModalProps> = ({
  providerId,
  onClose,
  onBookService
}) => {
  const { initiateCall, openChat } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'services' | 'reviews'>('portfolio');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);

    fetch(`/api/providers/${providerId}`)
      .then((res) => res.json())
      .then((data) => {
        setProvider(data);
        if (data.reviews) setReviews(data.reviews);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [providerId]);

  if (!providerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top bar */}
        <div className="relative h-28 bg-gradient-to-r from-slate-800 to-indigo-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 pb-4 border-b border-slate-100 relative bg-white">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl ring-4 ring-white bg-slate-100 overflow-hidden shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
                    alt={provider?.businessName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                {provider?.isVerified && (
                  <span className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 rounded-full text-white ring-2 ring-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold text-slate-900">{provider?.businessName}</h2>
                </div>
                <p className="text-xs text-slate-500 font-mono">@{provider?.handle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {provider?.rating}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {provider?.completedJobs} jobs done
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">{provider?.reviewCount} reviews</span>
                </div>
              </div>
            </div>

            {/* Direct Contact / VoIP Call button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  provider && initiateCall(provider.userId, provider.businessName, 'provider', undefined, 'video')
                }
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Encrypted video consultation before booking"
              >
                <Video className="w-3.5 h-3.5 text-indigo-600" />
                <span>Video Call</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  provider && initiateCall(provider.userId, provider.businessName, 'provider', undefined, 'audio')
                }
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Direct encrypted voice call via PBX VoIP"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span>Audio Call</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (provider) {
                    onClose();
                    openChat('preorder_' + (provider.id || provider.userId));
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Private encrypted chat & video sharing"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                <span>Private Chat</span>
              </button>
            </div>
          </div>

          {/* Bio & Service Area chips */}
          <p className="text-xs text-slate-600 mt-3 leading-relaxed max-w-xl">
            {provider?.bio}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {provider?.serviceArea}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {provider?.workingHours}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'portfolio'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Showcase & Posts ({provider?.posts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Services & Pricing ({provider?.services?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              {provider?.posts && provider.posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {provider.posts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="relative aspect-video bg-slate-100 overflow-hidden">
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
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{post.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {post.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-rose-500 font-semibold">
                            <Heart className="w-3.5 h-3.5 fill-rose-500" />
                            {post.likes} likes
                          </span>
                          <span>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No portfolio posts uploaded yet.</p>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-3">
              {provider?.services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{srv.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-bold">
                        {srv.priceType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {srv.description}
                    </p>
                    {srv.durationMinutes && (
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        Est. Duration: ~{srv.durationMinutes} mins
                      </span>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      ${(srv.price ?? 0).toFixed(2)}
                      {srv.priceType === 'km' && <span className="text-xs font-normal text-slate-500">/km</span>}
                      {srv.priceType === 'hourly' && <span className="text-xs font-normal text-slate-500">/hr</span>}
                    </span>
                    <button
                      onClick={() => provider && onBookService(provider, srv)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      Book Now
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {/* Aggregated Ratings Card */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-amber-900 font-mono">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
                      : (provider?.rating || 4.9).toFixed(1)}
                  </div>
                  <div>
                    <ReviewStar
                      rating={
                        reviews.length > 0
                          ? reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
                          : provider?.rating || 4.9
                      }
                      size="md"
                      showCount={false}
                    />
                    <span className="text-[11px] font-semibold text-amber-900 block mt-0.5">
                      Based on {reviews.length || provider?.reviewCount || 48} verified customer experiences
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-48 space-y-1 text-[10px] font-medium text-amber-900">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : stars >= 4 ? 85 : 5;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="w-6 text-right">{stars} ★</span>
                        <div className="flex-1 h-1.5 bg-amber-200/80 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-7 text-slate-500">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No customer reviews yet.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.customerAvatar}
                          alt={rev.customerName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-900">{rev.customerName}</span>
                      </div>
                      <ReviewStar rating={rev.rating} size="sm" showCount={false} />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{rev.comment}</p>
                    {rev.providerReply && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 mt-2">
                        <span className="font-bold text-indigo-700 block mb-0.5">Specialist Response:</span>
                        {rev.providerReply}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block pt-1">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
