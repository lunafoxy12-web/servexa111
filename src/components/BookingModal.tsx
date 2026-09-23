import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ProviderProfile, ServiceItem } from '../types';
import { GoogleDeliveryMap } from './common/GoogleDeliveryMap';
import {
  X,
  Calendar,
  CreditCard,
  Wallet,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Navigation,
  Crosshair,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface BookingModalProps {
  provider: ProviderProfile | null;
  service: ServiceItem | null;
  onClose: () => void;
  onBookingSuccess: (booking: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  provider,
  service,
  onClose,
  onBookingSuccess
}) => {
  const { currentUser, setIsAuthModalOpen, refreshUser } = useAuth();

  const [bookingType, setBookingType] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState('742 Market St, San Francisco, CA');
  const [destinationAddress, setDestinationAddress] = useState('SFO International Terminal 3');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 });
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [notes, setNotes] = useState('');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Real-time location capture via browser Geolocation & reverse geocoding
  const captureRealTimeLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported by device/browser');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring real-time GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        
        setCoords({ lat: latitude, lng: longitude });
        setLocationAccuracy(`±${accuracy}m`);
        setLocationStatus(`Real-time GPS lock (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);

        try {
          const res = await fetch(`/api/geo/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              setPickupAddress(data.address);
              setLocationStatus(`Live address verified: ${data.city || 'Nearby'}`);
            }
          }
        } catch (geoErr) {
          console.warn('Reverse geocode error:', geoErr);
          setPickupAddress(`GPS Position (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation capture failed or denied:', err);
        setIsLocating(false);
        if (err.code === 1) {
          setLocationStatus('GPS permission needed. Using verified district.');
        } else {
          setLocationStatus('GPS signal timeout. Retaining current pin.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  // Attempt real-time location capture on open
  useEffect(() => {
    captureRealTimeLocation();
  }, []);

  if (!provider || !service) return null;

  const isRideOrDelivery = service?.priceType === 'km' || service?.categoryId === 'cat-taxi' || service?.categoryId === 'cat-delivery';
  const basePrice = service?.priceType === 'km' ? 38.40 : (typeof service?.price === 'number' ? service.price : 45.00);
  const platformCommissionRatePct = 5;
  const commissionFee = Math.round((basePrice || 0) * (platformCommissionRatePct / 100) * 100) / 100;
  const providerEarnings = Math.round(((basePrice || 0) - commissionFee) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (paymentMethod === 'wallet' && (currentUser.walletBalance ?? 0) < basePrice) {
      setError(`Insufficient wallet balance ($${(currentUser.walletBalance ?? 0).toFixed(2)}). Please choose Card or top up wallet.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          providerId: provider.userId,
          serviceName: service.name,
          categoryId: service.categoryId,
          bookingType,
          pricingModel: service.priceType,
          pickupLocation: {
            lat: coords.lat,
            lng: coords.lng,
            address: pickupAddress
          },
          destinationLocation: isRideOrDelivery
            ? {
                lat: coords.lat + 0.045,
                lng: coords.lng + 0.035,
                address: destinationAddress
              }
            : undefined,
          price: basePrice,
          paymentMethod,
          notes,
          scheduledTime: bookingType === 'scheduled' ? `${scheduledDate} ${scheduledTime}` : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Booking creation failed');
      }

      await refreshUser();
      setConfirmedBooking(data);
      // Auto-transition to order tracking after 2.4s or upon clicking the button
      setTimeout(() => {
        onBookingSuccess(data);
        onClose();
      }, 2400);
    } catch (err: any) {
      setError(err.message || 'Payment or reservation could not be processed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]"
      >
        {confirmedBooking ? (
          /* Subtle Framer Motion Animated Success State Transition */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="p-8 text-center flex flex-col items-center justify-center min-h-[380px]"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-lg ring-8 ring-emerald-50"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                RESERVATION CONFIRMED
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                Booking #{confirmedBooking.id || 'SRV-8941'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Your appointment with <strong>{provider.businessName}</strong> has been confirmed and broadcast to dispatch.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-5 text-left text-xs space-y-1.5 font-medium text-slate-700"
            >
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-bold text-emerald-600 font-mono">${(basePrice ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup / Location:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{pickupAddress}</span>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              onClick={() => {
                onBookingSuccess(confirmedBooking);
                onClose();
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Launch Live GPS Tracker Now</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Universal Booking Engine
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">{service.name}</h2>
            <p className="text-xs text-slate-500">Provider: {provider.businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Booking Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Schedule</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBookingType('instant')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  bookingType === 'instant'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Instant Dispatch
              </button>
              <button
                type="button"
                onClick={() => setBookingType('scheduled')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  bookingType === 'scheduled'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule Later
              </button>
            </div>
          </div>

          {bookingType === 'scheduled' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Location fields with Real-Time GPS Capture */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Service / Pickup Location
              </label>
              <button
                type="button"
                onClick={captureRealTimeLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Detect exact coordinates via real-time browser GPS"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3 h-3 text-indigo-600" />
                    <span>Locate Real Position</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter street address or use real-time GPS"
              />
            </div>

            {/* Real-Time GPS Telemetry & Google Maps JavaScript API Map Visualization */}
            <div className="mt-2">
              <GoogleDeliveryMap
                lat={coords.lat}
                lng={coords.lng}
                onLocationChange={(newLat, newLng) => {
                  setCoords({ lat: newLat, lng: newLng });
                  setLocationStatus(`Manual delivery pin (${newLat.toFixed(5)}, ${newLng.toFixed(5)})`);
                  fetch(`/api/geo/reverse-geocode?lat=${newLat}&lng=${newLng}`)
                    .then((r) => r.json())
                    .then((data) => {
                      if (data?.address) setPickupAddress(data.address);
                    })
                    .catch(() => {});
                }}
                address={pickupAddress}
                accuracy={locationAccuracy}
                statusText={locationStatus}
                isLocating={isLocating}
                onLocateGps={captureRealTimeLocation}
                heightClass="h-44"
              />
            </div>
          </div>

          {isRideOrDelivery && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination / Drop-off</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions or Special Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Buzz code #402, ring doorbell upon arrival"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Transparent Financial Calculation Breakdown */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Service Base Cost</span>
              <span className="font-semibold text-slate-900">${(basePrice ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                Platform Commission ({platformCommissionRatePct}%)
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">
                  Configurable
                </span>
              </span>
              <span className="font-mono text-slate-500">${(commissionFee ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Provider Net Earnings</span>
              <span className="font-mono text-emerald-600 font-semibold">${(providerEarnings ?? 0).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Total Customer Charge</span>
              <span className="text-base font-extrabold text-slate-900">${(basePrice ?? 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold">Credit / Debit Card</span>
                </div>
                <p className="text-[10px] text-slate-500">Stripe Connect Protected</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'wallet'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold">Servexa Wallet</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Balance: ${(currentUser?.walletBalance || 0).toFixed(2)}
                </p>
              </button>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Card number"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="CVC"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Payment & Dispatching...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Authorize & Confirm (${(basePrice ?? 0).toFixed(2)})
              </>
            )}
          </button>
        </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
