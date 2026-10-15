"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type Option = { value: string; label: string };

export default function RegisterForm({ options, initial }: { options: Option[]; initial: string }) {
  const [done, setDone] = useState<null | { name: string; event: string }>(null);

  if (done) {
    const label = options.find((o) => o.value === done.event)?.label ?? done.event;
    return (
      <div className="success">
        <CheckCircle2 size={32} color="var(--accent)" />
        <h2 style={{ marginTop: 10, fontSize: 24 }}>You&apos;re in, {done.name.split(" ")[0]}!</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          We&apos;ve saved your registration for <strong>{label}</strong>. Watch your inbox for the prep workshop invite.
        </p>
        <div className="detail-actions">
          <Link href="/training" className="btn primary">Start preparing</Link>
          <button className="btn" onClick={() => setDone(null)}>Register another</button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        // TODO: send to your backend (e.g. a Next.js Route Handler + database).
        setDone({ name: String(f.get("name")), event: String(f.get("event")) });
      }}
    >
      <div className="field">
        <label htmlFor="event">Hackathon or event</label>
        <select id="event" name="event" defaultValue={initial} required>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="grid grid-2" style={{ gap: 18 }}>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>
      <div className="grid grid-2" style={{ gap: 18 }}>
        <div className="field">
          <label htmlFor="team">Team name</label>
          <input id="team" name="team" placeholder="Solo? Leave blank and we'll match you" />
        </div>
        <div className="field">
          <label htmlFor="level">Experience</label>
          <select id="level" name="level" defaultValue="intermediate">
            <option value="beginner">Beginner — first robot</option>
            <option value="intermediate">Intermediate — built a few</option>
            <option value="advanced">Advanced — research / industry</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="skills">What do you bring?</label>
        <textarea id="skills" name="skills" rows={3} placeholder="e.g. ROS 2, embedded C, PyTorch, CAD, soldering" />
      </div>
      <div>
        <button type="submit" className="btn primary">Submit registration</button>
      </div>
    </form>
  );
}
