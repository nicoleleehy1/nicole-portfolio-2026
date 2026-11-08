import type { ComponentType, ReactNode } from "react";
import { GameOfLife } from "./game-of-life";
import { labNotes } from "./lab-notes";
import { LABS } from "./lab-stages";

// Playground experiments, newest last. Each pairs something to play with (left) with notes on what I'm learning (right).
// To add one: build its component next to game-of-life.tsx and append an entry here.
export type Experiment = {
  slug: string;
  title: string;
  // Short mono tag shown in the switcher, e.g. "EXP-01".
  tag: string;
  Stage: ComponentType;
  // One-line hint for how to interact with the stage.
  howTo: string;
  notes: ReactNode;
};

export const experiments: Experiment[] = [
  {
    slug: "game-of-life",
    title: "conway's game of life",
    tag: "EXP-01",
    Stage: GameOfLife,
    howTo: "click/drag on the grid to draw cells!",
    notes: (
      <>
        <p>
          premise: every cell is either alive or dead. at each generation, it looks at its eight neighbors and decides whether to live or die. that&apos;s the whole world.
          rules:
        </p>
        <ol className="pg-rules">
          <li>a live cell with fewer than two live neighbors dies, as if by loneliness.</li>
          <li>a live cell with two or three live neighbors survives.</li>
          <li>a live cell with more than three live neighbors dies, as if by overcrowding.</li>
          <li>a dead cell with exactly three live neighbors comes alive.</li>
        </ol>

        <h3>-</h3>
        <p>
          <strong>initial thoughts.</strong>
        </p>
        <p>
          the thing i keep coming back to is how a few repeating pieces turn into a computer. the game breaks down
          into oscillators that repeat in place (like the blinker), gliders that carry information across the grid,
          and guns that keep producing gliders. the gosper gun fires a new one every 30 generations, which is how bill
          gosper showed a finite pattern can grow forever, and by crashing glider streams into each other people built
          logic gates and eventually showed the whole game is turing complete. small seeds tell long stories too: the
          r-pentomino is only five cells and takes over a thousand generations to settle.
        </p>
        <p>
          building it taught me that every cell has to update at once. my first instinct was to change cells in place,
          which quietly breaks the rules because later cells see neighbors that already moved on, so the fix is to read
          from this generation and write into a fresh one. edges turned out to be a choice as well. the grid here wraps
          around, so a glider leaving the right side comes back on the left, while hard walls would make it crash into a
          block. next i want to see what happens if a cell is also born with six neighbors (the highlife rule, which has
          a pattern that copies itself), and whether only checking cells near something alive makes it faster.
        </p>
      </>
    ),
  },
  // the lab experiments: copy in lab-notes.ts, canvases in labs/
  ...labNotes.map((n, i) => ({
    slug: n.slug,
    title: n.title,
    tag: `EXP-${String(i + 2).padStart(2, "0")}`,
    Stage: LABS[n.slug],
    howTo: n.play,
    notes: (
      <>
        <p>
          <strong>{n.idea}</strong>
        </p>
        {n.notes.map(p => (
          <p key={p}>{p}</p>
        ))}
        <h3>Things to try</h3>
        <ul className="pg-list">
          {n.tryThis.map(t => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {n.cite && (
          <p className="pg-cite">
            Based on{" "}
            <a href={n.cite.href} target="_blank" rel="noreferrer" className="link">
              {n.cite.text}
            </a>
            . Models and shader code from the article, used under CC BY 4.0 and Apache 2.0.
          </p>
        )}
      </>
    ),
  })),
];
