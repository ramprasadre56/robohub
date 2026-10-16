"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button className="nav-item" style={{ background: "none", border: 0, width: "100%", cursor: "pointer", font: "inherit" }} title="Sign out"
      onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/feed"); router.refresh(); }}>
      <LogOut size={22} strokeWidth={1.75} /><span className="nav-text">Sign out</span>
    </button>
  );
}
