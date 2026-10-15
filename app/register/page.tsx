import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";
import { hackathons, events } from "@/lib/data";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event } = await searchParams;
  const options = [
    ...hackathons.filter((h) => h.status !== "completed").map((h) => ({ value: h.slug, label: `Hackathon — ${h.title}` })),
    ...events.map((e) => ({ value: e.title, label: `${e.kind} — ${e.title}` })),
  ];
  const initial = options.some((o) => o.value === event) ? event! : options[0].value;

  return (
    <>
      <header className="page-head">
        <h1>Register</h1>
        <p>Sign up yourself or your team. Solo builders are welcome — we run team matching before every hackathon.</p>
      </header>
      <RegisterForm options={options} initial={initial} />
    </>
  );
}
