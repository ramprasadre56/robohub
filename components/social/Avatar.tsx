function hue(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }

export default function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="av" style={style} referrerPolicy="no-referrer" />;
  }
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  const h = hue(name);
  return (
    <span className="av" style={{ ...style, background: `hsl(${h} 55% 86%)`, color: `hsl(${h} 50% 26%)` }} aria-hidden>
      {initials}
    </span>
  );
}
