import type { Metadata } from "next";
import Shell from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RoboHub — Robotics Hackathons & Training", template: "%s · RoboHub" },
  description: "Robotics hackathons, events and hands-on training: drones, humanoids, ROS 2 and robot learning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
