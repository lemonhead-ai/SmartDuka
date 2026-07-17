import type { ShopLedger as ShopLedgerData } from "@/features/gameplay/types";

type ShopLedgerProps = {
  ledger?: ShopLedgerData;
  isLoading: boolean;
};

function formatAmount(amount: number) {
  return `${amount >= 0 ? "+" : "-"} KES ${Math.abs(amount)}`;
}

export function ShopLedger({ ledger, isLoading }: ShopLedgerProps) {
  return (
    <section className="rounded-[24px] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">Duka money</p>
          <h2 className="mt-1 text-xl font-semibold">Today&apos;s ledger</h2>
        </div>
        <p className="rounded-[14px] bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
          Cash: KES {ledger?.cash_balance_kes ?? 0}
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Sales" value={`KES ${ledger?.daily_revenue_kes ?? 0}`} />
        <Metric label="Stock costs" value={`KES ${ledger?.daily_expenses_kes ?? 0}`} />
        <Metric label="Today&apos;s result" value={`KES ${ledger?.daily_profit_kes ?? 0}`} />
      </div>
      <div className="mt-5 space-y-2">
        {isLoading ? (
          <p className="rounded-[16px] bg-canvas p-3 text-sm text-muted">Loading your shop money…</p>
        ) : ledger?.recent_entries.length ? (
          ledger.recent_entries.map((entry) => (
            <div className="flex items-center justify-between gap-3 rounded-[16px] bg-canvas px-4 py-3" key={entry.id}>
              <span className="text-sm text-ink">{entry.description}</span>
              <span className={`shrink-0 text-sm font-semibold ${entry.amount_kes >= 0 ? "text-green-700" : "text-red-600"}`}>
                {formatAmount(entry.amount_kes)}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-[16px] bg-canvas p-3 text-sm text-muted">Serve a customer or restock to begin today&apos;s money story.</p>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-canvas p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
