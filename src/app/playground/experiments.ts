// Playground experiments, in display order. The slug is the URL and picks the interactive component in
// components/playground/experiment.tsx; the rest is the copy on the index card and the detail page.
export type Experiment = {
  slug: string;
  title: string;
  // what visitors can do, one line, shown on the card
  play: string;
  // the idea the experiment is about, one line
  idea: string;
  // the write-up under the canvas
  notes: string[];
  // small prompts for things worth trying
  tryThis: string[];
};

export const experiments: Experiment[] = [
  {
    slug: "cellular-automata",
    title: "Elementary cellular automata",
    play: "Switch between Rule 30, Rule 90 and Rule 110, and change the starting cells.",
    idea: "How tiny rule changes produce dramatically different patterns.",
    notes: [
      "Each row is one generation of a line of cells. A cell's next state depends only on itself and its two neighbors, so there are just eight possible neighborhoods, and a rule is nothing more than eight yes-or-no answers. Read those answers as a binary number and you get the rule's name.",
      "Rule 90 draws a perfect Sierpiński triangle. Rule 30 looks like noise, random enough that it was once used to generate random numbers. Rule 110 sits in between, with structures that move and collide, and it has been proven capable of universal computation. The three differ by a few bits in the rule table.",
    ],
    tryThis: [
      "Flip a single outcome in the rule table and watch the whole pattern change character.",
      "Start Rule 90 from a random row: the triangles still appear, just overlapping.",
      "On Rule 110, click a few cells into an empty row and see which structures survive.",
    ],
  },
  {
    slug: "boids",
    title: "Boids / flocking",
    play: "Adjust separation, alignment and cohesion, and startle the flock with the pointer.",
    idea: "How coordinated movement emerges without a leader.",
    notes: [
      "Every bird follows three rules about the neighbors it can see: don't crowd them (separation), head the way they're heading (alignment), and drift toward their centre (cohesion). No bird knows where the flock is going, and there is no leader. Craig Reynolds described this in 1987, and variations of it still animate crowds and herds in films.",
      "The interesting part is the balance. Turn cohesion up and the flock collapses into tight balls; turn alignment up and it streams in parallel lanes; remove separation and birds stack on top of each other. Flocking only looks natural in a fairly narrow band where all three pull against each other.",
    ],
    tryThis: [
      "Set alignment to zero: birds still clump, but they mill around instead of travelling.",
      "Shrink the vision radius and watch one big flock break into many small ones.",
      "Hold the pointer in the middle of a flock and watch it split and rejoin around you.",
    ],
  },
  {
    slug: "reaction-diffusion",
    title: "Reaction–diffusion",
    play: "Paint onto the canvas and watch spots and stripes form.",
    idea: "How local chemical interactions can create organic patterns.",
    notes: [
      "This is the Gray–Scott model: two chemicals spread across a surface, and one consumes the other to make more of itself. The fed chemical diffuses quickly while the catalyst diffuses slowly, so wherever the catalyst gathers it starves its own surroundings. That tension between local growth and inhibition around it is what produces stable spots and stripes.",
      "Alan Turing proposed this mechanism in 1952 as an explanation for how an embryo could form patterns from a uniform start, and similar dynamics are now thought to shape things like zebrafish stripes and the spacing of hair follicles. Two numbers, the feed rate and the kill rate, choose which pattern you get.",
    ],
    tryThis: [
      "Paint a line on Spots and watch it break up into a row of dots.",
      "Switch presets mid-way: the existing pattern reorganizes into the new one.",
      "Nudge Feed slowly in Custom and find where spots turn into stripes.",
    ],
  },
  {
    slug: "falling-sand",
    title: "Sand simulation",
    play: "Drop sand, water and stone into a little world.",
    idea: "How simple material rules create believable behavior.",
    notes: [
      "Every grain only checks the cells right next to it. Sand falls if the space below is free, otherwise it tries to slide diagonally. Water does the same, and if it still can't move it spreads sideways. Stone never moves. That's all.",
      "Out of those rules you get piles with a consistent slope, water that levels itself out and fills basins, and sand that sinks through water because it's allowed to swap places with it. None of that is programmed directly: the behavior you recognize as \"sand\" is what the neighborhood rules add up to.",
    ],
    tryThis: [
      "Pour sand onto a ledge and watch the pile settle to the same angle every time.",
      "Fill a basin with water, then pour sand into it.",
      "Build a funnel out of stone and pour through it.",
    ],
  },
  {
    slug: "maze-generation",
    title: "Maze generation",
    play: "Watch different algorithms build a maze.",
    idea: "How different approaches shape the same problem.",
    notes: [
      "Every algorithm here produces a perfect maze: a spanning tree of the grid, with exactly one route between any two cells. Yet you can tell them apart at a glance. The recursive backtracker digs one long corridor until it gets stuck, so its mazes have long winding passages and few branches. Prim's grows outward from a point and leaves many short dead ends. Kruskal's joins random walls all over the grid at once.",
      "Wilson's algorithm uses random walks that erase their own loops. It's slow to start but picks every possible maze with equal probability, which makes it the unbiased one. The binary tree algorithm is the opposite: each cell only opens north or east, so it's fast and simple but leaves a clear diagonal grain and two long open edges.",
    ],
    tryThis: [
      "Compare the dead-end counts: Prim's usually has the most, the backtracker the fewest.",
      "Watch the start of Wilson's at a slow speed, then speed it up once the maze takes hold.",
      "Look for the long straight corridors on the top and right of a binary tree maze.",
    ],
  },
  {
    slug: "pathfinding",
    title: "Pathfinding",
    play: "Draw walls and mud, move the start and goal, and compare the routes.",
    idea: "The tradeoffs between exploring broadly and moving toward a goal.",
    notes: [
      "All four searches keep a frontier of cells they could visit next; they differ only in which one they pick. Breadth-first takes the fewest steps first and spreads evenly in every direction. Dijkstra picks the cheapest so far, so it walks around mud. Greedy best-first heads straight for the goal and explores very little, but it can be fooled into long detours. A* adds the cost so far to an estimate of the distance left, and gets the cheapest route while exploring far less than Dijkstra.",
      "The table keeps score: how many cells each one looked at, and what its route costs. Breadth-first and Greedy can return routes that wade through mud; Dijkstra and A* never do, but pay for it in cells explored.",
    ],
    tryThis: [
      "Build a cup-shaped wall facing the start and watch Greedy walk into it.",
      "Put a mud patch between start and goal and compare route costs.",
      "Clear the grid: on open ground A* and Greedy barely explore at all.",
    ],
  },
  {
    slug: "flow-fields",
    title: "Flow fields",
    play: "Change the field, the particle count and the trails.",
    idea: "How noise can create movement that feels natural.",
    notes: [
      "A flow field assigns a direction to every point on the canvas, and particles simply follow it. Pure randomness would make them jitter, but Perlin noise is smooth: nearby points get similar values, so the directions bend gradually and the paths look like wind, water or hair.",
      "Curl noise takes the same noise and rotates its slope by a right angle. The result has no sources or sinks, so particles circulate in eddies instead of piling up in valleys, which is why it's popular for smoke and fluid effects. Letting the noise drift over time makes the whole field breathe.",
    ],
    tryThis: [
      "Turn on Show field to see the arrows the particles are following.",
      "Push Trails to the top and lower Speed for long, painterly strokes.",
      "Compare Perlin and Curl: watch where particles gather in one and not the other.",
    ],
  },
  {
    slug: "spring-systems",
    title: "Spring systems",
    play: "Drag a cloth, a rope or a soft body.",
    idea: "How forces and constraints produce motion.",
    notes: [
      "Each scene is just points joined by sticks. The points use Verlet integration: rather than storing velocity, each point remembers where it was last frame and keeps going by the same amount, plus gravity. Then every stick nudges its two ends back toward its rest length.",
      "One pass of that correction leaves things stretchy; repeating it many times per frame makes them stiff, which is what the Stiffness slider changes. Cloth is a grid of sticks, rope is a chain, and the soft bodies are rings with weak springs to their centres. The color of each link shows how stretched it is.",
    ],
    tryThis: [
      "Turn on Tearable and pull the cloth hard.",
      "Drop stiffness to zero and drag a rope: it stretches like elastic.",
      "Throw a soft body against the wall, then turn gravity off.",
    ],
  },
  {
    slug: "fractals",
    title: "Fractals",
    play: "Zoom into the Mandelbrot set or grow branching trees.",
    idea: "Recursion, self-similarity, and complexity across scales.",
    notes: [
      "The Mandelbrot set comes from one line: start at zero, square the number and add c, and repeat. If it stays small forever, c is in the set. The boundary between staying small and escaping is infinitely detailed, and zooming in keeps turning up spirals, seahorses and small copies of the whole set. The colors count how fast each point escapes.",
      "The tree is recursion you can see: a branch ends in two smaller branches, each of which ends in two smaller branches, down to the depth you choose. Two numbers, the angle between branches and how much each one shrinks, decide whether you get a pine, a bush or a fern-like spray.",
    ],
    tryThis: [
      "Keep clicking the same point near the edge of the Mandelbrot set until you hit the precision limit.",
      "Raise Detail when zoomed deep; the edges sharpen.",
      "Set the tree's angle to 90° and shrink to about 70% for an H-tree.",
    ],
  },
  {
    slug: "wave-interference",
    title: "Wave interference",
    play: "Place wave sources and adjust their frequency.",
    idea: "How simple waves combine into unexpected patterns.",
    notes: [
      "Each source sends out circular ripples, and the canvas shows the sum of all of them. Where two crests arrive together they add up; where a crest meets a trough they cancel. With two sources at the same frequency this gives the fan of bright and dark bands from Young's double-slit experiment.",
      "The Loudness view shows how strongly each point vibrates over time, which makes the quiet lines easy to see. Put several sources in a row and they act like a phased array, sending a narrow beam in one direction. Give two sources slightly different frequencies and the pattern sweeps slowly, the same effect as beats between two nearly matched notes.",
    ],
    tryThis: [
      "Drag two sources apart and watch the number of quiet lines grow.",
      "Try A line (beam) and switch to Loudness.",
      "Set two sources to 1.20 Hz and 1.25 Hz and watch the pattern sweep.",
    ],
  },
];
