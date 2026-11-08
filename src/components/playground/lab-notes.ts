// Copy for the lab experiments that follow Game of Life in the switcher, in display order.
// The slug picks the interactive component in labs.tsx; experiments.tsx turns each entry into notes
// laid out like game of life: premise + numbered rules, then "initial thoughts."
export type LabNote = {
  slug: string;
  title: string;
  // what visitors can do, one line, shown under the notes title
  play: string;
  // what the experiment is, a sentence or two, ending right before the rules
  premise?: string;
  // the instructions that create the pattern
  rules?: string[];
  // initial thoughts: a few continuous paragraphs on what I found
  thoughts?: string[];
  // old-style notes, for entries not yet rewritten
  idea?: string;
  notes?: string[];
  tryThis?: string[];
  // the work an experiment reproduces, credited under its notes
  cite?: { text: string; href: string };
};

export const labNotes: LabNote[] = [
  {
    slug: "cellular-automata",
    title: "elementary cellular automata",
    play: "pick a rule, then click along the canvas to flip cells in the starting row!",
    premise:
      "premise: a single row of cells, each on or off. every generation is a new row underneath. a cell only looks at itself and its two neighbors, so there are just eight possible neighborhoods, and a rule is eight yes/no answers.",
    rules: [
      "look at a cell and its left and right neighbors.",
      "find that pattern in the rule's table to get on or off.",
      "write the answer into the row below.",
      "read the eight answers as a binary number and that's the rule's name (rule 30 is 00011110).",
    ],
    thoughts: [
      "what surprised me most is how little separates these three. rule 30, 90 and 110 differ by only two or three entries in their tables, yet one draws a perfect sierpiński triangle, one looks like static, and one sits somewhere in between. rule 90 makes sense once you notice each new cell is just the xor of its two neighbors, which is pascal's triangle with the odd numbers colored in.",
      "rule 30 is random enough that stephen wolfram used its center column as a random number generator in mathematica. rule 110 goes further: in 2004 matthew cook proved it's turing complete, using the little structures that drift across it and crash into each other as signals. i still find it strange that the calmer-looking rule is the one that can compute anything, while nobody has shown the same for rule 30.",
    ],
  },
  {
    slug: "neural-ca",
    title: "growing neural cellular automata",
    play: "pick a creature, then drag across it to cut pieces off. double-click to plant a new seed!",
    premise:
      "premise: every cell runs the same tiny neural network. each cell holds 16 numbers: four for its color and transparency, and twelve hidden ones it uses to talk to its neighbors. the network was trained so one seed cell grows into an emoji.",
    rules: [
      "each cell looks at itself and how its 3×3 neighborhood is changing.",
      "it runs that through the network and gets a small update.",
      "it adds the update to its own state.",
      "only about half the cells update each step, at random, so there's no global clock.",
    ],
    thoughts: [
      "the part that stuck with me is that no cell knows the shape. nothing in the network knows where it is or what a lizard looks like, so the creature only exists as a pattern of local messages passed between neighbors. what each model can do depends entirely on how it was trained. growing models only learned to grow, so they often keep spreading or fall apart. persistent ones learned to hold still, and regenerating ones were damaged during training, which is why they can grow a tail back.",
      "that's close to real biology, which isn't an accident: michael levin, one of the authors, studies how real cells coordinate like this, and planarian flatworms can regrow an entire head. rotation works too, because each cell's sense of direction comes from its gradients, so rotating them turns the whole creature without retraining. i keep wondering whether one rule could grow different shapes if the seed carried a message picking which one.",
    ],
    cite: {
      text: "mordvintsev, randazzo, niklasson & levin, \"growing neural cellular automata\", distill, 2020",
      href: "https://distill.pub/2020/growing-ca/",
    },
  },
  {
    slug: "boids",
    title: "boids / flocking",
    play: "move the sliders to change the flock, and use the pointer to scare it!",
    premise:
      "premise: every bird only sees the neighbors close to it. there's no leader and nobody knows where the flock is going. craig reynolds came up with this in 1987.",
    rules: [
      "separation: don't crowd your neighbors.",
      "alignment: steer the way they're heading.",
      "cohesion: steer toward their average position.",
    ],
    thoughts: [
      "flocking only looks natural in a surprisingly narrow band. too much cohesion and the birds collapse into balls, too much alignment and they stream in lanes, and without separation they stack on top of each other. even with alignment at zero they still clump, they just mill around instead of going anywhere, and shrinking the vision radius breaks one big flock into lots of little ones.",
      "real starlings seem to work a bit differently. a 2008 study of murmurations found each bird tracks about six or seven nearest neighbors, however far away they are, rather than everyone within some distance. reynolds' version has been good enough for film since 1992, when it animated the bat swarms and penguin armies in batman returns. it makes me wonder what the fewest rules are that still read as alive.",
    ],
  },
  {
    slug: "reaction-diffusion",
    title: "reaction–diffusion",
    play: "paint on the canvas and watch spots and stripes grow!",
    premise:
      "premise: two chemicals, a and b, spread across a surface. b eats a to make more of itself. a spreads fast and b spreads slow, so wherever b gathers it starves the area around it. this is the gray–scott model.",
    rules: [
      "a is fed in everywhere at a steady rate (feed).",
      "b is removed everywhere at a steady rate (kill).",
      "where a meets two b's, it turns into b.",
      "both spread to their neighbors, a about twice as fast as b.",
    ],
    thoughts: [
      "alan turing predicted this in 1952, suggesting it's how an embryo could get patterns from a blank start (the same turing who broke enigma). the whole range of behavior comes down to two numbers: feed and kill choose between spots, stripes, mazes or nothing at all, and john pearson mapped those regions out in 1993. painting a line on spots shows it nicely, since the line splits into a neat row of dots.",
      "it seems to happen in real animals too. zebrafish stripes look like they come from pigment cells pushing and pulling on each other in a turing-like way. james murray took it further and argued that body shape matters: a thin tail only has room for stripes, which might be why leopards have spotted bodies and striped tails.",
    ],
  },
  {
    slug: "falling-sand",
    title: "sand simulation",
    play: "pick sand, water or stone and draw!",
    premise: "premise: every grain only looks at the cells right next to it.",
    rules: [
      "sand falls if the space below is empty, otherwise it slides diagonally.",
      "sand sinks through water by swapping places with it.",
      "water falls the same way, and if it's stuck it spreads sideways.",
      "stone never moves.",
    ],
    thoughts: [
      "piles always settle at the same angle. real sand does this too (the angle of repose), but here it comes out around 45°, because grains can only slide one cell diagonally. water filling a basin evenly isn't programmed anywhere either, it just falls out of the spread-sideways rule.",
      "the order you update in matters more than i expected. if you always scan left to right, everything drifts to one side, and alternating the direction each frame hides it. whole games run on rules like these: noita simulates every pixel of its world this way. i'd like to try fire next, which might only need one more rule: spread to anything flammable, then burn out.",
    ],
  },
  {
    slug: "maze-generation",
    title: "maze generation",
    play: "pick an algorithm and watch it build a maze!",
    premise:
      "premise: every maze here is perfect, meaning there's exactly one route between any two cells. the algorithms all solve the same problem but leave different fingerprints.",
    rules: [
      "recursive backtracker: dig in a random direction until you're stuck, then back up.",
      "prim's: grow out from one cell, opening a random wall on the edge.",
      "kruskal's: knock down random walls anywhere, as long as it doesn't make a loop.",
      "wilson's: take random walks, erasing any loops, until you hit the maze.",
      "binary tree: every cell opens either north or east.",
    ],
    thoughts: [
      "you can tell the algorithms apart at a glance. the backtracker makes long winding corridors, prim's leaves lots of short dead ends, and binary tree always has a long open corridor along the top and right edges with a diagonal lean to everything. wilson's is the fair one: it picks every possible maze with equal probability, slow to start and then filling in all at once.",
      "underneath, every one of them is building a spanning tree, the same math as connecting cities with the least amount of cable. i also wondered whether a messier-looking maze takes longer to solve. prim's looks harder, but its dead ends are so short they barely slow you down.",
    ],
  },
  {
    slug: "pathfinding",
    title: "pathfinding",
    play: "draw walls and mud, drag the start and goal, and compare the routes!",
    premise:
      "premise: every search keeps a frontier, the cells it could visit next. they only differ in which one they pick.",
    rules: [
      "breadth-first: whichever was found first, so it spreads evenly.",
      "dijkstra: whichever is cheapest so far, so it walks around mud.",
      "greedy: whichever looks closest to the goal.",
      "a*: cheapest so far plus a guess of the distance left.",
    ],
    thoughts: [
      "greedy is fast and easy to fool: put a cup-shaped wall facing the start and it walks right in. a* is basically dijkstra with a hint. it finds the same cheapest route while exploring way fewer cells, and as long as its guess never overestimates, it always finds the best path. mud splits them up too, since breadth-first and greedy wade straight through it while dijkstra and a* go around.",
      "a* was invented in 1968 for shakey, one of the first robots that could plan its own moves. one thing i'm still thinking about is the best guess when diagonal moves are allowed. straight-line distance works but undersells the real cost, so a* ends up exploring more than it needs to.",
    ],
  },
  {
    slug: "flow-fields",
    title: "flow fields",
    play: "change the field, the number of particles and the trails!",
    premise: "premise: every point on the canvas gets a direction, and particles just follow it.",
    rules: [
      "sample noise at each point and turn it into an angle.",
      "each particle moves a little in the direction under it.",
      "it leaves a fading trail behind.",
      "the noise slowly drifts over time.",
    ],
    thoughts: [
      "pure randomness just jitters. perlin noise is smooth, so nearby points face the same way and the paths bend like wind or hair. ken perlin made it after working on tron, and won a technical oscar for it in 1997. curl noise turns the slope 90°, which leaves the field with nowhere to collect, so particles swirl instead of pooling. that's how a lot of movie smoke is made.",
      "flow fields have become a whole art form, and tyler hobbs has a good essay on how he uses them in generative art. it makes me want to paint a field by hand, so the particles would draw whatever picture was hidden in it.",
    ],
  },
  {
    slug: "spring-systems",
    title: "spring systems",
    play: "drag the cloth, the rope or the soft body!",
    premise: "premise: everything is just points connected by sticks.",
    rules: [
      "each point remembers where it was last frame and keeps moving by the same amount.",
      "gravity pulls every point down.",
      "every stick pulls its two ends back toward its resting length.",
      "repeat step 3 a few times per frame. more passes means stiffer.",
    ],
    thoughts: [
      "there's no velocity stored anywhere. speed is just the gap between where a point is and where it was, which feels like cheating but turns out to be really stable (verlet integration). stiffness is just repetition: one pass is stretchy like elastic, and a lot of passes is stiff like rope. the color shows stretch, so with tearable on you can see where the cloth is about to rip.",
      "thomas jakobsen wrote up this method in 2001 for the ragdoll bodies in hitman: codename 47. i also wanted to know the least a soft body needs to hold its shape. here it's a ring plus weak springs to its center, and without those it folds flat.",
    ],
  },
  {
    slug: "fractals",
    title: "fractals",
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
    title: "wave interference",
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
