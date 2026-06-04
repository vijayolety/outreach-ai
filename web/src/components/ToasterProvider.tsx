"use client";

import { Toaster as Sonner } from "sonner";

export function ToasterProvider() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: "white",
          color: "black",
          border: "1px solid #e5e7eb",
        },
      }}
    />
  );
}
