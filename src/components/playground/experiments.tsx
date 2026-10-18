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
          <strong>how does a repeating block become a building block for computation?</strong> conway&apos;s game of life
          can be broken down into oscillators (giving repetition), gliders (carrying )
        </p>

        <p>
          <strong>Update everything at once.</strong> My first instinct was to change cells in place, which
          quietly breaks the rules: later cells see neighbors that already moved on. The fix is to read from this
          generation and write into a fresh one.
        </p>
        <p>
          <strong>Edges are a choice.</strong> The grid here wraps around, so a glider leaving the right side
          comes back on the left. Hard walls would make it crash into a block instead, and the same pattern
          behaves differently.
        </p>
        <p>
          <strong>Small seeds, long stories.</strong> The R-pentomino is five cells and takes over a thousand
          generations to settle. The Gosper gun never settles at all: it fires a new glider every 30 generations,
          which is how Bill Gosper showed a finite pattern can grow forever.
        </p>

        <h3>Next questions</h3>
        <ul className="pg-list">
          <li>What changes if a cell is born with six neighbors too (the HighLife rule)?</li>
          <li>Can I make the update faster by only checking cells near something alive?</li>
        </ul>
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
      </>
    ),
  })),
];
