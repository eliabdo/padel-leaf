"use client";

import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      name:    String(form.get("name")   ?? ""),
      email:   String(form.get("email")  ?? ""),
      phone:   String(form.get("phone")  ?? ""),
      message: String(form.get("message")?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send");
      }
      setStatus("sent");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-sage-soft border border-sage rounded-2xl p-8 text-center">
        <h3 className="font-serif text-2xl text-forest-deep mb-2">Got it.</h3>
        <p className="text-char-soft">
          We&apos;ll get back to you. See you at the courts.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Name"  name="name"  type="text"  required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Phone (optional)" name="phone" type="tel" />
      <div>
        <label htmlFor="message" className="block text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
        />
      </div>

      {error && (
        <div className="text-sm text-clay">{error}</div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Sending…" : "Send message →"}
      </button>
    </form>
  );
}

function Field({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
      />
    </div>
  );
}
