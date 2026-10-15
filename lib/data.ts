// Sample content for RoboHub. Replace with your real events, or wire to a CMS / database.

export type Status = "open" | "upcoming" | "live" | "completed";

export type Hackathon = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  start: string; // ISO date
  end: string;
  mode: "In person" | "Online" | "Hybrid";
  location: string;
  prize: string;
  teamSize: string;
  status: Status;
  tags: string[];
  participants: number;
  hardware: string[];
  timeline: { date: string; label: string }[];
  tracks: { name: string; detail: string }[];
  rules: string[];
  judging: { criterion: string; weight: number }[];
};

export const hackathons: Hackathon[] = [
  {
    slug: "humanoid-hack-2026",
    title: "Humanoid Hack 2026",
    tagline: "48 hours to teach a humanoid a useful household skill.",
    description:
      "Teams get time on shared humanoid platforms and a simulation stack to build one useful skill end to end: folding a towel, clearing a table, or handing over an object safely. Inspired by the wave of home and general-purpose humanoids now leaving the lab.",
    start: "2026-11-21",
    end: "2026-11-23",
    mode: "Hybrid",
    location: "Hyderabad, India + online",
    prize: "₹5,00,000",
    teamSize: "2–5",
    status: "open",
    tags: ["Humanoids", "Manipulation", "Imitation learning"],
    participants: 412,
    hardware: ["Shared humanoid testbeds (on site)", "MuJoCo / Isaac Sim (online)", "Teleop rigs for data collection"],
    timeline: [
      { date: "2026-10-15", label: "Registration opens" },
      { date: "2026-11-10", label: "Registration closes" },
      { date: "2026-11-14", label: "Pre-hack workshop: teleop & data collection" },
      { date: "2026-11-21", label: "Kick-off & hardware slots assigned" },
      { date: "2026-11-23", label: "Demos, judging & awards" },
    ],
    tracks: [
      { name: "Home assist", detail: "Tidy, fetch, fold: everyday chores in a mock apartment." },
      { name: "Safe handover", detail: "Human-robot object handover with force limits." },
      { name: "Sim-only", detail: "Remote teams compete fully in simulation." },
    ],
    rules: [
      "All code must be written during the event; open-source libraries and pretrained models are allowed.",
      "Hardware time is booked in 45-minute slots per team.",
      "Every demo must include an emergency-stop operator.",
      "Submissions: repo link, 2-minute video, and a short README.",
    ],
    judging: [
      { criterion: "Task success rate", weight: 40 },
      { criterion: "Generalisation to new objects", weight: 25 },
      { criterion: "Safety & robustness", weight: 20 },
      { criterion: "Presentation", weight: 15 },
    ],
  },
  {
    slug: "drone-obstacle-challenge",
    title: "Autonomous Drone Obstacle Challenge",
    tagline: "Fly a nano-quadrotor through an unknown obstacle course — no pilot.",
    description:
      "Modeled on the final project of university intro-to-robotics courses: teams program a Crazyflie-class nano drone to estimate its state, detect obstacles with onboard sensing, plan a path and land on a target. Fastest clean run wins.",
    start: "2026-12-12",
    end: "2026-12-13",
    mode: "In person",
    location: "Bengaluru, India",
    prize: "₹3,00,000",
    teamSize: "2–4",
    status: "open",
    tags: ["Drones", "Motion planning", "State estimation"],
    participants: 186,
    hardware: ["Crazyflie 2.1 nano quadrotor (provided)", "Flow deck + multi-ranger deck", "Python cflib"],
    timeline: [
      { date: "2026-10-15", label: "Registration opens" },
      { date: "2026-11-28", label: "Registration closes" },
      { date: "2026-12-05", label: "Online bootcamp: PID, Kalman filter, RRT" },
      { date: "2026-12-12", label: "Practice flights" },
      { date: "2026-12-13", label: "Timed finals" },
    ],
    tracks: [
      { name: "Speed run", detail: "Shortest time from take-off to landing pad." },
      { name: "Vision", detail: "Find and land on a visual target using the camera deck." },
    ],
    rules: [
      "No manual control after take-off.",
      "Collisions add a 10-second penalty; a crash ends the run.",
      "Three attempts per team; best run counts.",
    ],
    judging: [
      { criterion: "Completion time", weight: 50 },
      { criterion: "Collisions", weight: 30 },
      { criterion: "Code quality & write-up", weight: 20 },
    ],
  },
  {
    slug: "lerobot-sim2real-sprint",
    title: "LeRobot Sim-to-Real Sprint",
    tagline: "Train a policy in simulation, deploy it on a low-cost arm.",
    description:
      "A two-week online sprint using open-source robot-learning tools. Collect demonstrations, train an ACT or diffusion policy, and show it working on an SO-100-style arm — or in simulation if you don't have hardware.",
    start: "2027-01-09",
    end: "2027-01-23",
    mode: "Online",
    location: "Online",
    prize: "$10,000 + hardware kits",
    teamSize: "1–4",
    status: "upcoming",
    tags: ["Robot learning", "Open source", "Arms"],
    participants: 958,
    hardware: ["SO-100 / SO-101 arm (optional)", "Hugging Face LeRobot", "Gym / MuJoCo environments"],
    timeline: [
      { date: "2026-12-01", label: "Registration opens" },
      { date: "2027-01-09", label: "Sprint starts" },
      { date: "2027-01-16", label: "Mid-sprint office hours" },
      { date: "2027-01-23", label: "Final submissions" },
    ],
    tracks: [
      { name: "Real hardware", detail: "Policy evaluated on your own arm via video + logs." },
      { name: "Simulation", detail: "Evaluated on held-out simulated tasks." },
      { name: "Datasets", detail: "Best open dataset contribution to the Hub." },
    ],
    rules: [
      "Policies and datasets must be published openly.",
      "Evaluation scripts are provided and must not be modified.",
    ],
    judging: [
      { criterion: "Success rate on held-out tasks", weight: 60 },
      { criterion: "Sample efficiency", weight: 20 },
      { criterion: "Reproducibility", weight: 20 },
    ],
  },
  {
    slug: "rover-field-trials",
    title: "Rover Field Trials",
    tagline: "Outdoor navigation and mapping on rough terrain.",
    description:
      "Build or bring a wheeled rover running ROS 2. Map an outdoor course, localise against your map, and complete waypoint missions while avoiding obstacles.",
    start: "2027-02-20",
    end: "2027-02-21",
    mode: "In person",
    location: "Pune, India",
    prize: "₹2,00,000",
    teamSize: "3–6",
    status: "upcoming",
    tags: ["ROS 2", "SLAM", "Navigation"],
    participants: 74,
    hardware: ["Bring your own rover", "ROS 2 Jazzy + Nav2", "RTK GPS (provided)"],
    timeline: [
      { date: "2026-12-15", label: "Registration opens" },
      { date: "2027-02-01", label: "Design review" },
      { date: "2027-02-20", label: "Mapping day" },
      { date: "2027-02-21", label: "Mission day" },
    ],
    tracks: [{ name: "Waypoint missions", detail: "Visit GPS waypoints in order." }],
    rules: ["Rovers must weigh under 25 kg.", "A hardware kill switch is mandatory."],
    judging: [
      { criterion: "Waypoints reached", weight: 60 },
      { criterion: "Map quality", weight: 25 },
      { criterion: "Safety", weight: 15 },
    ],
  },
  {
    slug: "pick-and-place-cup",
    title: "Pick & Place Cup 2026",
    tagline: "Bin-picking speed and accuracy challenge.",
    description: "Teams programmed 6-DOF arms to sort mixed objects from a cluttered bin.",
    start: "2026-09-05",
    end: "2026-09-06",
    mode: "In person",
    location: "Hyderabad, India",
    prize: "₹1,50,000",
    teamSize: "2–4",
    status: "completed",
    tags: ["Manipulation", "Perception"],
    participants: 132,
    hardware: ["UR-class arms", "RGB-D cameras"],
    timeline: [{ date: "2026-09-06", label: "Winners announced" }],
    tracks: [{ name: "Open", detail: "Single track." }],
    rules: ["Completed event."],
    judging: [{ criterion: "Picks per minute", weight: 100 }],
  },
];

