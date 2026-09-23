import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, Booking, ProviderProfile, Product, ChatInvoice } from '../../types';
import {
  X,
  Send,
  PhoneCall,
  Video,
  ShieldCheck,
  CheckCheck,
  Film,
  Paperclip,
  Play,
  Lock,
  Store,
  MapPin,
  FileText,
  CreditCard,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag
} from 'lucide-react';

export const ChatDrawer: React.FC = () => {
  const { activeChatBookingId, closeChat, currentUser, initiateCall, globalRefreshKey } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [preorderProvider, setPreorderProvider] = useState<ProviderProfile | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [videoCaption, setVideoCaption] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Store Drawer & Invoice in chat state
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<ChatInvoice[]>([]);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [laborVal, setLaborVal] = useState('50');
  const [materialsVal, setMaterialsVal] = useState('25');
  const [payingInvId, setPayingInvId] = useState<string | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<ChatInvoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'credit' | 'card'>('credit');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isPreorder = Boolean(activeChatBookingId?.startsWith('preorder_'));
  const preorderTargetId = isPreorder ? activeChatBookingId!.replace('preorder_', '') : null;

  useEffect(() => {
    if (!activeChatBookingId) return;

    if (isPreorder && preorderTargetId) {
      // Pre-order consultation chat: fetch provider profile
      fetch(`/api/providers/${preorderTargetId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setPreorderProvider(data);
          }
        })
        .catch(() => {});
    } else {
      // Fetch booking details
      fetch('/api/bookings')
        .then((res) => res.json())
        .then((bookings: Booking[]) => {
          const found = bookings.find((b) => b.id === activeChatBookingId);
          if (found) setBooking(found);
        })
        .catch(() => {});
    }

    // Fetch messages for this booking or conversation
    fetch(`/api/messages/${activeChatBookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});

    // Fetch invoices for this booking or conversation
    fetch(`/api/invoices?bookingId=${activeChatBookingId}`)
      .then((res) => res.json())
      .then((invs) => {
        if (Array.isArray(invs)) setInvoices(invs);
      })
      .catch(() => {});
  }, [activeChatBookingId, globalRefreshKey, isPreorder, preorderTargetId]);

  // Load products for the provider
  useEffect(() => {
    const provId = isPreorder ? preorderTargetId : booking?.providerId;
    if (provId) {
      fetch(`/api/products?providerId=${provId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setStoreProducts(data);
        })
        .catch(() => {});
    }
  }, [isPreorder, preorderTargetId, booking]);

  const handlePayChatInvoice = async (invoiceId: string, method: 'credit' | 'card') => {
    setPayingInvId(invoiceId);
    setPaymentError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'confirmed', paymentMethod: method } : inv))
        );
        if (booking && booking.id === activeChatBookingId) {
          setBooking((prev) => (prev ? { ...prev, status: 'confirmed', paymentStatus: 'paid' } : null));
        }
        if (method === 'credit' && currentUser) {
          currentUser.walletBalance = Math.max(
            0,
            Math.round(((currentUser.walletBalance || 0) - (paymentModalInvoice?.totalAmount || 0)) * 100) / 100
          );
        }
        setPaymentModalInvoice(null);
      } else {
        setPaymentError(data.error || 'Payment failed');
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Invoice pay error');
    } finally {
      setPayingInvId(null);
    }
  };

  const handleCreateChatInvoice = async () => {
    const provId = isPreorder ? preorderTargetId : booking?.providerId;
    const custId = isPreorder ? currentUser?.id : booking?.customerId;
    if (!provId || !custId) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: isPreorder ? undefined : booking?.id,
          conversationId: activeChatBookingId,
          providerId: provId,
          customerId: custId,
          laborAmount: Number(laborVal) || 0,
          materialsAmount: Number(materialsVal) || 0,
          notes: 'Service labor & materials'
        })
      });
      const data = await res.json();
      if (res.ok && data.invoice) {
        setInvoices((prev) => [...prev, data.invoice]);
        setShowCreateInvoice(false);
      }
    } catch (e) {
      console.error('Create invoice error:', e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, invoices]);

  if (!activeChatBookingId) return null;

  const otherPersonName = isPreorder
    ? preorderProvider?.businessName || 'Verified Specialist'
    : currentUser?.id === booking?.customerId
    ? booking?.providerName
    : booking?.customerName;

  const otherPersonId = isPreorder
    ? preorderTargetId!
    : currentUser?.id === booking?.customerId
    ? booking?.providerId
    : booking?.customerId;

  const otherPersonRole = isPreorder
    ? 'provider'
    : currentUser?.id === booking?.customerId
    ? 'provider'
    : 'customer';

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedVideoUrl) || !currentUser) return;

    const textToSend = inputText.trim();
    const mediaUrlToSend = selectedVideoUrl;
    const mediaTypeToSend = selectedVideoUrl ? 'video' : 'text';

    setInputText('');
    setSelectedVideoUrl(null);
    setShowVideoModal(false);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: isPreorder ? undefined : booking?.id,
          conversationId: activeChatBookingId,
          senderId: currentUser.id,
          receiverId: otherPersonId,
          senderName: currentUser.name,
          text: textToSend || (mediaTypeToSend === 'video' ? 'Shared inspection video clip' : ''),
          mediaType: mediaTypeToSend,
          mediaUrl: mediaUrlToSend,
          isEncrypted: true
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setSelectedVideoUrl(objectUrl);
      setShowVideoModal(true);
    }
  };

  const demoInspectionVideos = [
    {
      title: 'Plumbing Diagnostic Inspection',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      caption: 'Inspection video showing pipe under sink valve leak'
    },
    {
      title: 'Electrical Panel Check',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      caption: 'Breaker box diagnostics and circuit review'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
              {otherPersonName ? otherPersonName.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900">{otherPersonName || 'Chat'}</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[190px]">
                {isPreorder
                  ? 'Pre-Order Private Consultation'
                  : booking?.serviceName || 'Active Booking'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Video Call button */}
            <button
              onClick={() =>
                otherPersonId &&
                otherPersonName &&
                initiateCall(otherPersonId, otherPersonName, otherPersonRole, booking?.id, 'video')
              }
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              title="Start Encrypted Video Call"
            >
              <Video className="w-4 h-4" />
            </button>

            {/* Audio Call button */}
            <button
              onClick={() =>
                otherPersonId &&
                otherPersonName &&
                initiateCall(otherPersonId, otherPersonName, otherPersonRole, booking?.id, 'audio')
              }
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
              title="Start Encrypted Voice Call"
            >
              <PhoneCall className="w-4 h-4" />
            </button>

            {/* Small Store Icon button */}
            <button
              onClick={() => setIsStoreOpen(!isStoreOpen)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isStoreOpen ? 'bg-amber-100 text-amber-800' : 'text-amber-600 hover:bg-amber-50'
              }`}
              title="Browse Specialist Store Catalog"
            >
              <Store className="w-4 h-4" />
            </button>

            <button
              onClick={closeChat}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Banner */}
        <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900 font-medium">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>256-Bit Encrypted Chat & Video Sharing</span>
          </div>
          <span className="font-mono text-[10px] text-indigo-600 font-semibold">
            {isPreorder ? 'PRE-ORDER' : `ORDER #${booking?.id?.slice(-6)}`}
          </span>
        </div>

        {/* Dual Location Tracking Banner */}
        {booking && (
          <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{booking.pickupLocation?.address || 'Pickup location'}</span>
            </div>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Verified Map Route
            </span>
          </div>
        )}

        {/* If booking is still pending acceptance */}
        {booking && booking.status === 'pending' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-base font-extrabold text-slate-900">
                Awaiting Provider Acceptance
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The chat box opens only when the service provider accepts the request from the service dashboard.
              </p>
            </div>
            {currentUser?.role === 'provider' ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/bookings/${booking.id}/status`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'accepted', actorId: currentUser.id })
                    });
                    if (res.ok) {
                      setBooking((prev) => (prev ? { ...prev, status: 'accepted' } : null));
                    }
                  } catch (e) {
                    console.error('Accept error:', e);
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Request from Service Dashboard</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                Service specialist has received your booking and will accept shortly.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 relative">
          {/* Store Drawer Overlay */}
          {isStoreOpen && (
            <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">Specialist Store Catalog</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStoreOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {storeProducts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No products cataloged for this provider.
                  </div>
                ) : (
                  storeProducts.map((p) => (
                    <div key={p.id} className="p-2.5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                      <div className="flex items-center gap-3 mb-2">
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{p.name}</h5>
                          <span className="text-xs font-mono font-bold text-indigo-600">${p.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/products/${p.id}/purchase`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ customerId: currentUser?.id || 'cust-1', quantity: 1 })
                          });
                          setIsStoreOpen(false);
                        }}
                        className="w-full py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Purchase & Handover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Invoices inside chat */}
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-3.5 rounded-2xl bg-white border border-indigo-200 shadow-sm max-w-[95%] mx-auto my-2"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Job Invoice</span>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    inv.status === 'paid' || inv.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {inv.status === 'paid' || inv.status === 'confirmed' ? 'Confirmed' : 'Payment Due'}
                </span>
              </div>

              <div className="py-2 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Labor:</span>
                  <span className="font-mono">${inv.laborAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Materials:</span>
                  <span className="font-mono">${inv.materialsAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Consultation Fee:</span>
                  <span className="font-mono">${inv.consultationFee.toFixed(2)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                  <span>Total:</span>
                  <span className="font-mono text-indigo-700">${inv.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {inv.status === 'pending' && (
                currentUser?.role !== 'provider' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentModalInvoice(inv);
                      setPaymentError(null);
                    }}
                    className="mt-2 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay ${inv.totalAmount.toFixed(2)} in Chat
                  </button>
                ) : (
                  <div className="mt-2 text-center text-xs font-semibold text-amber-700 bg-amber-50 py-1.5 rounded-lg border border-amber-200">
                    Awaiting Customer Payment (${inv.totalAmount.toFixed(2)})
                  </div>
                )
              )}
              {(inv.status === 'paid' || inv.status === 'confirmed') && (
                <div className="mt-1 text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-lg border border-emerald-200 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Status: Confirmed ({inv.paymentMethod === 'credit' ? 'Paid by Credit' : 'Paid by Card'})
                </div>
              )}
            </div>
          ))}
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
              <p className="text-xs font-medium text-slate-600">
                {isPreorder
                  ? 'Private Consultation Channel Opened'
                  : 'Booking Coordination Channel'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Both customer and provider can exchange questions, estimates, voice/video calls, and share inspection videos securely before or during service.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                    }`}
                  >
                    {/* If message has an attached video */}
                    {msg.mediaType === 'video' && msg.mediaUrl && (
                      <div className="mb-2">
                        <div className="relative rounded-xl overflow-hidden bg-black max-w-full">
                          <video
                            src={msg.mediaUrl}
                            controls
                            playsInline
                            className="w-full max-h-48 rounded-xl object-contain bg-black"
                          />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] opacity-80 mt-1">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          <span>Encrypted Video Clip</span>
                        </div>
                      </div>
                    )}

                    <p className="break-words">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-indigo-500" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Video Attachment Modal / Preview */}
        {showVideoModal && selectedVideoUrl && (
          <div className="p-3 bg-indigo-50 border-t border-indigo-200 flex flex-col gap-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-indigo-600" />
                Video Attachment Preview
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedVideoUrl(null);
                  setShowVideoModal(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <video
              src={selectedVideoUrl}
              controls
              className="w-full max-h-32 rounded-xl bg-black object-contain"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="Add a caption for this video (e.g. 'Leak under sink faucet')..."
                className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setInputText(videoCaption);
                  handleSendMessage();
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                Send Video
              </button>
            </div>
          </div>
        )}

        {/* Message Input & Video Share Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          {/* Quick Consultation Video Clips for easy demonstration */}
          <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] text-slate-400 font-semibold shrink-0">Attach Video:</span>
            {demoInspectionVideos.map((dv, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedVideoUrl(dv.url);
                  setVideoCaption(dv.caption);
                  setShowVideoModal(true);
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-[10px] font-medium text-slate-600 flex items-center gap-1 border border-slate-200 shrink-0 cursor-pointer transition-colors"
              >
                <Film className="w-3 h-3 text-indigo-500" />
                <span>{dv.title}</span>
              </button>
            ))}
          </div>

          {/* Create Invoice Drawer - ONLY for service provider */}
          {showCreateInvoice && currentUser?.role === 'provider' && (
            <div className="p-3 mb-2 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Create In-Chat Invoice</span>
                <button
                  type="button"
                  onClick={() => setShowCreateInvoice(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Labor ($)</label>
                  <input
                    type="number"
                    value={laborVal}
                    onChange={(e) => setLaborVal(e.target.value)}
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Materials ($)</label>
                  <input
                    type="number"
                    value={materialsVal}
                    onChange={(e) => setMaterialsVal(e.target.value)}
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateChatInvoice}
                className="w-full py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Send Invoice ${(Number(laborVal) + Number(materialsVal) + 1.0).toFixed(2)}
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Create Invoice Button - ONLY visible to service provider */}
            {currentUser?.role === 'provider' && (
              <button
                type="button"
                onClick={() => setShowCreateInvoice(!showCreateInvoice)}
                className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Create In-Chat Invoice (Provider Only)"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}

            {/* Video File Picker */}
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              className="hidden"
              onChange={handleVideoFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Upload video from device"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message, questions, or notes..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() && !selectedVideoUrl}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </>
    )}

    {/* Payment Method Modal (Credit vs Card) */}
    {paymentModalInvoice && (
      <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900">Select Payment Method</h4>
              <p className="text-[11px] text-slate-500">Pay Invoice #{paymentModalInvoice.id.slice(-6)}</p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentModalInvoice(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900">Total Amount Due:</span>
            <span className="text-base font-extrabold text-indigo-700 font-mono">
              ${paymentModalInvoice.totalAmount.toFixed(2)}
            </span>
          </div>

          {paymentError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Choose Option:</p>

            {/* Pay by Credit */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('credit')}
              className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                selectedPaymentMethod === 'credit'
                  ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  selectedPaymentMethod === 'credit' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Pay by Credit</span>
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    ${(currentUser?.walletBalance || 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Deduct from Servexa wallet credit balance
                </p>
              </div>
            </button>

            {/* Pay by Card */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('card')}
              className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                selectedPaymentMethod === 'card'
                  ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  selectedPaymentMethod === 'card' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 block">Pay by Card</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Debit / Credit Card (Visa, MasterCard)
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentModalInvoice(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={payingInvId === paymentModalInvoice.id}
              onClick={() => handlePayChatInvoice(paymentModalInvoice.id, selectedPaymentMethod)}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {payingInvId === paymentModalInvoice.id ? (
                <span>Processing...</span>
              ) : (
                <span>Confirm Pay</span>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
      </div>
    </div>
  );
};
