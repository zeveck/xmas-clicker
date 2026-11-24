# The original: Xmas Clicker (2017)

Source: https://synapticnoise.com/xmasclicker/, from `xmasclicker/` in
github.com/zeveck/synapticnoise (one commit, "Initial commit"). Title tag:
"Xmas Clicker DEV v20171108.1322". Plain HTML/CSS/JS, no build step. A copy
of its code and notes is in `design/original/` (the images are kept out of
this repo: they're clip art and photos from around the web).

## How it plays

- Click the big hammer to put work into the selected toy. A red candy-stripe
  bar shows the toy's progress; the toy icon beside the hammer fills up.
- A finished toy: the hammer spins once, the toy's counter goes up (shown
  zero-padded, `0002`), and you gain the toy's prestige.
- Prestige fills a green bar toward the next of 10 rank titles, shown in the
  "Mountains of Christmas" font with a 7-digit zero-padded total.
- Each new rank unlocks the next toy (locked toys are greyed with a padlock;
  clicking one shakes the lock).
- Toys can be switched by clicking them. Hovering shows a name tooltip.

## Content

Tools (hammers): Cheap Hammer (cost 0), Heavy Hammer (1000), Supreme Hammer
(5000), Thor's Hammer (10000).

Toys (work, prestige, value): Wooden Tractor (10, 5, 10), Yo-yo (20, 10, 10),
Puzzle Cube (30, 15, 20), Wooden Sword (50, 20, 30), Sketch An Etch (40, 25,
50), Fidget Spinner (60, 50, 5), Chess (70, 25, 100), Super Game System (80,
75, 300), Bike (90, 50, 500), Smartphone (100, 100, 1000).

Ranks (prestige to reach): Assistant Junior Toy Maker (0), Junior Toy Maker
(100), Assistant Toy Maker (500), Pretty Good Toy Maker (1000), Crafty Toy
Maker (5000), Master Toy Maker (10000), Senior Master Toy Maker (25000),
Principal Toy Maker (50000), Assistant Toy Officer (100000), Chief Toy Officer
(1000000).

Also: a grey Christmas tree silhouette on the right, an empty "present pile"
and an empty "score display" (a click counter that's never shown).

## Sean's prototype (`_sean/index.html`)

A separate, simpler idle game: "Build" button for toys, "Hire Elf" (cost 10,
toys per second), "Get Elf Hammers" (cost 20) and "Buy Click Upgrade" (cost
100, rising ×3.2). Elf clip art. This is the idle direction the main game
never reached.

## What works

Clicking, toy progress, counters, prestige, rank titles, unlocking toys by
rank, the lock shake, tooltips, the floating "+1".

## What's unfinished

- Hammers can't be unlocked: `unlockTool` is empty and nothing is ever
  earned to spend. Toy "value" is never used.
- The present pile and score display are empty; the tree does nothing.
- No saving, no sound, no ending, no helpers.
- Phone layout: the toolbox runs off the right edge; no touch sizing.

## Clear bugs

- Reaching the last rank reads `prestigeLevels[level + 1]` past the end and
  crashes (`prestigeLevelUp`, prestige.js).
- Super Game System starts with `progress: 40`.
- Wooden Sword (50 work) comes before Sketch An Etch (40 work), and the
  Fidget Spinner is worth 5 while earlier toys are worth more.
- Ctrl-click adds 50 per click (a debug cheat, left in).

## Possibly intended quirks, and what happens to them

- Zero-padded counters (`0002`, `0000010`): kept as a nod, on the toy cards'
  tally plates.
- The rank titles, including the joke climb from "Pretty Good Toy Maker" to
  "Assistant Toy Officer" and "Chief Toy Officer": kept word for word.
- Ctrl-click +50: dropped (the person agreed; it was a testing cheat). The
  play-test uses a debug hook instead.

## Kept as is

The idea (build toys in Santa's workshop with a hammer), the 10 toys (two
renamed, order fixed), the 10 rank titles, toy counters, work and prestige
bars, four hammer tiers, the tree, the present pile, the Christmas-card
lettering. No art is kept.
