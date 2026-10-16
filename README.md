# RoboHub — robotics hackathons, events & training

A Next.js 16 (App Router, TypeScript) site with a Kaggle-style layout for hosting robotics hackathons, events and training.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

## Pages

| Route | What it is |
|---|---|
| `/` | Home: hero stats, "choose a focus" cards, featured hackathons, tracks, events, news |
| `/hackathons` | Filterable list (status tabs + search from the top bar) |
| `/hackathons/[slug]` | Overview, tracks, hardware, rules, judging weights, timeline |
| `/events` | Workshops, bootcamps, talks, meetups with RSVP |
| `/training` | 9-week "Introduction to Robotics" syllabus + other tracks |
| `/training/[slug]` | Module page with topics, lab, prev/next navigation |
| `/news` | Robotics headlines linking to The Rundown |
| `/leaderboard` | Season standings |
| `/register` | Team/event registration form (client-side only for now) |

## Editing content

All content lives in `lib/data.ts`. **Hackathons, events and leaderboard entries are sample data** — replace them with your real ones.

- Training syllabus follows the structure of a university intro-to-robotics course
  (reference: Princeton IROM Lab, https://irom-lab.princeton.edu/intro-to-robotics/).
- News headlines link to https://www.therundown.ai/articles-category/robotics.

## Next steps

- Hook `components/RegisterForm.tsx` to a Route Handler + database (e.g. Supabase) to store registrations.
- Deploy on Vercel: push to GitHub and import the repo.

## RoboHub Social (X-style community)

`/feed` is an X-style social network for robotics: accounts, posts with up to 4 images, replies, likes, reposts,
quotes, bookmarks, @mentions, #hashtags, follows, notifications, profiles, search and trending.

| Route | What it is |
|---|---|
| `/feed` | Home timeline — **For you** (ranked) / **Following** |
| `/u/[handle]` | Profile — Posts / Replies / Media / Likes |
| `/u/[handle]/status/[id]` | Post with its reply thread |
| `/explore`, `/hashtag/[tag]` | Search posts & people, trending hashtags |
| `/notifications`, `/bookmarks` | Signed-in only |
| `/signup`, `/login`, `/settings/profile` | Accounts |

**Storage (local):** SQLite via Node's built-in `node:sqlite` (Node 22+) at `data/robohub.db`; uploads in
`data/uploads/`. Both are git-ignored. Delete the `data` folder to reset.

**Google sign-in:** copy `.env.local.example` to `.env.local`, add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
(OAuth client, redirect URI `http://localhost:3000/api/auth/google/callback`) and restart `npm run dev`.

**Before deploying:** Cloud Run's disk is temporary, so swap `lib/server/db.ts` + `lib/server/media.ts` for a managed
database (Firestore / Cloud SQL) and Cloud Storage.