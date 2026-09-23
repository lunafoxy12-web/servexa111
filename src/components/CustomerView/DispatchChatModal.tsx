import React, { useState, useEffect, useRef } from 'react';
import { Category, ProviderProfile, ChatMessage, Product, ChatInvoice } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Send,
  PhoneCall,
  Video,
  Store,
  MapPin,
  FileText,
  CreditCard,
  Wallet,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Navigation,
  ShieldCheck,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  User as UserIcon,
  Award
} from 'lucide-react';

interface DispatchChatModalProps {
  category: Category | null;
  onClose: () => void;
}

export const DispatchChatModal: React.FC<DispatchChatModalProps> = ({ category, onClose }) => {
  const { currentUser, initiateCall, updateUserLocally, globalRefreshKey, lastRealtimeEvent } = useAuth();

  // State phases: 'issue_input' | 'searching_15s' | 'chat_connected'
  const [phase, setPhase] = useState<'issue_input' | 'searching_15s' | 'chat_connected'>('issue_input');
  const [issueText, setIssueText] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [assignedProvider, setAssignedProvider] = useState<ProviderProfile | null>(null);
  const [assignedBookingId, setAssignedBookingId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [providerProducts, setProviderProducts] = useState<Product[]>([]);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Invoice in chat state
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
  const [laborAmount, setLaborAmount] = useState('45');
  const [materialsAmount, setMaterialsAmount] = useState('20');
  const [invoiceNotes, setInvoiceNotes] = useState('Standard diagnostic & replacement parts');
  const [activeInvoices, setActiveInvoices] = useState<ChatInvoice[]>([]);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<ChatInvoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'credit' | 'card'>('credit');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Dual locations
  const [customerLocation] = useState({
    address: currentUser?.location?.address || '742 Market St, San Francisco, CA',
    lat: currentUser?.location?.lat || 37.7749,
    lng: currentUser?.location?.lng || -122.4194
  });

  const [providerLocation, setProviderLocation] = useState({
    address: '450 Sutter St, San Francisco, CA',
    lat: 37.7899,
    lng: -122.4089,
    distanceKm: 2.1,
    etaMins: 7
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeInvoices]);

  // 15 seconds indicator when in searching phase (waits strictly for service dashboard acceptance)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'searching_15s' && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, secondsRemaining]);

  // Listen for real-time dispatch acceptance from provider
  useEffect(() => {
    if (phase === 'searching_15s' && lastRealtimeEvent) {
      if (lastRealtimeEvent.type === 'DISPATCH_ACCEPTED') {
        const payload = lastRealtimeEvent.payload;
        if (!ticketId || payload.ticketId === ticketId || payload.customerId === (currentUser?.id || 'cust-1')) {
          fetch('/api/providers')
            .then((r) => r.json())
            .then((provs) => {
              const match = provs.find((pr: any) => pr.userId === payload.providerId) || provs[0];
              if (match) {
                setAssignedProvider(match);
                setAssignedBookingId(payload.bookingId || 'bk-' + Date.now());
                setConversationId(payload.conversationId || `conv-${currentUser?.id || 'cust-1'}-${match.userId}`);
                setPhase('chat_connected');
              }
            })
            .catch(() => simulateSpecialistAccept());
        }
      }
    }
  }, [phase, lastRealtimeEvent, ticketId, currentUser?.id]);

  // Submit issue and trigger automatic notification to specialists
  const handleStartDispatch = async () => {
    if (!category) return;
    const desc = issueText.trim() || `Urgent assistance needed with ${category.name}`;

    setPhase('searching_15s');
    setSecondsRemaining(15);

    try {
      const res = await fetch('/api/dispatch/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: category.id,
          customerId: currentUser?.id || 'cust-1',
          customerLocation,
          issueDescription: desc
        })
      });

      const data = await res.json();
      if (data && data.ticketId) {
        setTicketId(data.ticketId);
      }
    } catch (e) {
      console.error('Dispatch request error:', e);
    }
  };

  const simulateSpecialistAccept = async (tId?: string) => {
    if (phase === 'chat_connected') return;

    try {
      // Find a matching provider in this category
      const provsRes = await fetch('/api/providers');
      const provs = await provsRes.json();
      const match = provs.find((p: ProviderProfile) => p.category === category?.id) || provs[0];

      if (match) {
        setAssignedProvider(match);
        const convId = `conv-${currentUser?.id || 'cust-1'}-${match.userId}`;
        setConversationId(convId);
        setAssignedBookingId('bk-disp-' + Date.now());

        // Load provider products for the store icon
        fetch(`/api/products?providerId=${match.userId}`)
          .then((r) => r.json())
          .then((prods) => {
            if (Array.isArray(prods)) setProviderProducts(prods);
          })
          .catch(() => {});

        // Initialize chat messages
        const initialMsgs: ChatMessage[] = [
          {
            id: 'msg-cust-issue',
            bookingId: 'bk-disp-' + Date.now(),
            senderId: currentUser?.id || 'cust-1',
            receiverId: match.userId,
            senderName: currentUser?.name || 'Customer',
            text: issueText || `Urgent service needed for ${category?.name}`,
            mediaType: 'text',
            timestamp: new Date().toISOString(),
            read: true
          },
          {
            id: 'msg-prov-hello',
            bookingId: 'bk-disp-' + Date.now(),
            senderId: match.userId,
            receiverId: currentUser?.id || 'cust-1',
            senderName: match.businessName,
            text: `Hello! I have accepted your request. I am nearby and ready to inspect and fix the issue. You can chat, place audio/video calls, or check my store catalog anytime!`,
            mediaType: 'text',
            timestamp: new Date().toISOString(),
            read: true
          }
        ];
        setMessages(initialMsgs);

        // Add a sample initial invoice from the provider
        const initialInvoice: ChatInvoice = {
          id: 'inv-' + Date.now(),
          bookingId: 'bk-disp-' + Date.now(),
          providerId: match.userId,
          providerName: match.businessName,
          customerId: currentUser?.id || 'cust-1',
          customerName: currentUser?.name || 'Customer',
          laborAmount: 45,
          materialsAmount: 20,
          consultationFee: 1.0,
          commissionFee: 3.96,
          platformFeePercent: 6,
          platformFeeAmount: 3.96,
          totalAmount: 66.0,
          providerEarnings: 62.04,
          status: 'pending',
          notes: 'Initial diagnostics & service call fee',
          createdAt: new Date().toISOString()
        };
        setActiveInvoices([initialInvoice]);

        setPhase('chat_connected');
      }
    } catch (err) {
      console.error('Acceptance simulation error:', err);
    }
  };

  // Send in-chat message
  const handleSendMessage = () => {
    if (!inputMsg.trim() || !assignedProvider) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      bookingId: assignedBookingId || undefined,
      conversationId: conversationId || undefined,
      senderId: currentUser?.id || 'cust-1',
      receiverId: assignedProvider.userId,
      senderName: currentUser?.name || 'Customer',
      text: inputMsg.trim(),
      mediaType: 'text',
      timestamp: new Date().toISOString(),
      read: true
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMsg('');

    // Simulate helpful response from provider after 1.2s
    setTimeout(() => {
      const replies = [
        "Understood. I am on my way with full diagnostic equipment.",
        "Got it! I have the required replacement parts in my van.",
        "Thank you for the update! Please feel free to place an audio or video call if you'd like to show me the setup directly.",
        "Noted! I've updated my route and will be there in approximately 6 minutes."
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-reply-' + Date.now(),
          bookingId: assignedBookingId || undefined,
          senderId: assignedProvider.userId,
          receiverId: currentUser?.id || 'cust-1',
          senderName: assignedProvider.businessName,
          text: randomReply,
          mediaType: 'text',
          timestamp: new Date().toISOString(),
          read: true
        }
      ]);
    }, 1200);
  };

  // Customer uploads photo/picture
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assignedProvider) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        bookingId: assignedBookingId || undefined,
        conversationId: conversationId || undefined,
        senderId: currentUser?.id || 'cust-1',
        receiverId: assignedProvider.userId,
        senderName: currentUser?.name || 'Customer',
        text: 'Uploaded a photo for inspection',
        mediaType: 'image',
        mediaUrl: url,
        timestamp: new Date().toISOString(),
        read: true
      };
      setMessages((prev) => [...prev, newMsg]);

      // Specialist acknowledges photo
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg-ack-photo-' + Date.now(),
            bookingId: assignedBookingId || undefined,
            senderId: assignedProvider.userId,
            receiverId: currentUser?.id || 'cust-1',
            senderName: assignedProvider.businessName,
            text: 'I see the photo clearly! I will bring the exact matching component needed for this setup.',
            mediaType: 'text',
            timestamp: new Date().toISOString(),
            read: true
          }
        ]);
      }, 1500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Customer uploads video
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assignedProvider) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        bookingId: assignedBookingId || undefined,
        conversationId: conversationId || undefined,
        senderId: currentUser?.id || 'cust-1',
        receiverId: assignedProvider.userId,
        senderName: currentUser?.name || 'Customer',
        text: 'Uploaded a diagnostic video',
        mediaType: 'video',
        mediaUrl: url,
        timestamp: new Date().toISOString(),
        read: true
      };
      setMessages((prev) => [...prev, newMsg]);

      // Specialist acknowledges video
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg-ack-video-' + Date.now(),
            bookingId: assignedBookingId || undefined,
            senderId: assignedProvider.userId,
            receiverId: currentUser?.id || 'cust-1',
            senderName: assignedProvider.businessName,
            text: 'Reviewed your video. Diagnostic verified. You can also start an audio or video call if needed!',
            mediaType: 'text',
            timestamp: new Date().toISOString(),
            read: true
          }
        ]);
      }, 2000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Provider creates an invoice
  const handleCreateInvoice = async () => {
    if (!assignedProvider) return;
    const labor = Number(laborAmount) || 0;
    const materials = Number(materialsAmount) || 0;
    const total = labor + materials + 1.0;
    const fee = Math.round(total * 0.06 * 100) / 100;

    const newInvoice: ChatInvoice = {
      id: 'inv-' + Date.now(),
      bookingId: assignedBookingId || undefined,
      providerId: assignedProvider.userId,
      providerName: assignedProvider.businessName,
      customerId: currentUser?.id || 'cust-1',
      customerName: currentUser?.name || 'Customer',
      laborAmount: labor,
      materialsAmount: materials,
      consultationFee: 1.0,
      commissionFee: fee,
      platformFeePercent: 6,
      platformFeeAmount: fee,
      totalAmount: total,
      providerEarnings: Math.round((total - fee) * 100) / 100,
      status: 'pending',
      notes: invoiceNotes || 'Labor and materials',
      createdAt: new Date().toISOString()
    };

    setActiveInvoices((prev) => [...prev, newInvoice]);
    setShowInvoiceCreator(false);

    // Also add system notice to chat
    setMessages((prev) => [
      ...prev,
      {
        id: 'msg-inv-created-' + Date.now(),
        bookingId: assignedBookingId || undefined,
        senderId: assignedProvider.userId,
        receiverId: currentUser?.id || 'cust-1',
        senderName: assignedProvider.businessName,
        text: `📄 New Invoice Issued: $${total.toFixed(2)} (Labor: $${labor.toFixed(2)} + Materials: $${materials.toFixed(2)} + $1.00 Platform Fee). You can pay directly below!`,
        mediaType: 'text',
        timestamp: new Date().toISOString(),
        read: true
      }
    ]);
  };

  // Customer pays the invoice directly in chat
  const handlePayInvoice = async (invoiceId: string, method: 'credit' | 'card') => {
    setPayingInvoiceId(invoiceId);
    setPaymentError(null);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Mark as confirmed
        setActiveInvoices((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'confirmed', paymentMethod: method } : inv))
        );

        if (method === 'credit' && currentUser) {
          currentUser.walletBalance = Math.max(
            0,
            Math.round(((currentUser.walletBalance || 0) - (paymentModalInvoice?.totalAmount || 0)) * 100) / 100
          );
        }

        // System receipt in chat
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg-paid-' + Date.now(),
            bookingId: assignedBookingId || undefined,
            senderId: currentUser?.id || 'cust-1',
            receiverId: assignedProvider?.userId || 'prov-1',
            senderName: currentUser?.name || 'Customer',
            text: `✅ Invoice #${invoiceId} Confirmed & Paid via ${method === 'credit' ? 'Credit' : 'Card'}! Booking status is now Confirmed and funds held in Servexa Escrow.`,
            mediaType: 'text',
            timestamp: new Date().toISOString(),
            read: true
          }
        ]);
        setPaymentModalInvoice(null);
      } else {
        setPaymentError(data.error || 'Payment failed');
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Invoice pay error');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  // Quick buy product from store drawer
  const handleBuyStoreProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser?.id || 'cust-1',
          quantity: 1,
          paymentMethod: 'card'
        })
      });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg-prod-bought-' + Date.now(),
            bookingId: assignedBookingId || undefined,
            senderId: currentUser?.id || 'cust-1',
            receiverId: assignedProvider?.userId || 'prov-1',
            senderName: currentUser?.name || 'Customer',
            text: `🛍️ Purchased "${product.name}" ($${product.price.toFixed(2)}) from your store. Specialist will bring this item upon arrival!`,
            mediaType: 'text',
            timestamp: new Date().toISOString(),
            read: true
          }
        ]);
        setIsStoreOpen(false);
      }
    } catch (e) {
      console.error('Store product purchase error:', e);
    }
  };

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* PHASE 1: ISSUE INPUT */}
        {phase === 'issue_input' && (
          <div className="p-6 sm:p-8 flex flex-col justify-between h-full overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden p-1 shrink-0">
                    {category.characterImage ? (
                      <img
                        src={category.characterImage}
                        alt={category.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Sparkles className="w-8 h-8 text-indigo-600 m-2" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      {category.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {category.characterAction || 'Ready for immediate dispatch'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Prompt Question */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Describe what you need help with
                </label>

                {/* Textarea */}
                <textarea
                  rows={3}
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="Describe your problem or request in detail..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                />
              </div>

              {/* Location Reference */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-6">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{customerLocation.address}</span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartDispatch}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-2"
              >
                <span>Find Specialist</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: 15-SECOND RADIAL ACCEPTANCE COUNTDOWN */}
        {phase === 'searching_15s' && (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center my-auto">
            {/* Radial Countdown Timer */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - secondsRemaining / 15)}
                  className="text-indigo-600 transition-all duration-1000 ease-linear stroke-round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {secondsRemaining}s
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                  Accept Time
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
              <span>Order #{ticketId || 'ORD-9821'} Dispatched</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">
              Waiting for Service Provider to Accept
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Your order has been broadcasted to verified specialists. The chatbox will open automatically the moment a provider accepts your order.
            </p>

            {/* Provider Acceptance Simulation / Instant Accept for testing */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => simulateSpecialistAccept()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulate Provider Acceptance (Open Chat)</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                <span>Broadcasting to specialists within 10km...</span>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: CONNECTED CHAT BOX */}
        {phase === 'chat_connected' && assignedProvider && (
          <div className="flex flex-col h-[85vh] sm:h-[680px]">
            {/* Chat Header */}
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shadow-md shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <img
                    src={assignedProvider.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={assignedProvider.businessName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400"
                  />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 absolute bottom-0 right-0" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                      {assignedProvider.businessName}
                    </h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Specialist • ⭐ {assignedProvider.rating || 4.9} • {assignedProvider.completedJobs || 120} jobs
                  </p>
                </div>
              </div>

              {/* Action Buttons in Header: Call, Video, Store, Close */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Audio Call */}
                <button
                  type="button"
                  onClick={() =>
                    initiateCall(
                      assignedProvider.userId,
                      assignedProvider.businessName,
                      'provider',
                      assignedBookingId || undefined,
                      'audio'
                    )
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-all cursor-pointer"
                  title="Audio Call"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>

                {/* Video Call */}
                <button
                  type="button"
                  onClick={() =>
                    initiateCall(
                      assignedProvider.userId,
                      assignedProvider.businessName,
                      'provider',
                      assignedBookingId || undefined,
                      'video'
                    )
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white transition-all cursor-pointer"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>

                {/* Customer Profile Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDrawerOpen(!isProfileDrawerOpen);
                    setIsStoreOpen(false);
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    isProfileDrawerOpen
                      ? 'bg-teal-500 text-slate-900 font-bold'
                      : 'bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white'
                  }`}
                  title="View Customer Profile"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">Profile</span>
                </button>

                {/* Small Store Icon */}
                <button
                  type="button"
                  onClick={() => {
                    setIsStoreOpen(!isStoreOpen);
                    setIsProfileDrawerOpen(false);
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                    isStoreOpen
                      ? 'bg-amber-500 text-slate-900 font-bold'
                      : 'bg-slate-800 hover:bg-amber-500 text-amber-400 hover:text-slate-900'
                  }`}
                  title="Browse Specialist Store"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">Store</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* In-Chat Location Radar Bar: Shows Both Locations */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate"><strong>You:</strong> {customerLocation.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-teal-600" />
                  {providerLocation.distanceKm} km away • ETA {providerLocation.etaMins}m
                </span>
              </div>
            </div>

            {/* Chat Body & Store Drawer Container */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.map((msg) => {
                  const isMe = msg.senderId === (currentUser?.id || 'cust-1');
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-1 px-1">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-teal-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}

                        {/* Image Attachment Rendering */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                            <img
                              src={msg.mediaUrl}
                              alt="Customer attachment"
                              className="max-h-60 max-w-full rounded-xl object-contain bg-slate-900"
                            />
                          </div>
                        )}

                        {/* Video Attachment Rendering */}
                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-h-60 max-w-full rounded-xl bg-black"
                            />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {/* INVOICES DISPLAYED INSIDE CHAT */}
                {activeInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white border-2 border-indigo-200 shadow-md max-w-sm mx-auto my-2"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Service Invoice</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          inv.status === 'paid' || inv.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {inv.status === 'paid' || inv.status === 'confirmed' ? 'Confirmed' : 'Awaiting Payment'}
                      </span>
                    </div>

                    <div className="py-2.5 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Labor Service:</span>
                        <span className="font-mono">${inv.laborAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Materials & Hardware:</span>
                        <span className="font-mono">${inv.materialsAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Platform Consultation Fee:</span>
                        <span className="font-mono">${inv.consultationFee.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-slate-900">
                        <span>Total Amount:</span>
                        <span className="font-mono text-indigo-700">${inv.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {inv.status === 'pending' ? (
                      currentUser?.role !== 'provider' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentModalInvoice(inv);
                            setPaymentError(null);
                          }}
                          className="mt-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay ${inv.totalAmount.toFixed(2)} in Chat
                        </button>
                      ) : (
                        <div className="mt-2 p-2 rounded-xl bg-amber-50 text-amber-800 text-center text-xs font-semibold border border-amber-200">
                          Awaiting Customer Payment (${inv.totalAmount.toFixed(2)})
                        </div>
                      )
                    ) : (
                      <div className="mt-2 p-2 rounded-xl bg-emerald-50 text-emerald-700 text-center text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Status: Confirmed ({inv.paymentMethod === 'credit' ? 'Paid by Credit' : 'Paid by Card'})
                      </div>
                    )}
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* PAYMENT METHOD MODAL (CREDIT VS CARD) */}
              {paymentModalInvoice && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
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

                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-900">Total Amount Due:</span>
                      <span className="text-lg font-black text-indigo-700 font-mono">
                        ${paymentModalInvoice.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    {paymentError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        How would you like to pay?
                      </p>

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
                            selectedPaymentMethod === 'credit'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">Pay by Credit</span>
                            <span className="text-[11px] font-mono font-bold text-slate-700">
                              ${(currentUser?.walletBalance || 0).toFixed(2)} Available
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Deduct directly from your Servexa wallet balance
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
                            selectedPaymentMethod === 'card'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-900 block">Pay by Card</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Credit or Debit Card (Visa, MasterCard, Amex)
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
                        disabled={payingInvoiceId === paymentModalInvoice.id}
                        onClick={() => handlePayInvoice(paymentModalInvoice.id, selectedPaymentMethod)}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {payingInvoiceId === paymentModalInvoice.id ? (
                          <span>Processing...</span>
                        ) : (
                          <span>Confirm & Pay</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIALIST STORE DRAWER (ACCESSED VIA STORE ICON) */}
              {isStoreOpen && (
                <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900">
                        {assignedProvider.businessName} Store
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsStoreOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    <p className="text-[11px] text-slate-500">
                      Genuine parts & supplies stocked by this specialist. Order to have them brought directly to your location.
                    </p>

                    {providerProducts.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        No equipment catalog found for this provider.
                      </div>
                    ) : (
                      providerProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {p.name}
                              </h5>
                              <span className="text-xs font-mono font-bold text-indigo-600">
                                ${p.price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleBuyStoreProduct(p)}
                            className="w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Add to Job
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* CUSTOMER PROFILE DRAWER (ACCESSED VIA PROFILE BUTTON) */}
              {isProfileDrawerOpen && (
                <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-teal-600" />
                      <h4 className="text-xs font-bold text-slate-900">
                        Customer Profile
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProfileDrawerOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={currentUser?.name}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-teal-500 shadow-xs"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {currentUser?.name || 'Alex Rivera'}
                          </h5>
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'alex@example.com'}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser?.phone || '+1 (415) 890-1234'}</p>
                      </div>
                    </div>

                    {/* Wallet Card */}
                    <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-teal-900 block uppercase tracking-wider">Wallet Balance</span>
                        <span className="text-sm font-bold text-teal-800 font-mono">${(currentUser?.walletBalance ?? 0).toFixed(2)}</span>
                      </div>
                      <Wallet className="w-5 h-5 text-teal-600" />
                    </div>

                    {/* Loyalty & Rewards Tracker */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Loyalty Rewards Rules</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between items-center text-slate-700">
                          <span>10 Jobs Milestone:</span>
                          <span className="font-bold text-emerald-600">10% Bonus</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '80%' }} />
                        </div>
                        <div className="flex justify-between items-center text-slate-700 pt-0.5">
                          <span>20 Jobs Milestone:</span>
                          <span className="font-bold text-teal-600">20% Bonus</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700 pt-0.5">
                          <span>15 Services Rule:</span>
                          <span className="font-bold text-indigo-600">1 Free Service</span>
                        </div>
                      </div>
                    </div>

                    {/* Service Location */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Active Service Location</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{customerLocation.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Creator Drawer (ONLY for service provider) */}
            {showInvoiceCreator && currentUser?.role === 'provider' && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Create Job Invoice
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceCreator(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Labor Fee ($)
                    </label>
                    <input
                      type="number"
                      value={laborAmount}
                      onChange={(e) => setLaborAmount(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Materials ($)
                    </label>
                    <input
                      type="number"
                      value={materialsAmount}
                      onChange={(e) => setMaterialsAmount(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mb-3 text-slate-600">
                  <span>Platform Fee (6% + $1):</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${((Number(laborAmount) + Number(materialsAmount) + 1.0) * 0.06 + 1.0).toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Issue Invoice to Chat
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Hidden file pickers */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />

              {/* Photo upload button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors cursor-pointer shrink-0"
                title="Upload Photo / Picture"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Video upload button */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors cursor-pointer shrink-0"
                title="Upload Video"
              >
                <Video className="w-4 h-4" />
              </button>

              {/* Direct Audio Call button */}
              <button
                type="button"
                onClick={() =>
                  initiateCall(
                    assignedProvider.userId,
                    assignedProvider.businessName,
                    'provider',
                    assignedBookingId || undefined,
                    'audio'
                  )
                }
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer shrink-0"
                title="Audio Call"
              >
                <PhoneCall className="w-4 h-4" />
              </button>

              {/* Option to create invoice - ONLY visible to service provider */}
              {currentUser?.role === 'provider' && (
                <button
                  type="button"
                  onClick={() => setShowInvoiceCreator(!showInvoiceCreator)}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors cursor-pointer shrink-0"
                  title="Create Invoice (Service Provider Only)"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}

              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message, issue details..."
                className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputMsg.trim()}
                className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
