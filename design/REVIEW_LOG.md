# Review log

## Round 1

Reviewers: Player, Builder (with an economy sim), Art and sound director. 30 findings: 27 should-fix, 3 nice, no must-fix.

# Round 1 — outcomes

Sim used for re-tuning: a draft of tools/balance-draft.mjs, with its params in tools/balance-draft-params.json (adds a third helper, star catch rate, Smartphone-then-Eve, longest wait between purchases).

| Finding | Severity | Evidence | Outcome |
|---|---|---|---|
| Player 1: fast tapping closes the promotion card | should-fix | judgment (agrees with Builder 1) | Fixed: 1 s input guard on every card; closes only with its button or Esc; Space/Enter never close a card; taps don't pass through either way (Controls, Tech plan Input). |
| Player 2: no first-minute prompt; phone tabs hide what's new | should-fix | judgment | Fixed: bouncing hand + "Tap the bench!" until the first toy; "Hire your first elf!" glow at 15 cookies; dot badges on phone tabs, cleared on open. |
| Player 3: toy switching underspecified | should-fix | Verified: BRIEF asks for "a progress bar per toy"; old design saved one toy's progress | Fixed: each toy keeps its progress (thin bar on each shelf card, saved per toy); promotion selects the new toy, card says "Now building: …". |
| Player 4: overflow work and floods of toys | should-fix | judgment | Fixed: work carries over; all covered toys finish in one update; one pop "×N", one arc, max 3 presents in flight; pile capped at 40 drawn slots with a "×N" tag. |
| Player 5: can you tap the bench with the shop open on phones? | should-fix | judgment | Fixed: portrait panel has its own space below the stage and never covers it; one tab always open. |
| Player 6: phone top bar too full; long titles | should-fix | judgment | Fixed: two-row top bar on phones; title scaled to fit; longest title must fit at 360 px (in Definition of done). |
| Player 7: short gaps/background tabs drop to half speed | should-fix | Verified: old tech plan sent any gap >5 s through the offline rule | Fixed: full speed while visible (paused or not); hidden/closed under 10 min credited at full speed with a toast; 10 min+ at half speed with the card. |
| Player 8: Smartphone unlocks at the moment of the ending | should-fix | judgment | Fixed: Chief Toy Officer unlocks the Smartphone ("Build the last toy before the sleigh leaves!"); the first Smartphone starts Christmas Eve (~10 s later in the sim); banner keeps it reachable. Free play adds gold tally plates at 100 made; the "tree filled" milestone was not added (the pile already fills by the top). |
| Player 9: only two helper types | should-fix (close call) | judgment | Fixed: Reindeer Team (150 work/s, 10,000, rank 7) added, modelled in the sim, with an asset and crew drawing. |
| Player 10: original's hammer spin missing | nice | Verified: ORIGINAL.md "the hammer spins once" | Fixed: the code-drawn hammer spins once per finished toy, skipped for batches. Cheap now that the hammer is drawn in code. |
| Builder 1: fast tapping closes the promotion card | should-fix | judgment | Fixed: same as Player 1 (1 s guard, button or Esc only). |
| Builder 2: swing has the Cheap Hammer baked in; side-on vs three-quarter | should-fix | judgment | Fixed (lead decision): anim8gen swing of Pip with an empty fist in the anchor's view; hammer-1…4 drawn in code at a per-frame hand pivot; swing ~120 ms, restarts each tap. |
| Builder 3: balance relies on 5 taps/s and every star; thresholds not written | should-fix | Verified: ran builder's sim.mjs (3/s half stars with old thresholds: CTO 29:32, ranks +14…+52%) | Fixed: reference player 3 taps/s, half the stars; thresholds written into the rank table [0, 15, 75, 310, 1,300, 4,200, 13,000, 44,000, 170,000, 500,000]; reference CTO 25:57, every rank within ±10%; 2/s no stars 31:03. |
| Builder 4: no rule for one tap finishing many toys | should-fix | judgment | Fixed: carry-over, all covered toys in one update, one pop/arc/sound set, max 3 presents in flight, sound rate limits. |
| Builder 5: landscape phones fall between layouts | should-fix | Verified: old design's "desktop layout squeezed" switched at 900 px wide, so 844×390 got the portrait column | Fixed (lead decision): landscape-short layout `(orientation: landscape) and (max-height: 500px)`, stage left, shop right (≥240 px); manifest orientation `any`; 844×390 in Definition of done. |
| Builder 6: debug hook doesn't match the play-test | should-fix | Verified: playtest-guide.md lines 113, 129, 241, 323 call `window.__game.state()/frames()/audioState()`; web-target.md line 284 | Fixed: `window.__game` with read-only `state()`, `frames()`, `audioState()`, `levels()` always on; cheats (incl. `goToLevel` alias) behind `?debug`. |
| Builder 7: present pile has no drawing rule | should-fix | judgment | Fixed: ≤40 fixed slots, slot n fills at 2^(n/4) presents (about 35 at the top), "×N" tag past that, count-only save, empties after Christmas Eve. |
| Builder 8: rules the builder would guess | should-fix | Verified: ORIGINAL.md top-rank crash | Fixed: per-toy progress, switch to new toy on promotion, full cheer bar labelled "Chief Toy Officer" at the top, one card queue (Welcome back → Promotion → Christmas Eve), pause stops only stars and Rush timer, half speed only for long hidden time. |
| Builder 9: late purchases are long saves for small gains | nice | Verified: builder's sim; with old prices the reference player never bought the Thunder Mallet or Golden Elf Hammers and waited up to 226 s | Fixed: Thunder Mallet 120,000 → 40,000, Golden Elf Hammers 150,000 → 60,000, Wrapping Station 8,000 → 6,000; reference now buys everything before the top and never waits over 83 s; check is "≤90 s between purchases and everything bought" (a "≥5% gain" bar isn't reachable before Toy Machines, where one elf adds ~4%). |
| Builder 10: Star Rush music 15% faster raises pitch | nice | Verified: audiogen SKILL.md Loop Caveat (sfx has `--loop`, music doesn't) | Fixed: looping sleigh-bell sfx layered during the Rush; music unchanged. |
| Art 1: swing hammer fixed; different camera | should-fix | judgment | Fixed: one camera (three-quarter front) for the stage; empty-fist swing, hammer in code; strike frame lands on the toy's spot. |
| Art 2: finale shows two sleighs; cut list contradicts | should-fix | Verified: old asset list had a sleigh in finale-sleigh and in sleigh-cutout | Fixed: `finale-sky` (moon and rooftops, no sleigh) + `sleigh-cutout` (refs santa-portrait, finale-sky); cut 1 now "cut-out holds still while the sky pans". |
| Art 3: no stage layout map | should-fix | judgment | Fixed: stage map in % (window, crew strip, bench, toy spot, Pip, tree, pile, star band); workshop-bg prompted as an empty room, anchor as style ref only. |
| Art 4: late-game wall of sounds | should-fix | judgment | Fixed: per-effect limits (toy done ≤4/s, rustle and clink ≤1 per 300 ms, 30/s overall), a pitched-up "batch done" sound, totals in floating numbers. |
| Art 5: spend mock money on real assets | should-fix | judgment | Fixed (lead decision): pip-anchor, workshop-bg, toy-01, toy-05, toy-08 made at final spec and reused; mock-workshop composited in code; budget line and cost estimate updated. |
| Art 6: planned sizes can't be generated | should-fix | Verified: imagegen2 generate.cjs validateSize (multiples of 16, 655,360–8,294,400 px; 512², 768², 1024×512, 512×256 fail); audiogen SKILL.md sfx `--duration` 0.5–30 s | Fixed: asset list column is now "Generate at → ship at" (1024², 1536×1024, 1280×640, 768×1024; nanogen 4:3 at 2K); sfx 0.5 s minimum, trimmed in code. |
| Art 7: tree lights, star and tree in other pictures not planned | should-fix | judgment | Fixed: plain tree, 9 hand-placed strands + tip in `tree-lights.json`, `tree-star` asset (dim then lit), tree added to title-art refs; strands hung per promotion, switched on at Christmas Eve. |
| Art 8: elf-hammer upgrade icons look like hammers | should-fix | judgment | Fixed: helper elf holding a wooden / steel / golden hammer (ref elf-helper). |
| Art 9: "Ho ho ho" asked of the sfx model | should-fix (close call) | Verified: audiogen SKILL.md has a `voice` command (TTS) | Fixed: `sfx-promotion` (fanfare + elf cheer) and `voice-santa-hohoho` (audiogen voice, 2–3 takes) layered in code; voice is cut 3. |
| Art 10: one 90 s loop; chipmunk Star Rush | nice | Verified: audiogen SKILL.md Loop Caveat (no music loop flag) | Fixed in part: workshop track 120 s with a 2 s crossfade; Rush uses a sleigh-bell loop. Not changed: no second workshop variation (below the bar; keeps scope). |
| Art budget note: ~34 images, design undercounts | — | Verified by recount: 35 imagegen2, 4 nanogen, 1 animation, 3 min music, 17 sfx, 1 voice | Fixed: effort and cost estimate updated to about $14–16 of $20. |

## Round 2

Reviewers: Player, Builder (re-ran the sim), Art and sound director (looked at the art already made). 24 findings: 16 should-fix, 8 nice, no must-fix.

# Round 2 — outcomes

Sim: `tools/balance-draft.mjs` + `tools/balance-draft-params.json` (updated in place; `node tools/balance-draft.mjs` runs the four players and the checks, all PASS). Stage mock: `.gamegen/review/stage-mock.png`, made by `stage-mock.py` from `stage-map.json` with the real images.

| Finding | Severity | Evidence | Outcome |
|---|---|---|---|
| Player 1: helpers finish the last toy behind the promotion card | should-fix | Verified: old sim, rank-10 helper work ~4,270/s vs a 40,000-work Smartphone (CTO 25:57, Eve 26:06) | Fixed (lead decision): any card freezes the economy (helpers, stars, Rush timer); Smartphone 150,000 work / 75,000 cookies / 41,250 cheer; helpers fill the first one only to 90%, the bar glows and the banner says "Pip adds the finishing touches: tap!"; taps finish it (~5 s; Eve 21 s after CTO). Added to sim, rules.js plan and DoD. |
| Player 2: from rank 8 the tap hardly matters | should-fix | Verified: player's p2sim shares (rank 8 10%, rank 10 9%) | Fixed: every tap adds 15% of the crew's work/s on top of the hammer (Rush: hammer part ×5, crew part follows helpers ×2). Reference tap share now 90/55/54/45/40/39/35/39/36/41% by rank. New sim check: ≥30% at every rank, 30–42% from rank 5 (taps naturally lead ranks 1–4 while the crew is tiny; forcing 40% there would gut the tapping opening). Thresholds re-tuned to [0, 14, 90, 550, 2,200, 8,000, 28,000, 130,000, 470,000, 1,100,000]: ranks within ±3%, CTO 26:02, Eve 26:23. |
| Player 3: toy choice isn't real, yet Toys is the default tab | should-fix | judgment | Fixed (minimum): Toys is the default tab only until the first elf; then Helpers (and on every load); the selected toy is always on the bench with its name under the stage; a promotion puts a dot on Toys. Not added: "Letters to Santa". With the tab fixed, what's left is a little off (older toys are never needed, as in the original) and Letters would need new UI, save fields and balance work: below the bar. |
| Player 4: landscape 667×375 omits toy name and work bar; title squeezed | should-fix | judgment (arithmetic checks: 240 px column) | Fixed: 28 px toy strip under the stage; stage width formula; title may wrap to two lines at ≥14 px; gear/speaker move to the tab row; DoD covers 667×375 and 844×390. |
| Player (nice): date-aware touches for coming back | nice | judgment | Not changed: below the bar; free play and gold tally plates stay the reason to return. |
| Player (nice): say whether a star tap also hammers | nice | judgment | Fixed (lead decision): a star tap only catches the star (Controls, Input, DoD). |
| Builder 1: crew strip hidden behind Pip and the toy | should-fix | Verified: old map put the strip at x 8–64, y 40–62 behind Pip (x 4–30) and the toy | Fixed: new stage map fitted to the real images; crew area at the left under the lanterns (x 0–25, y 49–88), 5 fixed square slots (3 elves, Toy Machine, Reindeer Team bigger), nothing in front but a corner of Pip's hat bell; checked in the Pillow mock. |
| Builder 2: last toy done by itself in ~9 s | should-fix | Verified (same as Player 1) | Fixed: freeze while any card is open; 150,000-work Smartphone; 90% helper cap. Sim: Eve 26:23 reference, 33:31 at 2/s, 18:32 fast. |
| Builder 3: anchor holds a mallet; fist covered by the code hammer | should-fix | Not reproduced for the mallet: pip-anchor.png as made has an empty fist and no mallet (looked). Verified for held items: anim8gen SKILL.md item 15 rejects "missing held items" | Fixed: anchor described as made; swing brief "Pip alone, no bench, no hammer, no props, closed empty fist"; per-frame fist crop drawn after the hammer so fingers wrap the handle; one handle length (35% of Pip's height) from a per-hammer grip point so every head lands on the toy's top centre. |
| Builder 4: goToLevel and the full-run proof not buildable | should-fix | Verified: playtest-guide.md lines 185–200 (`goToLevel`, `levelComplete`, background `run-code`, `__runLog`); web-target.md line 285 | Fixed: `goToLevel(n)` loads tools/balance.mjs snapshots of the reference save per rank; `state()` gains `level`/`rank`, `levelComplete`, `gameWon`; `seedStars`; full real-input run as a background `run-code` (~12 min at 10/s, all stars: Eve 11:51 in the sim) logging to `window.__runLog`. |
| Builder 5: Space/Enter on a focused button buys again | should-fix | Verified: HTML buttons activate on Space/Enter when focused (standard behaviour); design only blocked them on cards | Fixed: capture-phase window keydown preventDefault for Space/Enter; cards blur after pointer clicks; DoD "click Buy, then Space ×5: no extra purchase". |
| Builder 6: away cap rules missing | should-fix | judgment | Fixed: `away()` in rules.js: cheer clamped at the rank-after-next threshold − 1, all cookies kept, toy selected when you left, a promotion doesn't switch toys, the first Smartphone is never finished away (90% cap); tested in tools/balance.mjs. |
| Builder 7: landscape column budget; work bar not placed | should-fix | judgment | Fixed: same as Player 4 (stage width = min((h − 28) × 4/3, w − 240 − insets), toy strip under the stage, 48 px tabs at full column width). |
| Builder (nice): panel at 360×640 shows ~2 cards | nice | judgment | Fixed: "panel shows at least two cards at 360×640" in Controls and DoD (cheap). |
| Builder (nice): star tap vs hammer; star band overlaps Pip's hat | nice | judgment | Fixed: star tap only catches; new star band (y 13–40) sits above Pip's hat (top y 45). |
| Art 1: toy out of Pip's reach; overlaps undecided | should-fix | Verified: pip-anchor alpha box x 284–747, y 0–1010 (Pillow) | Fixed: stage map redone in % with each image's real proportions (Pip body x 23–41, toy 14% wide on the bench top, bench x 36–76, tree x 72–99, pile, crew, star band), strike fist ~(40, 64) to toy top (52, 55), full draw order; mock composite of the real images checked and saved. |
| Art 2: pip-swing brief invites a second bench and a pose jump | should-fix | Verified: anim8gen SKILL.md items 19–21 (align, bottom-centre anchors) | Fixed: brief without bench/props; frame 0 is the idle pose; anchor never on stage; one canvas/scale/foot line; pivot JSON measured on final aligned frames in `assets/anim8gen/pip-swing/frames/`. |
| Art 3: the finale's big moment can't be shown | should-fix | judgment | Fixed: sleigh-cutout piled high with presents (refs santa-portrait, finale-sky, presents); finale script eve-lights → eve-lift (presents float up out of the stage) → eve-sky (crossfade, loaded sleigh crosses the moon) → eve-card, named in the frame log; cut 1 updated. |
| Art 4: 512 px PNG icons make a heavy first load | should-fix | Verified: toy-01 1024 PNG 1,750 KB → WebP q85 192 KB → 256 px WebP 16 KB (Pillow) | Fixed: everything ships WebP; toys 384 px, other icons 256 px, Pip frames 512 px; anchor not shipped; music at 96 kbps; DoD "under 6 MB in all, images under 2.5 MB" (not 4 MB: ~2.2 MB of music alone makes 4 MB too tight). |
| Art 5: design text doesn't match the art made | nice | Verified: looked at pip-anchor, toy-05, toy-08, bench, tree | Fixed: anchor, bench (front view, vice, carving tools, lower shelf), tree (fir in a banded tub) and the three toys described as made; "One camera" now says the bench is straight on. |
| Art (nice): make the 9:16 title art from the 4:3 one | nice | judgment | Fixed: asset row says the phone version uses the 4:3 one as reference (no cost). |
| Art (nice): music-eve shorter than finale + credits | nice | judgment | Fixed: it fades into the workshop loop if the final card is still up. |
| Art (nice): crackle layer for the Thunder Mallet hit | nice | judgment | Not changed: below the bar; the heavy-tap sound and screen shake cover it. |
| Art (nice): three gold stars may blur | nice | judgment | Fixed (cheap): cheer icon is a red bell with holly; shooting star white-gold; tree-top star gold. |

## Decision

Converged after round 2 (the --rounds limit): every should-fix was fixed or answered, and none was must-fix. Letters to Santa were considered and left out (below the bar).

## Change review: elf limit (issue #1, "Elves"), 2026-11-25

One round, player and builder. Balance: reference Christmas Eve 26:25 (26:23 before); elves-first player 28:47 (39:32 before); all checks pass, plus a new check that the reference player's saves stay within the limits.

| Finding | From | Severity | Outcome |
|---|---|---|---|
| "Bench" already means Pip's workbench; keep it off screen | player | should-fix | Fixed: "Workshop full: more elves at …" |
| Say the new limit on the promotion card | player | should-fix | Fixed: "Room for 25 elves" / "No limit on elves" in the unlocks |
| A full Elf card must not light a tab dot or look unaffordable | player | should-fix | Fixed: own "full" state, calm wooden "Full" plate, never a dot or ribbon |
| Saves over the new limit | player, builder | should-fix | Fixed: elves are kept; "30 hired · Workshop full"; the rank named is the first with room for that many |
| The shop card had no "full" state; render key | builder | should-fix | Fixed: state, price, label and key include "full" |
| No toast for full; design wording on "of N" | builder | nice | Fixed |
| What-if runs of the balance script overwrite the play-test saves | builder | nice | Fixed: they don't write saves |
| Numbers feel right; setRank can exceed the limit (debug only) | player, builder | nice | Kept |
