import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import type { UserCard } from "@/lib/server/social";

export default function UserRow({ user, signedIn, compact, isSelf }: { user: UserCard; signedIn: boolean; compact?: boolean; isSelf?: boolean }) {
  return (
    <div className={`user-row ${compact ? "compact" : ""}`}>
      <Link href={`/u/${user.handle}`}><Avatar name={user.name} src={user.avatar} size={40} /></Link>
      <Link href={`/u/${user.handle}`} className="user-row-main">
        <strong className="ellipsis">{user.name} {user.verified ? <BadgeCheck size={15} className="verified" /> : null}</strong>
        <span className="muted ellipsis">@{user.handle}</span>
        {!compact && user.bio && <span className="small">{user.bio}</span>}
      </Link>
      {!isSelf && <FollowButton handle={user.handle} initial={!!user.viewer_follows} signedIn={signedIn} small />}
    </div>
  );
}
