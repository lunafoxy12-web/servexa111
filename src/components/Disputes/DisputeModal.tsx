import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';
import {
  AlertTriangle,
  X,
  DollarSign,
  FileText,
  ShieldAlert,
  Send,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const DisputeModal: React.FC = () => {
  const {
    isComplaintModalOpen,
    closeFileComplaint,
    complaintPrefillBookingId,
    openComplaintChat,
    currentUser,
    triggerGlobalRefresh
  } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [category, setCategory] = useState<string>('billing_overcharge');
  const [subject, setSubject] = useState<string>('');
  const [disputeAmount, setDisputeAmount] = useState<string>('15.00');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isComplaintModalOpen) return;

    fetch('/api/bookings')
      .then((r) => r.json())
      .then((bks: Booking[]) => {
        if (Array.isArray(bks)) {
          const relevant = bks.filter(
            (b) => b.customerId === currentUser?.id || b.providerId === currentUser?.id
          );
          setBookings(relevant.length > 0 ? relevant : bks);

          if (complaintPrefillBookingId) {
            setSelectedBookingId(complaintPrefillBookingId);
            const found = bks.find((b) => b.id === complaintPrefillBookingId);
            if (found) {
              setDisputeAmount(found.price ? found.price.toFixed(2) : '15.00');
              setSubject(`Dispute for ${found.serviceName} (#${found.id})`);
            }
          } else if (relevant.length > 0) {
            setSelectedBookingId(relevant[0].id);
            setDisputeAmount(relevant[0].price ? relevant[0].price.toFixed(2) : '15.00');
            setSubject(`Dispute regarding ${relevant[0].serviceName}`);
          }
        }
      })
      .catch(console.error);
  }, [isComplaintModalOpen, complaintPrefillBookingId, currentUser?.id]);

  if (!isComplaintModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError(null);
    setLoading(true);

    try {
      const selectedBooking = bookings.find((b) => b.id === selectedBookingId);
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBookingId || undefined,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          targetUserId:
            currentUser.role === 'customer'
              ? selectedBooking?.providerId
              : selectedBooking?.customerId,
          targetUserName:
            currentUser.role === 'customer'
              ? selectedBooking?.providerName
              : selectedBooking?.customerName,
          subject: subject.trim(),
          category,
          description: description.trim(),
          priority,
          disputeAmount: disputeAmount ? parseFloat(disputeAmount) : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit complaint');
      }

      closeFileComplaint();
      triggerGlobalRefresh();

      // Open the support chat drawer for this complaint immediately!
      if (data.id) {
        openComplaintChat(data.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error creating dispute ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Submit Support Ticket & Order Dispute
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct arbitration with support & instant wallet adjustments
              </p>
            </div>
          </div>
          <button
            onClick={closeFileComplaint}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Associated Order */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Booking / Order
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => {
                setSelectedBookingId(e.target.value);
                const b = bookings.find((bk) => bk.id === e.target.value);
                if (b) {
                  setDisputeAmount(b.price ? b.price.toFixed(2) : '15.00');
                  setSubject(`Dispute for ${b.serviceName} (#${b.id})`);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">General Support / No Specific Order</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.id} • {b.serviceName} (${(b.price ?? 0).toFixed(2)}) — {b.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispute Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="billing_overcharge">Billing / Overcharge</option>
                <option value="driver_location">Driver Delay / GPS Mismatch</option>
                <option value="service_quality">Service Quality Issue</option>
                <option value="cancellation_fee">Unfair Cancellation Fee</option>
                <option value="damage_claim">Property / Vehicle Damage</option>
                <option value="other">Other Dispute</option>
              </select>
            </div>

            {/* Claimed Dispute Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Claimed Refund Amount ($)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={disputeAmount}
                  onChange={(e) => setDisputeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Wait time fee charged unexpectedly"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description & Evidence
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the situation clearly. Support agents and administrators have access to ride logs, PBX call records, and GPS coordinates to verify your claim..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="font-semibold text-slate-700">Urgency Level:</span>
            <div className="flex items-center gap-2">
              {(['medium', 'high', 'urgent'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-bold transition-all text-[11px] cursor-pointer ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-rose-600 text-white'
                        : p === 'high'
                        ? 'bg-amber-500 text-white'
                        : 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Transmitting Ticket...' : 'Submit Dispute & Open Live Support Chat'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
