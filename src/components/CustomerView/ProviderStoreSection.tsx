import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Store, ShoppingBag, Star, CheckCircle2, ShieldCheck, CreditCard, Wallet, X, ArrowRight } from 'lucide-react';

interface ProviderStoreSectionProps {
  onOpenStorefront?: (subdomain: string) => void;
}

export const ProviderStoreSection: React.FC<ProviderStoreSectionProps> = ({ onOpenStorefront }) => {
  const { currentUser, globalRefreshKey, openStorefrontSubdomain, updateUserLocally } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => console.error('Failed to load store products:', err));
  }, [globalRefreshKey]);

  const handleOpenBuyModal = (prod: Product) => {
    setSelectedProduct(prod);
    setBuyQuantity(1);
    setPurchaseSuccess(false);
    setPurchaseError(null);
  };

  const handleExecutePurchase = async () => {
    if (!selectedProduct || !currentUser) {
      setPurchaseError('Please log in to purchase supplies');
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          quantity: buyQuantity,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setPurchaseError(data.error || 'Failed to process purchase');
        setIsPurchasing(false);
        return;
      }

      setPurchaseSuccess(true);
      if (paymentMethod === 'wallet' && currentUser.walletBalance !== undefined) {
        const totalCost = selectedProduct.price * buyQuantity;
        updateUserLocally({ walletBalance: Math.max(0, currentUser.walletBalance - totalCost) });
      }

      // Update product inventory locally
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, stockQuantity: Math.max(0, p.stockQuantity - buyQuantity) }
            : p
        )
      );

      setTimeout(() => {
        setIsPurchasing(false);
      }, 500);
    } catch (err: any) {
      setPurchaseError(err.message || 'Network error processing purchase');
      setIsPurchasing(false);
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Service Provider Stores
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified equipment, genuine parts, and materials sold directly by local specialists
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {products.length} Products Available
          </span>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.slice(0, 8).map((prod) => {
          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-indigo-400 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Product Image */}
                <div className="relative w-full aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {prod.brand || 'Genuine'}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{prod.rating || 4.9}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-1">
                    <Store className="w-3.5 h-3.5" />
                    <span className="truncate">{prod.providerStoreName || 'Specialist Store'}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {prod.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                    {prod.description}
                  </p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-4 pt-0">
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mb-3">
                  <div>
                    <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      ${prod.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {prod.stockQuantity > 0 ? `${prod.stockQuantity} in stock` : 'Order on request'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBuyModal(prod)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Buy Now
                  </button>
                </div>

                {prod.providerStoreSubdomain && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenStorefront) onOpenStorefront(prod.providerStoreSubdomain!);
                      else openStorefrontSubdomain(prod.providerStoreSubdomain!);
                    }}
                    className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Visit Provider Store</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Buy Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {purchaseSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Purchase Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Your order for <strong>{selectedProduct.name}</strong> has been routed to the service specialist for dispatch and handover.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600">
                      {selectedProduct.providerStoreName}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {selectedProduct.name}
                    </h3>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      ${selectedProduct.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {purchaseError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                    {purchaseError}
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                  <span className="text-xs font-bold text-slate-700">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={buyQuantity <= 1}
                      onClick={() => setBuyQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-sm disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-sm text-slate-900">{buyQuantity}</span>
                    <button
                      type="button"
                      disabled={buyQuantity >= selectedProduct.stockQuantity}
                      onClick={() => setBuyQuantity((q) => q + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-sm disabled:opacity-40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2 mb-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Card Checkout
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === 'wallet'
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      Wallet (${currentUser?.walletBalance?.toFixed(2) || '0.00'})
                    </button>
                  </div>
                </div>

                {/* Total & Submit */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-500">Total Charged</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      ${(selectedProduct.price * buyQuantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isPurchasing}
                    onClick={handleExecutePurchase}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isPurchasing ? (
                      <span>Processing Order...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Confirm & Pay ${(selectedProduct.price * buyQuantity).toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
