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
            "rounded border px-2 py-1 text-sm " +
            (n === value ? "bg-black text-white" : "hover:bg-zinc-100")
          }
        >
          {n}
        </button>
      ))}
    </div>
  );
}
