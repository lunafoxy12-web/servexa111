import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const EmailVerificationModal: React.FC = () => {
  const {
    isEmailVerifyModalOpen,
    setIsEmailVerifyModalOpen,
    pendingVerifyEmail,
    currentUser,
    latestVerificationCode,
    verifyEmailCode,
    sendEmailVerification
  } = useAuth();

  const emailToVerify = pendingVerifyEmail || currentUser?.email || '';
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);

  // Auto pre-fill if latest code is available for smooth testing
  useEffect(() => {
    if (latestVerificationCode) {
      setCode(latestVerificationCode);
    }
  }, [latestVerificationCode]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isEmailVerifyModalOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code || code.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    const res = await verifyEmailCode(code.trim(), emailToVerify);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Email verified successfully!');
      setTimeout(() => {
        setIsEmailVerifyModalOpen(false);
        setSuccessMessage('');
        setCode('');
      }, 1400);
    } else {
      setErrorMessage(res.error || 'Invalid code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setErrorMessage('');
    const res = await sendEmailVerification(emailToVerify);
    setResending(false);

    if (res.success) {
      setCooldown(30);
      setSuccessMessage('A fresh verification code has been dispatched.');
      if (res.code) {
        setCode(res.code);
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to dispatch code.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 leading-none">Email Verification</h3>
                <p className="text-xs text-slate-500 mt-1">Verify your account for live services</p>
              </div>
            </div>
            <button
              onClick={() => setIsEmailVerifyModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {/* Success State */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-2.5 text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error State */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-800 text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 border border-indigo-100">
                <Mail className="w-7 h-7" />
              </div>
              <p className="text-sm text-slate-600">
                We sent a 6-digit confirmation PIN to:
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 tracking-tight font-mono">
                {emailToVerify}
              </p>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                  6-Digit Verification PIN
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3.5 text-center text-2xl font-mono tracking-widest font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                    autoFocus
                  />
                </div>
              </div>

              {/* Ready to test notice */}
              {latestVerificationCode && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Dispatched PIN: <strong className="font-mono text-slate-900 text-sm">{latestVerificationCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setCode(latestVerificationCode)}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    Paste PIN
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length < 4}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Verify Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Didn't receive the PIN?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="text-indigo-600 font-medium hover:underline disabled:text-slate-400"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Dispatching...' : 'Resend Code'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
