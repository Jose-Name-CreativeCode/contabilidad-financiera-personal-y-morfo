const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export function StatCard({
  label,
  amount,
  tone = "neutral",
}: {
  label: string;
  amount: number;
  tone?: "neutral" | "positive" | "negative";
}) {
  const color =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-rose-400"
        : "text-zinc-100";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{fmt(amount)}</p>
    </div>
  );
}

export function BalanceHero({ saldo }: { saldo: number }) {
  const positive = saldo >= 0;
  return (
    <div
      className={`rounded-3xl border p-6 shadow-lg backdrop-blur ${
        positive
          ? "border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-white/[0.03] to-transparent"
          : "border-rose-400/20 bg-gradient-to-br from-rose-500/15 via-white/[0.03] to-transparent"
      }`}
    >
      <p className="text-sm font-medium text-zinc-400">Saldo</p>
      <p
        className={`mt-1 text-4xl font-bold tabular-nums ${
          positive ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {fmt(saldo)}
      </p>
    </div>
  );
}

export function CategoryBars({
  title,
  data,
  emptyLabel,
  barClass,
}: {
  title: string;
  data: [string, number][];
  emptyLabel: string;
  barClass: string;
}) {
  const max = Math.max(1, ...data.map(([, amount]) => amount));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <h2 className="mb-3 text-sm font-semibold text-zinc-200">{title}</h2>
      {data.length === 0 && <p className="text-sm text-zinc-500">{emptyLabel}</p>}
      <div className="flex flex-col gap-3">
        {data.map(([name, amount]) => (
          <div key={name}>
            <div className="mb-1 flex justify-between text-xs text-zinc-400">
              <span>{name}</span>
              <span className="tabular-nums text-zinc-200">{fmt(amount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full ${barClass}`}
                style={{ width: `${(amount / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { fmt };
