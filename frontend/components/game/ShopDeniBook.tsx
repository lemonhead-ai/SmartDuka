"use client";

import React, { useState } from "react";
import { Book02Icon, StarIcon, CheckmarkCircle01Icon, Cancel01Icon } from "hugeicons-react";
import { CbcBadge } from "@/components/learning/CbcBadge";
import { MiloAlert } from "@/components/ui/MiloAlert";
import type { ToastKind } from "@/features/feedback/toast-store";

interface DeniCustomer {
  id: string;
  name: string;
  avatar: string;
  currentBalance: number;
  creditLimit: number;
  trustScore: number;
  lastItems: string;
}

const INITIAL_CUSTOMERS: DeniCustomer[] = [
  {
    id: "cust_1",
    name: "Mama Omondi",
    avatar: "👵",
    currentBalance: 120,
    creditLimit: 300,
    trustScore: 5,
    lastItems: "Unga wa Sembe kg 2 (KES 120)",
  },
  {
    id: "cust_2",
    name: "Baba Kibet",
    avatar: "👨‍🌾",
    currentBalance: 250,
    creditLimit: 250,
    trustScore: 3,
    lastItems: "Sabuni na Maziwa (KES 150)",
  },
  {
    id: "cust_3",
    name: "Mzee Juma",
    avatar: "👴",
    currentBalance: 0,
    creditLimit: 500,
    trustScore: 5,
    lastItems: "Imelipwa yote (KES 0)",
  },
];

export function ShopDeniBook() {
  const [customers, setCustomers] = useState<DeniCustomer[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust_1");
  const [purchaseAmount, setPurchaseAmount] = useState<number>(100);
  const [miloFeedback, setMiloFeedback] = useState<{ kind: ToastKind; message: string }>({
    kind: "info",
    message: "Karibu katika Daftari ya Deni! Hesabu salio la mteja uone kama limewahi kikimo chao cha deni.",
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const projectedBalance = selectedCustomer.currentBalance + purchaseAmount;
  const exceedsLimit = projectedBalance > selectedCustomer.creditLimit;

  const handleDecision = (accepted: boolean) => {
    const isCorrectDecision = accepted ? !exceedsLimit : exceedsLimit;
    if (isCorrectDecision) {
      if (accepted) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCustomer.id ? { ...c, currentBalance: projectedBalance } : c
          )
        );
      }
      setMiloFeedback({
        kind: "success",
        message: accepted
          ? `Safi sana! KES ${selectedCustomer.currentBalance} + KES ${purchaseAmount} = KES ${projectedBalance}. Ipo ndani ya kipimo cha KES ${selectedCustomer.creditLimit}.`
          : `Uamuzi wa busara! KES ${projectedBalance} ingevuka kipimo cha KES ${selectedCustomer.creditLimit}. Kumpa deni zaidi si salama kwa duka!`,
      });
    } else {
      setMiloFeedback({
        kind: "error",
        message: accepted
          ? `Angalia vizuri! KES ${projectedBalance} inazidi kipimo cha KES ${selectedCustomer.creditLimit}. Duka litapoteza pesa!`
          : `Kumbuka: KES ${projectedBalance} iko chini ya KES ${selectedCustomer.creditLimit} na ${selectedCustomer.name} ana Heshima nzuri!`,
      });
    }
  };

  const handleRepayment = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, currentBalance: Math.max(0, c.currentBalance - amount) } : c
      )
    );
    setMiloFeedback({
      kind: "success",
      message: `Hongera sana! Pokea malipo ya KES ${amount}. Salio jipya ni KES ${Math.max(0, selectedCustomer.currentBalance - amount)}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-surface p-6 border border-line shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Book02Icon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Daftari ya Deni (Community Credit Ledger)</h2>
            <p className="text-xs text-muted">
              Hesabu salio la deni na utumie busara kuamua ikiwa utamwekea mteja deni lingine.
            </p>
          </div>
        </div>
        <CbcBadge gradeLevel="Grade 2" subStrand="2.1 Credit Balance Math & Ethics" competencyId="CBC-MATH-G2-02" />
      </div>

      {/* Milo Mascot Toast */}
      <MiloAlert kind={miloFeedback.kind} message={miloFeedback.message} />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Customer List Column */}
        <div className="space-y-3 lg:col-span-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted px-1">Madaftari ya Majirani</h3>
          {customers.map((customer) => {
            const isSelected = customer.id === selectedCustomerId;
            const isFull = customer.currentBalance >= customer.creditLimit;
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  setSelectedCustomerId(customer.id);
                  setMiloFeedback({
                    kind: "info",
                    message: `Unasoma daftari la ${customer.name}. Salio la sasa ni KES ${customer.currentBalance}.`,
                  });
                }}
                className={`w-full text-left transition-all rounded-2xl p-4 border ${
                  isSelected
                    ? "bg-canvas border-accent shadow-sm ring-1 ring-accent"
                    : "bg-surface hover:bg-canvas border-line"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{customer.avatar}</span>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{customer.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-amber-500">
                        {Array.from({ length: customer.trustScore }).map((_, i) => (
                          <StarIcon key={i} size={12} className="fill-amber-500" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-extrabold ${isFull ? "text-red-500" : "text-ink"}`}>
                      KES {customer.currentBalance}
                    </div>
                    <div className="text-[10px] text-muted">Kipimo: KES {customer.creditLimit}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Decision Column */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-3xl bg-surface p-6 border border-line space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-3xl">{selectedCustomer.avatar}</span>
                <h3 className="mt-2 text-lg font-bold text-ink">{selectedCustomer.name}</h3>
                <p className="text-xs text-muted">Deni la Sasa: KES {selectedCustomer.currentBalance}</p>
              </div>

              {selectedCustomer.currentBalance > 0 && (
                <button
                  type="button"
                  onClick={() => handleRepayment(selectedCustomer.id, 50)}
                  className="rounded-xl bg-accent/10 px-3 py-2 text-xs font-bold text-accent border border-accent/20 hover:bg-accent/20"
                >
                  Pokea Malipo ya KES 50
                </button>
              )}
            </div>

            {/* Math Decision Workbench */}
            <div className="space-y-3 rounded-2xl bg-canvas p-4 border border-line">
              <div className="flex justify-between text-xs font-semibold text-ink">
                <span>Ombi Jipya la Bidhaa:</span>
                <span>KES {purchaseAmount}</span>
              </div>

              <input
                type="range"
                min="30"
                max="200"
                step="10"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                className="w-full accent-accent"
              />

              <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
                <div className="rounded-xl bg-surface p-2.5 border border-line">
                  <div className="text-muted">Salio Lililopo</div>
                  <div className="font-bold text-ink text-sm">KES {selectedCustomer.currentBalance}</div>
                </div>
                <div className="rounded-xl bg-surface p-2.5 border border-line">
                  <div className="text-muted">Salio Tarajiwa (+Jipya)</div>
                  <div className={`font-extrabold text-sm ${exceedsLimit ? "text-red-500" : "text-accent"}`}>
                    KES {projectedBalance}
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Buttons */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-ink">Uamuzi Wako wa Shopkeeper:</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-bold text-white hover:bg-accent/90 shadow-sm"
                >
                  <CheckmarkCircle01Icon size={16} />
                  <span>Kukubali Deni</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-canvas text-ink border border-line px-4 py-3 text-xs font-bold hover:bg-surface shadow-sm"
                >
                  <Cancel01Icon size={16} />
                  <span>Kukataa kwa Heshima</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
