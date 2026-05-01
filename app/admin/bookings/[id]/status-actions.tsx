"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Action = (fd: FormData) => Promise<void>;

function ActionBtn({
  action,
  id,
  label,
  danger,
  style: styleOverride,
}: {
  action: Action;
  id: number;
  label: string;
  danger?: boolean;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const style: React.CSSProperties = danger
    ? { fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#dc2626", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 9, padding: "9px 18px", cursor: pending ? "wait" : "pointer", opacity: pending ? 0.6 : 1 }
    : { fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 9, padding: "9px 18px", cursor: pending ? "wait" : "pointer", opacity: pending ? 0.6 : 1, boxShadow: "0 2px 6px rgba(22,163,74,0.25)" };

  function handleClick() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(id));
      await action(fd);
      router.back();
    });
  }

  const finalStyle = styleOverride ? { ...style, ...styleOverride } : style;
  return (
    <button type="button" disabled={pending} onClick={handleClick} style={finalStyle}>
      {pending ? "…" : label}
    </button>
  );
}

export default function StatusActions({
  status,
  id,
  cancelBooking,
  deleteBooking,
  markCompleted,
  markNoShow,
  markPaymentReceived,
  paymentMethod,
  paymentReceivedAt,
}: {
  status: string;
  id: number;
  cancelBooking: Action;
  deleteBooking: Action;
  markCompleted: Action;
  markNoShow: Action;
  markPaymentReceived: Action;
  paymentMethod: string;
  paymentReceivedAt: string | null;
}) {
  const needsPayment = (paymentMethod === "whish" || paymentMethod === "omt") && !paymentReceivedAt;
  const payLabel = paymentMethod === "whish" ? "💳 Whish Payment Received" : "💳 OMT Payment Received";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {status === "confirmed" && needsPayment && (
        <ActionBtn
          action={markPaymentReceived}
          id={id}
          label={payLabel}
          style={{ background: paymentMethod === "whish" ? "#e8192c" : "#fede00", color: paymentMethod === "whish" ? "#fff" : "#1a1a1a", border: "none", boxShadow: paymentMethod === "whish" ? "0 2px 6px rgba(232,25,44,0.30)" : "0 2px 6px rgba(254,222,0,0.40)" }}
        />
      )}
      {status === "confirmed" && (
        <>
          <ActionBtn action={markCompleted} id={id} label="Mark completed" />
          <ActionBtn action={markNoShow}   id={id} label="Mark no-show" />
          <ActionBtn action={cancelBooking} id={id} label="Cancel booking" danger />
        </>
      )}
      <ActionBtn action={deleteBooking} id={id} label="Delete permanently" danger />
    </div>
  );
}
