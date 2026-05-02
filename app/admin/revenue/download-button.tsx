"use client";

import { useState } from "react";

interface Props {
  dateKey: string;
}

export function RevenueDownloadButton({ dateKey }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/revenue-pdf?date=${dateKey}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`PDF failed (${res.status}): ${text.slice(0, 300)}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `revenue-${dateKey}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not generate PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
        color: "#fff", background: loading ? "#4ade80" : "#16a34a",
        border: "none", borderRadius: 9, padding: "9px 16px",
        boxShadow: "0 2px 8px rgba(22,163,74,0.28)",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
    >
      {loading ? (
        <>
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2.5}
            style={{ animation: "spin 0.8s linear infinite" }}
          >
            <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
            <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          Generating…
        </>
      ) : (
        <>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 3v12" />
          </svg>
          Download PDF Report
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
