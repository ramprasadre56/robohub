import type { Metadata } from "next";
import { leaderboard } from "@/lib/data";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  const max = leaderboard[0].points;
  return (
    <>
      <header className="page-head">
        <h1>Season leaderboard</h1>
        <p>Points from every RoboHub hackathon this season. Wins earn 500, podiums 250, completed runs 50.</p>
      </header>
      <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Team</th><th>City</th><th className="num">Events</th><th className="num">Wins</th><th className="num">Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((t, i) => (
              <tr key={t.team}>
                <td><span className={`rank ${i < 3 ? `r${i + 1}` : ""}`}>{i + 1}</span></td>
                <td>
                  <strong>{t.team}</strong>
                  <div className="bar" style={{ marginTop: 6, maxWidth: 220 }}><div style={{ width: `${(t.points / max) * 100}%` }} /></div>
                </td>
                <td className="muted">{t.city}</td>
                <td className="num">{t.events}</td>
                <td className="num">{t.wins}</td>
                <td className="num"><strong>{t.points.toLocaleString("en-IN")}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