export type Event = {
  title: string;
  kind: "Workshop" | "Meetup" | "Talk" | "Bootcamp";
  date: string;
  time: string;
  location: string;
  host: string;
  summary: string;
};

export const events: Event[] = [
  {
    title: "Build your first ROS 2 robot",
    kind: "Workshop",
    date: "2026-10-24",
    time: "10:00–16:00 IST",
    location: "Hyderabad",
    host: "RoboHub mentors",
    summary: "Hands-on: nodes, topics, URDF and driving a differential-drive bot in Gazebo.",
  },
  {
    title: "Humanoids in the home: hype vs. reality",
    kind: "Talk",
    date: "2026-10-30",
    time: "18:30 IST",
    location: "Online",
    host: "Guest panel",
    summary: "Where general-purpose humanoids actually stand on safety, cost and useful tasks.",
  },
  {
    title: "Drone bootcamp: PID to Kalman filter",
    kind: "Bootcamp",
    date: "2026-11-07",
    time: "Sat & Sun, 09:30 IST",
    location: "Bengaluru",
    host: "RoboHub mentors",
    summary: "Two-day prep for the Drone Obstacle Challenge — controls, estimation and planning.",
  },
  {
    title: "Teleop & data collection for imitation learning",
    kind: "Workshop",
    date: "2026-11-14",
    time: "14:00–17:00 IST",
    location: "Online",
    host: "Humanoid Hack team",
    summary: "Record good demonstrations and turn them into a training dataset.",
  },
  {
    title: "Robotics builders meetup #12",
    kind: "Meetup",
    date: "2026-11-28",
    time: "17:00 IST",
    location: "Hyderabad",
    host: "Community",
    summary: "Lightning demos, hiring board and pizza.",
  },
];

