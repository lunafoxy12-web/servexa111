import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { DirectImageUpload } from './common/DirectImageUpload';
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Building,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Lock,
  BadgeCheck,
  Globe,
  Clock
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", rateToUSD: 1.0 },
  { code: "EUR", symbol: "€", name: "Euro", rateToUSD: 1.08 },
  { code: "GBP", symbol: "£", name: "British Pound", rateToUSD: 1.28 },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", rateToUSD: 0.74 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rateToUSD: 0.65 },
  { code: "AED", symbol: "AED", name: "UAE Dirham", rateToUSD: 0.27 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rateToUSD: 0.0067 }
];

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, refreshUser, globalRefreshKey } = useAuth();
  const [balance, setBalance] = useState<number>(currentUser?.walletBalance || 0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currentUser?.preferredCurrency || 'USD');
  const [depositAmount, setDepositAmount] = useState('50');
  const [depositCurrency, setDepositCurrency] = useState<string>(currentUser?.preferredCurrency || 'USD');
  const [currencySaving, setCurrencySaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('100');
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Identity Verification (KYC) State
  const [isIdentityVerified, setIsIdentityVerified] = useState<boolean>(!!currentUser?.identityVerified);
  const [walletStatus, setWalletStatus] = useState<string>(currentUser?.walletStatus || (currentUser?.identityVerified ? 'active' : 'unverified'));
  const [showKycForm, setShowKycForm] = useState<boolean>(!currentUser?.identityVerified && currentUser?.walletStatus !== 'pending_approval');
  const [kycFullName, setKycFullName] = useState<string>(currentUser?.name || '');
  const [kycDocumentType, setKycDocumentType] = useState<'passport' | 'drivers_license' | 'national_id'>('passport');
  const [kycDocumentNumber, setKycDocumentNumber] = useState<string>('P98241088');
  const [kycCountry, setKycCountry] = useState<string>('United States');
  const [kycDocumentImage, setKycDocumentImage] = useState<string>('');
  const [kycSubmitting, setKycSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    setLoading(true);

    fetch(`/api/wallet/${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.balance === 'number') {
          setBalance(data.balance);
        } else if (currentUser?.walletBalance !== undefined) {
          setBalance(currentUser.walletBalance);
        }
        if (typeof data.identityVerified === 'boolean') {
          setIsIdentityVerified(data.identityVerified);
        }
        if (data.preferredCurrency || data.currency) {
          const userCurr = data.preferredCurrency || data.currency;
          setSelectedCurrency(userCurr);
          setDepositCurrency(userCurr);
        }
        if (data.idVerification?.status) {
          setWalletStatus(data.idVerification.status);
        } else if (currentUser?.walletStatus) {
          setWalletStatus(currentUser.walletStatus);
        }
        if (Array.isArray(data?.transactions)) {
          setTransactions(data.transactions);
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, currentUser?.id, currentUser?.identityVerified, currentUser?.walletStatus, globalRefreshKey]);

  if (!isOpen || !currentUser) return null;

  const activeCurrencyObj = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];
  const depositCurrencyObj = SUPPORTED_CURRENCIES.find((c) => c.code === depositCurrency) || SUPPORTED_CURRENCIES[0];
  const convertedUsdAmount = parseFloat(depositAmount || '0') * depositCurrencyObj.rateToUSD;
  // Converted display balance
  const displayBalanceInSelectedCurrency = (balance ?? 0) / (activeCurrencyObj.code === 'USD' ? 1 : activeCurrencyObj.rateToUSD);

  const handleSelectCurrency = async (newCurrencyCode: string) => {
    if (!currentUser?.id || newCurrencyCode === selectedCurrency) return;
    setSelectedCurrency(newCurrencyCode);
    setDepositCurrency(newCurrencyCode);
    setCurrencySaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/currency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrencyCode })
      });
      if (res.ok) {
        setNotification(`Preferred currency set to ${newCurrencyCode}. Balance and transactions updated & saved.`);
        await refreshUser();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || 'Failed to save currency preference');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error updating currency');
    } finally {
      setCurrencySaving(false);
    }
  };

  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (!kycDocumentImage) {
      setErrorMessage('Please upload a clear image of your official government ID or passport.');
      return;
    }

    setKycSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/verify-identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: kycFullName,
          documentType: kycDocumentType,
          documentNumber: kycDocumentNumber,
          country: kycCountry,
          dob: '1990-05-14',
          address: 'Market St, San Francisco, CA',
          documentImage: kycDocumentImage
        })
      });

      const data = await res.json();
      if (res.ok) {
        setWalletStatus('pending_approval');
        setShowKycForm(false);
        setNotification('Documents securely uploaded! Sent to Admin Panel for review. An administrator will review and activate your wallet shortly.');
        await refreshUser();
      } else {
        setErrorMessage(data.error || 'Verification submission failed. Please check your details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during verification');
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleDeposit = async () => {
    if (!isIdentityVerified && walletStatus !== 'active') {
      setShowKycForm(true);
      setErrorMessage('Identity documents must be reviewed and approved by Platform Administration before adding funds.');
      return;
    }

    const rawAmt = parseFloat(depositAmount);
    if (!rawAmt || rawAmt <= 0) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: convertedUsdAmount,
          currency: depositCurrency,
          originalAmount: rawAmt,
          method: 'card'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        setIsDepositing(false);
        setNotification(`Successfully added ${depositCurrency} ${rawAmt.toFixed(2)} (${convertedUsdAmount.toFixed(2)} USD) to your wallet.`);
        await refreshUser();
      } else {
        setErrorMessage(data.error || 'Deposit failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (currentUser.role === 'customer') {
      setErrorMessage('Cashout is not available for customer accounts. Customer wallet balances are reserved for booking services.');
      return;
    }

    if (!isIdentityVerified && walletStatus !== 'active') {
      setShowKycForm(true);
      setErrorMessage('Identity verification must be approved by Platform Administration before requesting bank payouts.');
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0 || amt > balance) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/wallet/${currentUser.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, bankAccount: 'Chase Checking **** 9201' })
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        setIsWithdrawing(false);
        setNotification(`Payout request of ${amt.toFixed(2)} processed to your bank.`);
        await refreshUser();
      } else {
        setErrorMessage(data.error || 'Withdrawal failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900">Servexa Wallet & Ledger</h2>
                {isIdentityVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <BadgeCheck className="w-3 h-3 text-emerald-600" />
                    KYC Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    <Lock className="w-3 h-3 text-amber-600" />
                    Verification Required
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                <span>{currentUser.role === 'provider' ? 'Service Provider Earnings & Payouts' : 'Customer Account & Wallet'}</span>
                {currentUser.walletAddress && (
                  <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {currentUser.walletAddress.length > 16 
                      ? `${currentUser.walletAddress.slice(0, 8)}...${currentUser.walletAddress.slice(-6)}` 
                      : currentUser.walletAddress}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {notification && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center justify-between">
              <span>{notification}</span>
              <button onClick={() => setNotification(null)} className="text-emerald-600 font-bold">
                ✕
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold">
                ✕
              </button>
            </div>
          )}

          {/* Identity Verification (KYC) Mandatory Card */}
          {!isIdentityVerified ? (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-900">Identity Verification Required</h4>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Financial security and anti-fraud regulations require both customers and service providers to verify their government identity before depositing or withdrawing wallet funds.
                  </p>
                  
                  {!showKycForm ? (
                    <button
                      onClick={() => setShowKycForm(true)}
                      className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Verify Identity Now (1-Click)
                    </button>
                  ) : null}
                </div>
              </div>

              {showKycForm && (
                <form onSubmit={handleVerifyIdentity} className="mt-4 pt-4 border-t border-amber-200/60 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Legal Full Name</label>
                      <input
                        type="text"
                        required
                        value={kycFullName}
                        onChange={(e) => setKycFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">ID Document Type</label>
                      <select
                        value={kycDocumentType}
                        onChange={(e: any) => setKycDocumentType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                      >
                        <option value="passport">Passport</option>
                        <option value="drivers_license">Driver's License</option>
                        <option value="national_id">National ID Card</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Document Number</label>
                      <input
                        type="text"
                        required
                        value={kycDocumentNumber}
                        onChange={(e) => setKycDocumentNumber(e.target.value)}
                        placeholder="e.g. A92810488"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Issuing Country</label>
                      <input
                        type="text"
                        required
                        value={kycCountry}
                        onChange={(e) => setKycCountry(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Direct File Upload to Firebase Storage */}
                  <div>
                    <DirectImageUpload
                      id="kyc-doc-upload-direct"
                      userId={currentUser.id}
                      label="Government ID / Passport Document"
                      helperText="Attach document (PNG, JPG, PDF up to 8MB). Uploads directly to Firebase Storage for admin approval."
                      value={kycDocumentImage}
                      onChange={(fileUrl) => {
                        setKycDocumentImage(fileUrl);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      aspectRatioClass="aspect-video"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={kycSubmitting || !kycDocumentImage}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {kycSubmitting ? 'Uploading & Submitting Documents...' : 'Submit ID to Firebase Storage for Admin Approval'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Government Identity Verified</p>
                  <p className="text-[10px] text-emerald-700">KYC Status: Approved • Full wallet transactions enabled</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                ACTIVE
              </span>
            </div>
          )}

          {/* Balance card with Multi-Currency Management */}
          <div className="p-5 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-xs text-indigo-200 font-medium">Available Liquid Balance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-extrabold tracking-tight font-mono">
                    {activeCurrencyObj.symbol}{displayBalanceInSelectedCurrency.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <span className="text-xs font-bold text-indigo-300 font-mono">
                    {activeCurrencyObj.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Baseline: ${(balance ?? 0).toFixed(2)} USD {activeCurrencyObj.code !== 'USD' && `• 1 USD ≈ ${(1 / activeCurrencyObj.rateToUSD).toFixed(2)} ${activeCurrencyObj.code}`}
                  </span>
                </p>
              </div>

              {/* Currency Selector */}
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/15">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                    Currency
                  </span>
                  {currencySaving && (
                    <span className="text-[10px] text-amber-300 font-medium animate-pulse">Saving...</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 max-w-[190px]">
                  {SUPPORTED_CURRENCIES.map((curr) => {
                    const isSelected = curr.code === selectedCurrency;
                    return (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => handleSelectCurrency(curr.code)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500 text-white shadow-xs ring-1 ring-white/50'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                        }`}
                        title={`${curr.name} (${curr.symbol})`}
                      >
                        {curr.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={() => {
                  if (!isIdentityVerified) {
                    setShowKycForm(true);
                    setErrorMessage('Please complete identity verification first before depositing.');
                    return;
                  }
                  setIsDepositing(!isDepositing);
                  setIsWithdrawing(false);
                }}
                className={`flex-1 py-2 px-3 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  isIdentityVerified
                    ? 'bg-white text-slate-900 hover:bg-slate-100'
                    : 'bg-white/40 text-slate-400 cursor-not-allowed'
                }`}
              >
                {!isIdentityVerified ? <Lock className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-4 h-4 text-indigo-600" />}
                Deposit Funds
              </button>

              {currentUser.role === 'provider' && (
                <button
                  onClick={() => {
                    if (!isIdentityVerified) {
                      setShowKycForm(true);
                      setErrorMessage('Please complete identity verification first before requesting payouts.');
                      return;
                    }
                    setIsWithdrawing(!isWithdrawing);
                    setIsDepositing(false);
                  }}
                  className={`flex-1 py-2 px-3 font-bold text-xs rounded-xl transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    isIdentityVerified
                      ? 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                      : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                  }`}
                >
                  {!isIdentityVerified ? <Lock className="w-3.5 h-3.5" /> : <Building className="w-4 h-4 text-white" />}
                  Bank Payout
                </button>
              )}
            </div>
          </div>

          {/* Deposit Form */}
          {isDepositing && isIdentityVerified && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Add Funds via Card</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {depositCurrencyObj.code} • Rate: {depositCurrencyObj.rateToUSD} USD
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['20', '50', '100', '250'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      depositAmount === amt
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {depositCurrencyObj.symbol}{amt}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="text-xs font-bold text-slate-500 absolute left-3 top-2.5">
                  {depositCurrencyObj.symbol}
                </span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  placeholder="Custom amount"
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={loading}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Confirm Deposit ({depositCurrencyObj.symbol}{depositAmount} {depositCurrencyObj.code} ≈ ${convertedUsdAmount.toFixed(2)} USD)
              </button>
            </div>
          )}

          {/* Withdraw Form */}
          {isWithdrawing && isIdentityVerified && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Instant Provider Bank Payout</span>
                <span className="text-[11px] text-slate-500">To Chase •••• 9201</span>
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  value={withdrawAmount}
                  max={balance}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  placeholder="Payout amount"
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={loading || parseFloat(withdrawAmount) > balance}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Transfer to Bank (${withdrawAmount})
              </button>
            </div>
          )}

          {/* Transactions Ledger */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-3">Transaction History</h4>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No transactions recorded yet.</p>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tx.type === 'earning' || tx.type === 'deposit'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tx.type === 'earning' || tx.type === 'deposit' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{tx.description}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono ${
                          (tx.amount ?? 0) > 0 ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {(tx.amount ?? 0) > 0 ? `+$${(tx.amount ?? 0).toFixed(2)}` : `-$${Math.abs(tx.amount ?? 0).toFixed(2)}`}
                      </span>
                      <span className="block text-[10px] capitalize text-slate-400 font-medium">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
