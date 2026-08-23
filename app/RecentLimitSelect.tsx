"use client";

import { useRouter } from "next/navigation";

export function RecentLimitSelect({ options, value }: { options: number[]; value: number }) {
  const router = useRouter();

  return (
    <div className="flex gap-1">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => router.push(`/?limit=${n}`)}
          className={
            "rounded-full border px-2.5 py-1 text-xs transition " +
            (n === value
              ? "border-transparent bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
              : "border-white/10 text-zinc-400 hover:bg-white/5")
          }
        >
          {n}
        </button>
      ))}
    </div>
  );
}
