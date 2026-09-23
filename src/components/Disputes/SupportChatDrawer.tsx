import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintMessage } from '../../types';
import {
  X,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  User,
  Headphones,
  RefreshCw
} from 'lucide-react';

export const SupportChatDrawer: React.FC = () => {
  const {
    activeComplaintId,
    closeComplaintChat,
    currentUser,
    globalRefreshKey,
    triggerGlobalRefresh
  } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch complaint details & messages
  const fetchComplaint = async () => {
    if (!activeComplaintId) return;
    try {
      const res = await fetch(`/api/complaints/${activeComplaintId}`);
      if (res.ok) {
        const data: Complaint = await res.json();
        setComplaint(data);
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [activeComplaintId, globalRefreshKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeComplaintId) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !activeComplaintId || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await fetch(`/api/complaints/${activeComplaintId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          text: textToSend
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        triggerGlobalRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
            Open Ticket
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[440px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                Support & Dispute Chat
              </h3>
              {complaint && getStatusBadge(complaint.status)}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Ticket #{complaint?.ticketNumber || activeComplaintId}
            </p>
          </div>
        </div>

        <button
          onClick={closeComplaintChat}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Ticket Context Info Card */}
      {complaint && (
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{complaint.subject}</span>
            {complaint.disputeAmount !== undefined && (
              <span className="font-extrabold text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ${complaint.disputeAmount.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-slate-500 line-clamp-2">{complaint.description}</p>
          {complaint.resolutionNotes && (
            <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 mt-1">
              <span className="font-bold">Resolution Note: </span>
              {complaint.resolutionNotes}
            </div>
          )}
        </div>
      )}

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading discussion...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Headphones className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold">No messages yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Send a message to speak directly with an arbitration specialist.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUser?.id;
            const isAdmin = m.senderRole === 'admin';

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-medium">
                  <span>{m.senderName}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                      Support Desk
                    </span>
                  )}
                  <span>• {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : isAdmin
                      ? 'bg-indigo-600 text-white rounded-bl-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message to support..."
          className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
