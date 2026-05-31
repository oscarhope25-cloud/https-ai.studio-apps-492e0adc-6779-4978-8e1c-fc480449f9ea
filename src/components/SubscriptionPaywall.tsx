import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Calendar, Check, Play, FileText, Smartphone, CreditCard, Sparkles, Globe, Landmark } from 'lucide-react';
import { Subscription } from '../types';

interface SubscriptionPaywallProps {
  subscription: Subscription;
  onSubscribe: (plan: 'monthly' | 'trimester') => void;
  onCancel: () => void;
}

export default function SubscriptionPaywall({
  subscription,
  onSubscribe,
  onCancel
}: SubscriptionPaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'trimester'>('trimester');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'plans' | 'checkout' | 'success'>('plans');
  const [bankRefCode, setBankRefCode] = useState('');

  // Loaded Config State
  const [subSettings, setSubSettings] = useState(() => {
    const saved = localStorage.getItem('blackshadow_subscription_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      monthlyPrice: 9.99,
      monthlyName: 'Monthly Ledger',
      monthlyDesc: 'Flexible access to books and cinematic videos. Cancel anytime.',
      trimesterPrice: 24.99,
      trimesterName: 'Trimester Almanac',
      trimesterDesc: 'The preferred course for avid readers. Save 16% on subscription.'
    };
  });

  const [gatewaySettings, setGatewaySettings] = useState(() => {
    const saved = localStorage.getItem('blackshadow_payment_gateway_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      activeGateway: 'stripe',
      publicKey: 'pk_test_blackshadow5539201948',
      secretKey: 'sk_test_blackshadow9928103958',
      merchantEmail: 'merchant@blackshadow.io',
      mode: 'sandbox',
      instructionsHtml: 'Please transmit the transaction fee directly to Vault Account #8492019-BS and input your transaction identifier below.'
    };
  });

  const [promoCodes, setPromoCodes] = useState(() => {
    const saved = localStorage.getItem('blackshadow_promo_codes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'p1', code: 'SILENCE', type: 'percent', value: 100, isActive: true },
      { id: 'p2', code: 'SHADOW50', type: 'percent', value: 50, isActive: true }
    ];
  });

  // Re-read settings whenever this component is active/remounted
  useEffect(() => {
    const savedSub = localStorage.getItem('blackshadow_subscription_settings');
    const savedGway = localStorage.getItem('blackshadow_payment_gateway_settings');
    const savedCodes = localStorage.getItem('blackshadow_promo_codes');

    if (savedSub) setSubSettings(JSON.parse(savedSub));
    if (savedGway) setGatewaySettings(JSON.parse(savedGway));
    if (savedCodes) setPromoCodes(JSON.parse(savedCodes));
  }, [paymentStep]);

  const plans = [
    {
      id: 'monthly' as const,
      name: subSettings.monthlyName || 'Monthly Ledger',
      price: Number(subSettings.monthlyPrice) || 9.99,
      period: 'month',
      description: subSettings.monthlyDesc || 'Flexible access to books and cinematic videos. Cancel anytime.',
      badge: 'Flexible'
    },
    {
      id: 'trimester' as const,
      name: subSettings.trimesterName || 'Trimester Almanac',
      price: Number(subSettings.trimesterPrice) || 24.99,
      period: '3 months',
      description: subSettings.trimesterDesc || 'The preferred course for avid readers. Save 16% on subscription.',
      badge: 'Best Value'
    }
  ];

  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const inputClean = couponCode.trim().toUpperCase();
    if (!inputClean) return;

    const matched = promoCodes.find((p: any) => p.code.toUpperCase() === inputClean && p.isActive);
    if (matched) {
      setAppliedPromo(matched);
      setCouponApplied(true);
    } else {
      setCouponError('Invalid or expired discount code');
      setCouponApplied(false);
      setAppliedPromo(null);
    }
  };

  const basePrice = selectedPlan === 'trimester' 
    ? (plans.find(p => p.id === 'trimester')?.price || 24.99)
    : (plans.find(p => p.id === 'monthly')?.price || 9.99);

  const getDiscountedPrice = () => {
    if (!couponApplied || !appliedPromo) return basePrice;
    if (appliedPromo.type === 'percent') {
      const discounted = basePrice * (1 - Number(appliedPromo.value) / 100);
      return Math.max(0, Number(discounted.toFixed(2)));
    } else {
      return Math.max(0, Number((basePrice - Number(appliedPromo.value)).toFixed(2)));
    }
  };

  const finalPrice = getDiscountedPrice();

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStep('success');
    setTimeout(() => {
      onSubscribe(selectedPlan);
      setPaymentStep('plans');
      setCouponApplied(false);
      setCouponCode('');
      setAppliedPromo(null);
      setBankRefCode('');
    }, 2000);
  };

  // Helper labels for selected gateways
  const getGatewayLabel = () => {
    switch (gatewaySettings.activeGateway) {
      case 'paypal': return 'PayPal Secured Channel';
      case 'paystack': return 'Paystack African Portal';
      case 'flutterwave': return 'Flutterwave Gateway';
      case 'bank_transfer': return 'System Bank Wire Transfer';
      default: return 'Stripe Credit Terminal';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8" id="sub-paywall-root">
      {/* Title Header */}
      <div className="text-center mb-12">
        <span className="font-mono text-[9px] text-red-500 uppercase tracking-[0.4em] block mb-2">Exclusive Alliance</span>
        <h1 className="font-serif italic text-3xl md:text-5xl text-white tracking-tight mb-4">The Chamber of Shadows</h1>
        <p className="max-w-lg mx-auto text-xs text-[#888] font-sans tracking-wide leading-relaxed">
          Unlock the complete atmospheric archive. Seamless reading, rich generative visuals, and original critique journals, entirely offline and ad-free.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {subscription.isActive ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-[#070707] border border-red-955/40 p-8 rounded-none mb-8 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_#ff0000]" />
                  <span className="font-mono text-xs text-red-400 uppercase tracking-widest">Subscriber Alliance Active</span>
                </div>
                <h2 className="font-serif italic text-2xl text-white mb-2">
                  Membership: {subscription.plan === 'trimester' ? 'Trimester Almanac' : 'Monthly Ledger'}
                </h2>
                <div className="flex flex-col gap-1 text-[10px] text-[#666] font-mono uppercase tracking-widest">
                  <span>Trial Period Ends: {subscription.trialEndDate}</span>
                  <span>Next billing date: {subscription.expiresAt}</span>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="w-full md:w-auto px-5 py-2.5 border border-red-950/80 hover:border-red-800 text-xs text-red-500 hover:text-white font-mono tracking-widest uppercase transition-all rounded-none cursor-pointer"
              >
                Cancel Subscription
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-red-950/20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="p-4 border border-red-955/20 rounded-none bg-black">
                <FileText className="mx-auto mb-2 text-red-900/60 h-5 w-5" />
                <span className="block font-mono text-[9px] text-[#666] uppercase tracking-wider mb-1">Unrestricted Books</span>
                <span className="font-serif italic text-base text-white">Full Catalog</span>
              </div>
              <div className="p-4 border border-red-955/20 rounded-none bg-black">
                <Play className="mx-auto mb-2 text-red-900/60 h-5 w-5" />
                <span className="block font-mono text-[9px] text-[#666] uppercase tracking-wider mb-1">Animated Atmosphere</span>
                <span className="font-serif italic text-base text-white">All Masterclasses</span>
              </div>
              <div className="p-4 border border-red-955/20 rounded-none bg-black">
                <Smartphone className="mx-auto mb-2 text-red-900/60 h-5 w-5" />
                <span className="block font-mono text-[9px] text-[#666] uppercase tracking-wider mb-1">True Offline View</span>
                <span className="font-serif italic text-base text-white">Reading Sync On</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Paywall Options / Form Flow */}
            <div className="col-span-1 lg:col-span-7">
              {paymentStep === 'plans' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {plans.map((p) => {
                      const isSelected = selectedPlan === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlan(p.id)}
                          className={`cursor-pointer p-6 border rounded-none transition-all duration-300 relative ${
                            isSelected
                              ? 'border-red-800 bg-red-950/5'
                              : 'border-red-950/40 bg-black hover:border-red-900/60'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="font-mono text-[8px] text-red-000 tracking-widest uppercase bg-[#0d0404] px-1.5 py-0.5 rounded-none border border-red-950/60">
                              {p.badge}
                            </span>
                            {isSelected && <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_#ff0000]" />}
                          </div>
                          <h3 className="font-serif italic text-base text-white font-medium mb-1">{p.name}</h3>
                          <div className="flex items-baseline gap-1 my-2">
                            <span className="font-serif italic text-xl text-white font-bold">${p.price}</span>
                            <span className="font-mono text-xs text-[#555]">/ {p.period}</span>
                          </div>
                          <p className="text-xs text-[#888] font-sans leading-relaxed">{p.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon section */}
                  <form onSubmit={handleApplyCoupon} className="p-4 bg-[#070707] border border-red-950/40 rounded-none flex items-center justify-between gap-4 mt-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Discount Code (e.g. SILENCE, SHADOW50)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied}
                        className="w-full bg-black border border-red-950/50 focus:border-red-800 focus:outline-none text-xs px-3 py-2 text-white font-mono uppercase tracking-widest rounded-none"
                      />
                    </div>
                    {couponApplied ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCouponApplied(false);
                          setAppliedPromo(null);
                          setCouponCode('');
                        }}
                        className="px-4 py-2 hover:bg-red-950/20 text-xs text-[#999] hover:text-white font-mono tracking-widest uppercase transition-colors rounded-none cursor-pointer border border-[#333]"
                      >
                        Reset
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-4 py-2 border border-red-950/50 hover:border-red-800 text-xs text-red-500 font-mono tracking-widest uppercase transition-colors rounded-none cursor-pointer"
                      >
                        Verify Code
                      </button>
                    )}
                  </form>

                  {couponError && (
                    <p className="text-xs text-red-600 font-mono text-center block">
                      ⚠ {couponError}
                    </p>
                  )}

                  {couponApplied && appliedPromo && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-red-950/10 border border-red-950/40 text-center"
                    >
                      <span className="text-xs text-red-400 font-mono block">
                        ★ DISPATCH KEY APPLIED: '{appliedPromo.code}' verified. ({appliedPromo.type === 'percent' ? `${appliedPromo.value}%` : `$${appliedPromo.value}`} discount ledger adjusted)
                      </span>
                    </motion.div>
                  )}

                  {/* Proceed CTA */}
                  <button
                    onClick={() => setPaymentStep('checkout')}
                    className="w-full mt-6 py-4 bg-red-950/30 border border-red-900/60 hover:bg-red-900/10 text-red-400 hover:text-white font-serif font-semibold text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 rounded-none cursor-pointer font-bold"
                  >
                    <span>Proceed to Checkout</span>
                    <Sparkles className="h-4 w-4 text-red-500 animate-pulse" />
                  </button>

                  <p className="text-center font-mono text-[8px] text-[#555] uppercase tracking-widest mt-2">
                    Includes trial window, processed via secure sandbox transmission.
                  </p>
                </div>
              )}

              {paymentStep === 'checkout' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#070707] border border-red-955/40 p-6 rounded-none font-sans text-sm"
                >
                  <div className="flex justify-between items-center mb-4 border-b border-red-955/25 pb-2">
                    <h3 className="font-serif italic text-base text-white">{getGatewayLabel()}</h3>
                    <span className={`text-[7px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-none ${
                      gatewaySettings.mode === 'sandbox' 
                        ? 'bg-amber-950/30 text-amber-500 border border-amber-850/60' 
                        : 'bg-green-950/30 text-green-500 border border-green-850/60'
                    }`}>
                      {gatewaySettings.mode === 'sandbox' ? 'SANDBOX KEY ACTIVE' : 'LIVE API PRODUCTION'}
                    </span>
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    {gatewaySettings.activeGateway === 'bank_transfer' ? (
                      <div className="space-y-4 bg-black/40 border border-red-955/15 p-4 rounded-none font-mono text-[10px] text-zinc-300">
                        <div className="flex gap-2 items-center text-red-400 font-serif italic text-xs uppercase mb-1">
                          <Landmark className="h-4 w-4 text-red-500" />
                          <span>System Bank Wire Instructions</span>
                        </div>
                        <p className="leading-relaxed border-l-2 border-red-900 pl-3 py-1 bg-red-950/5">
                          {gatewaySettings.instructionsHtml}
                        </p>
                        
                        <div className="grid grid-cols-1 gap-3 pt-2">
                          <div>
                            <label className="block text-[8px] uppercase tracking-widest text-[#666] mb-1">Payer Account Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Oscar Hope"
                              className="w-full bg-black border border-red-955/20 focus:border-red-900 focus:outline-none px-3 py-1.5 text-white rounded-none text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] uppercase tracking-widest text-[#666] mb-1">Transaction block / Wire Reference #</label>
                            <input
                              type="text"
                              required
                              placeholder="TXN-994821034-BS"
                              value={bankRefCode}
                              onChange={(e) => setBankRefCode(e.target.value)}
                              className="w-full bg-black border border-red-955/20 focus:border-red-900 focus:outline-none px-3 py-1.5 text-white rounded-none text-[11px]"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-widest text-red-000 mb-1">Cardholders Alliance Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Oscar Hope"
                            className="w-full bg-black border border-red-955/20 focus:border-red-900 focus:outline-none px-3 py-2 text-white rounded-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-widest text-red-000 mb-1">Card Number (Processed via {gatewaySettings.activeGateway.toUpperCase()})</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              maxLength={19}
                              placeholder="4000 1234 5678 9010"
                              className="w-full bg-black border border-red-955/20 focus:border-red-900 focus:outline-none px-3 py-2 pl-10 text-white rounded-none text-xs"
                            />
                            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-red-950/80" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-mono uppercase tracking-widest text-red-000 mb-1">Expiry Date</label>
                            <input
                              type="text"
                              required
                              maxLength={5}
                              placeholder="MM/YY"
                              className="w-full bg-black border border-red-955/20 focus:border-red-900 focus:outline-none px-3 py-2 text-white rounded-none text-xs text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-mono uppercase tracking-widest text-red-000 mb-1">CVV Security</label>
                            <input
                              type="password"
                              required
                              maxLength={3}
                              placeholder="•••"
                              className="w-full bg-black border border-red-955/20 focus:border-red-900 focus:outline-none px-3 py-2 text-white rounded-none text-xs text-center"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {gatewaySettings.publicKey && (
                      <div className="font-mono text-[7px] text-zinc-650 uppercase block select-none truncate">
                        Gateway Pub Key: {gatewaySettings.publicKey}
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-red-955/20 flex justify-between items-center">
                      <div className="text-xs text-[#888] font-mono uppercase tracking-wider">
                        Total Ledger: <span className="text-red-500 font-bold ml-1">${finalPrice}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentStep('plans')}
                          className="px-4 py-2 border border-red-955/20 hover:border-red-900 text-xs text-[#666] hover:text-white font-mono uppercase rounded-none cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-red-900 text-white hover:bg-red-800 text-xs font-mono uppercase font-bold transition-all rounded-none cursor-pointer"
                        >
                          Complete Pact
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {paymentStep === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#070707] border border-red-955/40 p-12 text-center rounded-none space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    className="inline-block p-4 rounded-none bg-transparent border border-red-900 text-red-500"
                  >
                    <ShieldCheck className="h-10 w-10 animate-pulse" />
                  </motion.div>
                  <h3 className="font-serif italic text-2xl text-white">The Pact has been Sealed</h3>
                  <p className="max-w-md mx-auto text-xs text-[#888] font-sans leading-relaxed">
                    Striving for complete alignment of the mind. Your premium trial is initialized, unlocking infinite digital books, soundscapes, and reviews.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Paywall Info sidebar */}
            <div className="col-span-1 lg:col-span-5 space-y-6">
              <div className="bg-[#070707] border border-red-955/40 p-6 rounded-none">
                <h4 className="font-serif italic text-sm text-white mb-4 border-b border-red-955/25 pb-2">The Premium Covenant</h4>
                <ul className="space-y-4">
                  {[
                    'Full offline availability of every eBook file',
                    'High definition ambient video masterclasses',
                    'Interactive reading pagination and bookmark logs',
                    'Compose customized reader reflections & community critiques',
                    'True tracking of reading progress synced across sessions',
                    '1 week trial before any billing transaction'
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-red-900/60 mt-0.5 shrink-0" />
                      <span className="text-xs text-[#888] leading-relaxed font-sans">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Special atmospheric block */}
              <div className="bg-[#030303] border border-red-955/20 p-6 rounded-none text-center relative overflow-hidden">
                <span className="font-serif text-base italic text-zinc-350 block mb-2">"Silence is the residue of thought."</span>
                <span className="font-mono text-[8px] text-red-900/60 uppercase tracking-[0.2em]">Aurelius Alumnus</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
