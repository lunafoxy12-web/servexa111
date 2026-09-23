import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, PBXCall, AppNotification, RealtimeEvent } from '../types';
import { pbxAudio } from '../utils/audioEngine';
import { auth, googleProvider, signInWithPopup, signOut as fbSignOut, testConnection } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  role: 'customer' | 'provider' | 'admin' | null;
  activeView: 'customer' | 'provider' | 'admin';
  setActiveView: (view: 'customer' | 'provider' | 'admin') => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (roleOverride?: 'customer' | 'provider') => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  loginWithWallet: (walletAddress?: string, roleOverride?: 'customer' | 'provider') => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  notifications: AppNotification[];
  unreadNotifsCount: number;
  markNotificationsAsRead: () => void;
  // PBX VoIP
  activeCall: PBXCall | null;
  incomingCall: PBXCall | null;
  initiateCall: (calleeId: string, calleeName: string, calleeRole: any, bookingId?: string, callType?: 'audio' | 'video') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  // Modals & Drawers
  activeChatBookingId: string | null;
  openChat: (bookingId: string) => void;
  closeChat: () => void;
  selectedProviderId: string | null;
  openProviderProfile: (providerId: string) => void;
  closeProviderProfile: () => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  aiInitialPrompt: string;
  setAiInitialPrompt: (prompt: string) => void;
  openAiModalWithPrompt: (prompt?: string) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  // Profile Modal
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  updateUserLocally: (updates: Partial<User>) => void;
  // Complaints & Disputes
  activeComplaintId: string | null;
  openComplaintChat: (complaintId: string) => void;
  closeComplaintChat: () => void;
  isComplaintModalOpen: boolean;
  setIsComplaintModalOpen: (open: boolean) => void;
  complaintPrefillBookingId: string | null;
  openFileComplaint: (bookingId?: string) => void;
  closeFileComplaint: () => void;
  // Live GPS Tracking HUD
  activeTrackingBookingId: string | null;
  openLiveTracking: (bookingId: string) => void;
  closeLiveTracking: () => void;
  // Email Verification
  isEmailVerifyModalOpen: boolean;
  setIsEmailVerifyModalOpen: (open: boolean) => void;
  pendingVerifyEmail: string;
  setPendingVerifyEmail: (email: string) => void;
  latestVerificationCode: string | null;
  sendEmailVerification: (email?: string) => Promise<{ success: boolean; message?: string; code?: string; error?: string }>;
  verifyEmailCode: (code: string, email?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  // Storefront Direct Portal
  activeStorefrontSubdomain: string | null;
  openStorefrontSubdomain: (subdomain: string) => void;
  closeStorefrontSubdomain: () => void;
  globalRefreshKey: number;
  triggerGlobalRefresh: () => void;
  lastRealtimeEvent: RealtimeEvent | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('servexa_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [activeView, setActiveView] = useState<'customer' | 'provider' | 'admin'>(() => {
    const saved = localStorage.getItem('servexa_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.role === 'provider') return 'provider';
        if (parsed?.role === 'admin') return 'admin';
      } catch (e) {}
    }
    return 'customer';
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeCall, setActiveCall] = useState<PBXCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<PBXCall | null>(null);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');

  const openAiModalWithPrompt = useCallback((prompt?: string) => {
    if (prompt !== undefined) {
      setAiInitialPrompt(prompt);
    }
    setIsAiModalOpen(true);
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const updateUserLocally = useCallback((updates: Partial<User>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('servexa_user', JSON.stringify(updated));
      return updated;
    });
  }, []);
  // Complaints & Dispute Resolution
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState<boolean>(false);
  const [complaintPrefillBookingId, setComplaintPrefillBookingId] = useState<string | null>(null);
  // Live GPS Tracking HUD
  const [activeTrackingBookingId, setActiveTrackingBookingId] = useState<string | null>(null);
  // Email Verification & Cross Device Session State
  const [isEmailVerifyModalOpen, setIsEmailVerifyModalOpen] = useState<boolean>(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string>('');
  const [latestVerificationCode, setLatestVerificationCode] = useState<string | null>(null);
  // Direct Storefront Subdomain State
  const [activeStorefrontSubdomain, setActiveStorefrontSubdomain] = useState<string | null>(null);
  const [globalRefreshKey, setGlobalRefreshKey] = useState<number>(0);
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<RealtimeEvent | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const triggerGlobalRefresh = useCallback(() => {
    setGlobalRefreshKey(k => k + 1);
  }, []);

  const openStorefrontSubdomain = (subdomain: string) => setActiveStorefrontSubdomain(subdomain);
  const closeStorefrontSubdomain = () => setActiveStorefrontSubdomain(null);

  // Cross-device session check & sync on startup, and test Firestore connection
  useEffect(() => {
    testConnection().catch(() => {});

    const saved = localStorage.getItem('servexa_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          fetch(`/api/auth/me?userId=${parsed.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.user) {
                setCurrentUser(data.user);
                localStorage.setItem('servexa_user', JSON.stringify(data.user));
              }
            })
            .catch(() => {});
        }
      } catch (e) {}
    }
  }, []);

  // Sync active view when user role changes
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setActiveView('admin');
    } else if (currentUser?.role === 'provider') {
      setActiveView('provider');
    } else {
      setActiveView('customer');
    }
  }, [currentUser?.role]);

  // WebSocket connection & real-time event router
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let ws: WebSocket;
    let reconnectTimer: any;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setSocket(ws);
          if (currentUser) {
            ws.send(JSON.stringify({
              type: 'IDENTIFY',
              userId: currentUser.id,
              role: currentUser.role
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data: RealtimeEvent = JSON.parse(event.data);
            handleRealtimeEvent(data);
          } catch (e) {
            console.error('Error handling ws message:', e);
          }
        };

        ws.onclose = () => {
          setSocket(null);
          reconnectTimer = setTimeout(connect, 2500);
        };
      } catch (e) {
        console.warn('WebSocket connection error:', e);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [currentUser?.id]);

  // Handle incoming real-time events from server
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    setLastRealtimeEvent(event);
    triggerGlobalRefresh();

    if (event.type === 'USER_STATUS_UPDATED') {
      const payload = event.payload;
      // If current user is modified, update immediately
      if (currentUser && currentUser.id === payload.userId) {
        setCurrentUser(prev => prev ? { ...prev, status: payload.status, verified: payload.verified ?? prev.verified } : null);
      }
    } else if (event.type === 'PBX_CALL_INVITE') {
      const callData: PBXCall = event.payload;
      if (callData.calleeId === currentUser?.id) {
        setIncomingCall(callData);
        pbxAudio.startRingtone('incoming');
      }
    } else if (event.type === 'PBX_CALL_ANSWER') {
      pbxAudio.stopRingtone();
      setActiveCall(prev => prev ? { ...prev, status: 'connected', startedAt: new Date().toISOString() } : null);
    } else if (event.type === 'PBX_CALL_REJECT' || event.type === 'PBX_CALL_HANGUP') {
      pbxAudio.stopRingtone();
      pbxAudio.endVoiceSession();
      setActiveCall(null);
      setIncomingCall(null);
    } else if (event.type === 'WALLET_UPDATED') {
      const payload = event.payload;
      if (currentUser && currentUser.id === payload.userId) {
        setCurrentUser(prev => prev ? { ...prev, walletBalance: payload.newBalance } : null);
      }
    } else if (
      event.type === 'COMPLAINT_MESSAGE' ||
      event.type === 'COMPLAINT_CREATED' ||
      event.type === 'COMPLAINT_UPDATED' ||
      event.type === 'LOCATION_UPDATE'
    ) {
      triggerGlobalRefresh();
    } else if (event.type === 'NOTIFICATION') {
      setNotifications(prev => [
        {
          id: 'notif-' + Date.now(),
          userId: currentUser?.id || 'all',
          title: event.payload.title || 'Notification',
          message: event.payload.message || '',
          type: 'system',
          read: false,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    }
  }, [currentUser, triggerGlobalRefresh]);

  // Fetch initial notifications
  useEffect(() => {
    if (currentUser?.id) {
      fetch(`/api/notifications/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(console.error);
    }
  }, [currentUser?.id, globalRefreshKey]);

  // Refresh user profile & wallet from API
  const refreshUser = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/wallet/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(prev => prev ? { ...prev, walletBalance: data.balance } : null);
      }
    } catch (e) {
      console.error('Error refreshing wallet:', e);
    }
  }, [currentUser?.id]);

  // Login handler supporting Stealth Admin (Mr-Pirate / Piratesworld123$$)
  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('servexa_user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        setActiveView('admin');
      } else if (data.user.role === 'provider') {
        setActiveView('provider');
      } else {
        setActiveView('customer');
      }

      setIsAuthModalOpen(false);
      triggerGlobalRefresh();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network connection failure' };
    }
  };

  const loginWithGoogle = async (roleOverride?: 'customer' | 'provider') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || 'Google User',
          avatar: fbUser.photoURL || '',
          role: roleOverride || 'customer'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google authentication failed' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('servexa_user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        setActiveView('admin');
      } else if (data.user.role === 'provider') {
        setActiveView('provider');
      } else {
        setActiveView('customer');
      }

      setIsAuthModalOpen(false);
      triggerGlobalRefresh();
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
        // User intentionally closed the popup window - gracefully return without noisy error
        return { success: false, cancelled: true };
      }
      console.warn('[Firebase Auth] Google login note:', e?.message || e);
      return { success: false, error: e.message || 'Google sign-in was not completed.' };
    }
  };

  const loginWithWallet = async (walletAddress?: string, roleOverride: 'customer' | 'provider' = 'customer') => {
    try {
      let address = walletAddress;
      // If browser has an injected Web3 wallet (MetaMask, Coinbase Wallet, Phantom, etc.)
      if (!address && typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts[0]) {
            address = accounts[0];
          }
        } catch (err) {
          console.warn('Web3 wallet account prompt dismissed or unavailable, using deterministic wallet session:', err);
        }
      }

      // If no injected Web3 or rejected, generate a unique deterministic wallet address
      if (!address) {
        const hex = Array.from({ length: 4 }, () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')).join('');
        address = `0x71C${hex.slice(0, 4)}...${hex.slice(4, 8)}`;
      }

      const shortAddr = address.length > 13 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
      const cleanId = address.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || String(Date.now());

      let customerUser: User;

      try {
        const res = await fetch('/api/auth/wallet-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            role: roleOverride,
            name: `Customer (${shortAddr})`
          })
        });
        if (res.ok) {
          const data = await res.json();
          customerUser = data.user;
        } else {
          throw new Error('Server wallet login fallback');
        }
      } catch {
        customerUser = {
          id: `cust-${cleanId}`,
          name: `Customer (${shortAddr})`,
          email: `${cleanId.toLowerCase()}@servexa.io`,
          phone: '+1 (555) 000-1122',
          role: roleOverride,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
          status: 'active',
          verified: true,
          walletBalance: 0.00, // 0 credits for new user
          walletAddress: address,
          preferredCurrency: 'USD',
          createdAt: new Date().toISOString()
        };
      }

      setCurrentUser(customerUser);
      localStorage.setItem('servexa_user', JSON.stringify(customerUser));

      if (customerUser.role === 'provider') {
        setActiveView('provider');
      } else {
        setActiveView('customer');
      }

      setIsAuthModalOpen(false);
      triggerGlobalRefresh();
      return { success: true, user: customerUser };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to connect wallet' };
    }
  };

  const register = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('servexa_user', JSON.stringify(data.user));

      // Route directly to the corresponding view panel
      if (data.user.role === 'provider') {
        setActiveView('provider');
      } else if (data.user.role === 'admin') {
        setActiveView('admin');
      } else {
        setActiveView('customer');
      }

      setIsAuthModalOpen(false);
      triggerGlobalRefresh();

      // Open email verification modal immediately with dispatched code
      if (data.verificationCode) {
        setLatestVerificationCode(data.verificationCode);
        setPendingVerifyEmail(data.user.email);
        setIsEmailVerifyModalOpen(true);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const sendEmailVerification = async (email?: string) => {
    const targetEmail = email || currentUser?.email;
    if (!targetEmail) return { success: false, error: 'No email specified' };
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      setLatestVerificationCode(data.code || null);
      setPendingVerifyEmail(targetEmail);
      setIsEmailVerifyModalOpen(true);
      return { success: true, message: data.message, code: data.code };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to dispatch verification email' };
    }
  };

  const verifyEmailCode = async (code: string, email?: string) => {
    const targetEmail = email || pendingVerifyEmail || currentUser?.email;
    if (!targetEmail) return { success: false, error: 'No email specified' };
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code, userId: currentUser?.id })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      if (data.user && currentUser?.id === data.user.id) {
        setCurrentUser(data.user);
        localStorage.setItem('servexa_user', JSON.stringify(data.user));
      }
      setIsEmailVerifyModalOpen(false);
      triggerGlobalRefresh();
      return { success: true, message: data.message };
    } catch (e: any) {
      return { success: false, error: e.message || 'Verification failure' };
    }
  };

  const logout = () => {
    fbSignOut(auth).catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem('servexa_user');
    setActiveView('customer');
    setActiveCall(null);
    setIncomingCall(null);
    pbxAudio.stopRingtone();
    pbxAudio.endVoiceSession();
  };

  const markNotificationsAsRead = () => {
    if (currentUser?.id) {
      fetch(`/api/notifications/${currentUser.id}/read`, { method: 'POST' }).catch(console.error);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // PBX Calling actions
  const initiateCall = (calleeId: string, calleeName: string, calleeRole: any, bookingId?: string, callType: 'audio' | 'video' = 'audio') => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const newCall: PBXCall = {
      id: 'call-' + Date.now(),
      callerId: currentUser.id,
      callerName: currentUser.name,
      callerRole: currentUser.role,
      calleeId,
      calleeName,
      calleeRole,
      bookingId,
      callType,
      status: 'ringing',
      durationSeconds: 0,
      codec: callType === 'video' ? 'H.264/VP9-Opus' : 'Opus-Adaptive-64k',
      bitrateKbps: callType === 'video' ? 1200 : 64,
      packetLossPct: 0.1,
      jitterMs: 4.2,
      isEncrypted: true
    };

    setActiveCall(newCall);
    pbxAudio.startRingtone('outgoing');

    // Send through WebSocket to peer
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'PBX_CALL_INVITE',
        payload: { ...newCall, targetUserId: calleeId }
      }));
    }

    // Auto-answer simulation for demo if recipient isn't in another tab
    setTimeout(() => {
      setActiveCall(prev => {
        if (prev && prev.status === 'ringing') {
          pbxAudio.stopRingtone();
          return { ...prev, status: 'connected', startedAt: new Date().toISOString() };
        }
        return prev;
      });
    }, 4500);
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    pbxAudio.stopRingtone();
    const connectedCall = {
      ...incomingCall,
      status: 'connected' as const,
      startedAt: new Date().toISOString()
    };
    setActiveCall(connectedCall);
    setIncomingCall(null);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'PBX_CALL_ANSWER',
        payload: { targetUserId: connectedCall.callerId, callId: connectedCall.id }
      }));
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    pbxAudio.stopRingtone();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'PBX_CALL_REJECT',
        payload: { targetUserId: incomingCall.callerId, callId: incomingCall.id }
      }));
    }
    setIncomingCall(null);
  };

  const endCall = () => {
    pbxAudio.stopRingtone();
    pbxAudio.endVoiceSession();
    if (activeCall && socket && socket.readyState === WebSocket.OPEN) {
      const target = activeCall.callerId === currentUser?.id ? activeCall.calleeId : activeCall.callerId;
      socket.send(JSON.stringify({
        type: 'PBX_CALL_HANGUP',
        payload: { targetUserId: target, callId: activeCall.id }
      }));
    }
    setActiveCall(null);
    setIncomingCall(null);
  };

  const openChat = (bookingId: string) => {
    if (!currentUser) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setActiveChatBookingId(bookingId);
  };
  const closeChat = () => setActiveChatBookingId(null);

  const openComplaintChat = (complaintId: string) => setActiveComplaintId(complaintId);
  const closeComplaintChat = () => setActiveComplaintId(null);

  const openFileComplaint = (bookingId?: string) => {
    setComplaintPrefillBookingId(bookingId || null);
    setIsComplaintModalOpen(true);
  };
  const closeFileComplaint = () => {
    setIsComplaintModalOpen(false);
    setComplaintPrefillBookingId(null);
  };

  const openLiveTracking = (bookingId: string) => setActiveTrackingBookingId(bookingId);
  const closeLiveTracking = () => setActiveTrackingBookingId(null);

  const openProviderProfile = (providerId: string) => {
    if (!currentUser) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedProviderId(providerId);
  };
  const closeProviderProfile = () => setSelectedProviderId(null);

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        activeView,
        setActiveView,
        login,
        loginWithGoogle,
        loginWithWallet,
        register,
        logout,
        refreshUser,
        notifications,
        unreadNotifsCount,
        markNotificationsAsRead,
        activeCall,
        incomingCall,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        activeChatBookingId,
        openChat,
        closeChat,
        activeComplaintId,
        openComplaintChat,
        closeComplaintChat,
        isComplaintModalOpen,
        setIsComplaintModalOpen,
        complaintPrefillBookingId,
        openFileComplaint,
        closeFileComplaint,
        activeTrackingBookingId,
        openLiveTracking,
        closeLiveTracking,
        // Email Verification
        isEmailVerifyModalOpen,
        setIsEmailVerifyModalOpen,
        pendingVerifyEmail,
        setPendingVerifyEmail,
        latestVerificationCode,
        sendEmailVerification,
        verifyEmailCode,
        // Storefront Direct Portal
        activeStorefrontSubdomain,
        openStorefrontSubdomain,
        closeStorefrontSubdomain,
        selectedProviderId,
        openProviderProfile,
        closeProviderProfile,
        isAiModalOpen,
        setIsAiModalOpen,
        aiInitialPrompt,
        setAiInitialPrompt,
        openAiModalWithPrompt,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        isProfileModalOpen,
        setIsProfileModalOpen,
        updateUserLocally,
        globalRefreshKey,
        triggerGlobalRefresh,
        lastRealtimeEvent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
