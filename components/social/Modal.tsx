"use client";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({ onClose, title, children }: { onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
          {title && <strong>{title}</strong>}
        </div>
        {children}
      </div>
    </div>
  );
}
