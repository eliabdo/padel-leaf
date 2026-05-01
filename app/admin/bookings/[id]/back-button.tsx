"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 500,
        color: "#16a34a",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      ← Back
    </button>
  );
}
