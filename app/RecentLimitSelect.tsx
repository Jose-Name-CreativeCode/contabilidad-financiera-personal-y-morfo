"use client";

import { useRouter } from "next/navigation";

export function RecentLimitSelect({ options, value }: { options: number[]; value: number }) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => router.push(`/?limit=${e.target.value}`)}
      className="rounded border px-2 py-1 text-sm"
    >
      {options.map((n) => (
        <option key={n} value={n}>
          Mostrar {n}
        </option>
      ))}
    </select>
  );
}