export type Module = {
  slug: string;
  week: number;
  title: string;
  summary: string;
  topics: string[];
  lab: string;
};

// Curriculum structure follows a typical university intro-to-robotics course
// (e.g. Princeton IROM Lab's Intro to Robotics, taught with Crazyflie drones).
export const course = {
  title: "Introduction to Robotics",
  subtitle: "From feedback control to autonomous flight — hands-on with nano drones.",
  reference: "https://irom-lab.princeton.edu/intro-to-robotics/",
  modules: [
    {
      slug: "foundations",
      week: 1,
      title: "Foundations & robot anatomy",
      summary: "Sensors, actuators, compute and the sense–plan–act loop.",
      topics: ["What makes a robot", "Coordinate frames & rotations", "Python + simulation setup"],
      lab: "Set up the simulator and fly a drone with keyboard teleop.",
    },
    {
      slug: "feedback-control",
      week: 2,
      title: "Feedback control",
      summary: "Why open-loop fails and how PD/PID control fixes it.",
      topics: ["Open vs closed loop", "P, PD and PID controllers", "Tuning and stability intuition"],
      lab: "Tune a PID altitude controller to hover at 0.5 m.",
    },
    {
      slug: "dynamics-lqr",
      week: 3,
      title: "Dynamics & optimal control",
      summary: "Model quadrotor dynamics, linearise, and design an LQR controller.",
      topics: ["Equations of motion", "Linearisation", "Linear Quadratic Regulator"],
      lab: "Stabilise a simulated quadrotor with LQR.",
    },
    {
      slug: "state-estimation",
      week: 4,
      title: "State estimation",
      summary: "Noisy sensors, Bayes filters and the Kalman filter.",
      topics: ["Probability refresher", "Bayes filter", "Kalman & extended Kalman filters"],
      lab: "Fuse IMU and flow-deck data to estimate position.",
    },
    {
      slug: "localization-mapping",
      week: 5,
      title: "Localization & mapping",
      summary: "Where am I, and what's around me?",
      topics: ["Particle filters", "Occupancy grids", "Intro to SLAM"],
      lab: "Build an occupancy map with range sensors.",
    },
    {
      slug: "motion-planning",
      week: 6,
      title: "Motion planning",
      summary: "Find collision-free paths in configuration space.",
      topics: ["Configuration space", "Graph search: Dijkstra, A*", "Sampling-based: PRM, RRT"],
      lab: "Plan through an obstacle field with RRT.",
    },
    {
      slug: "vision",
      week: 7,
      title: "Robot vision",
      summary: "Cameras as sensors: geometry, features and detection.",
      topics: ["Pinhole camera model", "Features & optical flow", "Object detection with deep nets"],
      lab: "Detect and approach a coloured target with the camera.",
    },
    {
      slug: "robot-learning",
      week: 8,
      title: "Learning for robotics",
      summary: "Imitation learning, reinforcement learning, and generalisation.",
      topics: ["Behaviour cloning", "Policy gradients", "Sim-to-real & safety"],
      lab: "Train a navigation policy from demonstrations.",
    },
    {
      slug: "final-project",
      week: 9,
      title: "Final project: autonomous obstacle course",
      summary: "Put it all together — fly through an unknown course and land on target.",
      topics: ["System integration", "Testing & debugging on hardware", "Demo day"],
      lab: "Timed autonomous run — doubles as the Drone Obstacle Challenge qualifier.",
    },
  ] as Module[],
};

