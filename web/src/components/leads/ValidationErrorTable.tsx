"use client";

import type { LeadValidationError } from "@/types";

export function ValidationErrorTable({ errors }: { errors: LeadValidationError[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="text-sm font-semibold text-zinc-950">Validation errors</div>
        <div className="text-xs font-medium text-zinc-500">{errors.length}</div>
      </div>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-zinc-50 text-xs font-medium text-zinc-600">
            <tr>
              <th className="px-4 py-2">Row</th>
              <th className="px-4 py-2">Field</th>
              <th className="px-4 py-2">Issue</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((e, idx) => (
              <tr key={`${e.rowNumber}-${e.field}-${idx}`} className="border-t border-zinc-100">
                <td className="px-4 py-2 font-medium text-zinc-800">{e.rowNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{e.field}</td>
                <td className="px-4 py-2 text-zinc-700">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

