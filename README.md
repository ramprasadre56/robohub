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

## Robotics topic feed

`/topics/robotics` is an X-style discussion feed (posts, replies, likes). In production it stores posts in Firestore (collection `robohub_posts`) using the `robohub-sa` service account; in local dev it uses an in-memory store (set `FEED_STORE=firestore` to use Firestore locally after `gcloud auth application-default login`).