export const tracks = [
  { title: "Introduction to Robotics", level: "Beginner", hours: 40, href: "/training/foundations", lessons: 9 },
  { title: "ROS 2 Bootcamp", level: "Beginner", hours: 12, href: "/events", lessons: 6 },
  { title: "Robot Learning with LeRobot", level: "Intermediate", hours: 18, href: "/training/robot-learning", lessons: 7 },
  { title: "Perception & Computer Vision", level: "Intermediate", hours: 15, href: "/training/vision", lessons: 6 },
];

export const news = [
  { title: "UCLA builds a humanoid from smartphone", slug: "ucla-builds-a-humanoid-from-smartphone", read: 5 },
  { title: "Meet Roger, the bomb-squad humanoid", slug: "meet-roger-the-bomb-squad-humanoid", read: 5 },
  { title: "California crashes robot fight club", slug: "california-crashes-robot-fight-club", read: 5 },
  { title: "DoorDash puts its own drone on the menu", slug: "doordash-puts-its-own-drone-on-the-menu", read: 6 },
  { title: "Agility's new 'safer' humanoid", slug: "agility-new-safer-humanoid", read: 6 },
  { title: "Japan's latest answer to home robots", slug: "japan-latest-answer-to-home-robots", read: 6 },
  { title: "Tesla's Cybercab is already getting weird", slug: "tesla-cybercab-is-already-getting-weird", read: 5 },
  { title: "A catwalk at IFA, but for robots", slug: "a-catwalk-at-ifa-but-for-robots", read: 6 },
  { title: "Apptronik opens massive 'Robot Park'", slug: "apptronik-opens-massive-robot-park", read: 5 },
  { title: "Bio-robotic spy roaches", slug: "bio-robotic-spy-roaches", read: 4 },
  { title: "Figure's humanoid cleans living room", slug: "figure-humanoid-cleans-living-room", read: 4 },
  { title: "Meet Eno, the anti-humanoid robot", slug: "meet-eno-the-anti-humanoid-robot", read: 4 },
].map((n) => ({ ...n, url: `https://www.therundown.ai/articles/${n.slug}` }));

export const NEWS_SOURCE = "https://www.therundown.ai/articles-category/robotics";

export const leaderboard = [
  { team: "Servo Squad", city: "Hyderabad", points: 2840, wins: 3, events: 7 },
  { team: "Kalman Kids", city: "Bengaluru", points: 2615, wins: 2, events: 6 },
  { team: "RRT Runners", city: "Chennai", points: 2390, wins: 2, events: 8 },
  { team: "Torque Theory", city: "Pune", points: 2110, wins: 1, events: 5 },
  { team: "Actuate", city: "Online", points: 1985, wins: 1, events: 6 },
  { team: "Gripper Gang", city: "Hyderabad", points: 1760, wins: 1, events: 4 },
  { team: "Odometry", city: "Delhi", points: 1520, wins: 0, events: 5 },
  { team: "Bot Builders IIT", city: "Mumbai", points: 1340, wins: 0, events: 3 },
];

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", opts);
}

export function dateRange(a: string, b: string) {
  if (a === b) return formatDate(a);
  return `${formatDate(a, { day: "numeric", month: "short" })} – ${formatDate(b)}`;
}
