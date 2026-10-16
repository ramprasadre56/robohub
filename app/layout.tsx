import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { currentUser } from "@/lib/server/auth";
import { unreadCount } from "@/lib/server/social";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RoboHub — Robotics Hackathons & Training", template: "%s · RoboHub" },
  description: "Robotics hackathons, events and hands-on training: drones, humanoids, ROS 2 and robot learning.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const u = await currentUser();
  const user = u ? { handle: u.handle, name: u.name, avatar: u.avatar } : null;
  const unread = u ? await unreadCount(u.id) : 0;
  return (
    <html lang="en">
      <body>
        <Shell user={user} unread={unread}>{children}</Shell>
      </body>
    </html>
  );
}
