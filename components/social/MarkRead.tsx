"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarkRead({ unread }: { unread: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!unread) return;
    fetch("/api/notifications/read", { method: "POST" }).then(() => router.refresh());
  }, [unread, router]);
  return null;
}
