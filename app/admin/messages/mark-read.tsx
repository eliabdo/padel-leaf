"use client";
import { useEffect } from "react";

export default function MarkRead({ action }: { action: () => Promise<void> }) {
  useEffect(() => {
    action();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
