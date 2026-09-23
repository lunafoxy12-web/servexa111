/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CustomerView } from './components/CustomerView/CustomerView';
import { ProviderView } from './components/ProviderView/ProviderView';
import { AdminView } from './components/AdminView/AdminView';
import { AuthModal } from './components/AuthModal';
import { WalletModal } from './components/WalletModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ProviderProfileModal } from './components/ProviderProfileModal';
import { BookingModal } from './components/BookingModal';
import { PBXCallModal } from './components/PBXVoIP/PBXCallModal';
import { ChatDrawer } from './components/Chat/ChatDrawer';
import { LiveOrderTrackerModal } from './components/Tracking/LiveOrderTrackerModal';
import { DisputeModal } from './components/Disputes/DisputeModal';
import { SupportChatDrawer } from './components/Disputes/SupportChatDrawer';
import { EmailVerificationModal } from './components/Auth/EmailVerificationModal';
import { StorefrontViewModal } from './components/Storefront/StorefrontViewModal';
import { ProfileEditModal } from './components/Profile/ProfileEditModal';
import { ProviderProfile, ServiceItem } from './types';
import { Sparkles, Phone, ShieldCheck, Heart } from 'lucide-react';

function AppContent() {
  const {
    activeView,
    selectedProviderId,
    closeProviderProfile,
    openProviderProfile,
    setIsAiModalOpen,
    currentUser,
    initiateCall,
    openStorefrontSubdomain,
    openLiveTracking
  } = useAuth();

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [bookingProvider, setBookingProvider] = useState<ProviderProfile | null>(null);
  const [bookingService, setBookingService] = useState<ServiceItem | null>(null);

  // Check URL query parameters on load for direct store or tracking links
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store');
    const trackParam = params.get('track');
    if (storeParam) {
      openStorefrontSubdomain(storeParam);
    }
    if (trackParam) {
      openLiveTracking(trackParam);
    }
  }, [openStorefrontSubdomain, openLiveTracking]);

  const handleOpenBookingModal = (provider: ProviderProfile, service: ServiceItem) => {
    setBookingProvider(provider);
    setBookingService(service);
  };

  const handleCloseBookingModal = () => {
    setBookingProvider(null);
    setBookingService(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#edf2ff] via-[#f8fafc] to-[#e8edff] text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Universal Navbar */}
      <Navbar
        onOpenWalletModal={() => setIsWalletOpen(true)}
        onOpenSearch={() => setIsAiModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeView === 'customer' && (
          <CustomerView
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onOpenBookingModal={handleOpenBookingModal}
          />
        )}

        {activeView === 'provider' && <ProviderView />}

        {activeView === 'admin' && currentUser?.role === 'admin' && <AdminView />}
      </main>

      {/* Unique Bottom Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-t-2 border-[#cbd5ff] py-8 text-xs text-slate-300 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm tracking-tight">Servexa</span>
            <span className="text-[#cbd5ff]">•</span>
            <span className="text-slate-300 font-medium">Global Service Marketplace & PBX VoIP Telephony</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-0.5 rounded-md font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              E2EE 256-bit PBX
            </span>
            <span>•</span>
            <span className="text-slate-300 bg-slate-800/80 border border-slate-700/80 px-2.5 py-0.5 rounded-md font-medium">
              Stripe Connect Protected
            </span>
            <span>•</span>
            <span className="text-[#cbd5ff] font-mono font-bold">
              v2.4.0 Production
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2.5">
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Ask Servexa AI Assistant"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span className="text-xs font-bold">Ask AI Concierge</span>
        </button>
      </div>

      {/* Modals and Overlays */}
      <AuthModal />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <AiAssistantModal onSelectCategory={setSelectedCategoryId} />
      <ProviderProfileModal
        providerId={selectedProviderId}
        onClose={closeProviderProfile}
        onBookService={handleOpenBookingModal}
      />
      <BookingModal
        provider={bookingProvider}
        service={bookingService}
        onClose={handleCloseBookingModal}
        onBookingSuccess={() => {
          // Trigger view update
        }}
      />
      <PBXCallModal />
      <ChatDrawer />
      <LiveOrderTrackerModal />
      <DisputeModal />
      <SupportChatDrawer />
      <EmailVerificationModal />
      <StorefrontViewModal />
      <ProfileEditModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
