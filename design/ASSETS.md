# Assets

Prices: imagegen2 (gpt-image-2.6-flare) at $30 per million image output tokens
(looked up 2026-11-23); a high-quality 1024×1024 image is 1,758 tokens, about
$0.053. Reference images add input tokens at $8 per million (small).

| ID | File | Tool | Prompt (short) | Tries | Est. cost | Use |
|---|---|---|---|---|---|---|
| pip-anchor | .gamegen/candidates/pip-anchor.png | imagegen2 high 1024² transparent | Pip, elf toymaker, three-quarter, empty fist | 1 | $0.06 | style anchor; mockup |
| toy-01 | .gamegen/candidates/toy-01.png | imagegen2 high, ref anchor | wooden tractor | 1 | $0.06 | mockup → game |
| toy-08 | .gamegen/candidates/toy-08.png | imagegen2 high, refs anchor + toy-01 | Pixel Play handheld | 1 | $0.06 | mockup → game |
| toy-05 | .gamegen/candidates/toy-05.png | imagegen2 high, refs anchor + toy-01 | Doodle Dial | 1 | $0.06 | mockup → game |
| workshop-bg | .gamegen/candidates/workshop-bg.jpg | nanogen pro 2K 4:3, anchor as style ref | empty workshop room to the stage map | 1 | $0.24 | mockup → game |
| bench | .gamegen/candidates/bench.png | imagegen2 high 1536×1024 transparent | workbench, clear top | 1 | $0.08 | mockup → game |
| tree | .gamegen/candidates/tree.png | imagegen2 high 1024×1536 transparent | plain fir in a tub, bare tip | 1 | $0.08 | mockup → game |
| santa-portrait | .gamegen/candidates/santa-portrait.png | imagegen2 high 1024² transparent, ref anchor | Santa bust, three-quarter left, spectacles | 1 | $0.06 | mockup → game |
| hammer-1 | .gamegen/candidates/hammer-1.png | imagegen2 high 1024² transparent, refs anchor + toy-01 | Cheap Hammer, diagonal | 1 | $0.06 | mockup → game |

Running total: about $0.76 of $20 (mockups: $0.76 of $5).

## Build run (2026-11-24), budget $30

| ID | File | Tool | Tries | Est. cost |
|---|---|---|---|---|
| toy-02…04, 06, 07, 09, 10 | game/assets/items/toy-NN.webp | imagegen2 high, refs anchor + toy-01 | 7 | $0.53 |
| hammer-1 (rotated), hammer-2…4 | game/assets/items/hammer-N(-hand).webp + hammers.json | Pillow; imagegen2 high | 3 | $0.24 |
| present-1…6 | game/assets/items/present-N.webp | imagegen2 high | 6 | $0.45 |
| tree-star | game/assets/items/tree-star.webp | imagegen2 high | 1 | $0.08 |
| shooting-star | game/assets/items/shooting-star.webp | imagegen2 high 1536×1024 | 2 | $0.15 |
| cookie, cheer, lock | game/assets/ui/*.webp | imagegen2 high | 3 | $0.23 |
| elf-helper, toy-machine, reindeer-team | game/assets/sprites/*.webp | imagegen2 high | 3 | $0.18 |
| upgrades (6) | game/assets/ui/upg-*.webp | imagegen2 high | 6 | $0.39 |
| app-icon | design/art/app-icon-1024.png → icons | imagegen2 high | 2 | $0.13 |
| title-art, title-art-phone | game/assets/bg/title-art(-phone).webp | nanogen pro 2K | 5 | $0.67 |
| finale-sky | game/assets/bg/finale-sky.webp | nanogen pro 2K | 1 | $0.13 |
| sleigh | game/assets/bg/sleigh.webp | imagegen2 high 1536×1024 | 1 | $0.11 |
| pip-swing | game/assets/sprites/pip-swing/frame-0…3.webp + pivots.json | anim8gen (imagegen2) | 5 | $0.33 |
| stool | game/assets/bg/stool.webp | imagegen2 high 1536×1024 (added: lifts Pip so the strike reaches the bench top) | 2 | $0.16 |
| music-workshop, music-eve | game/assets/audio/music/*.mp3 (re-encoded 96 kbps) | audiogen music | 2 | $0.90 |
| sfx (17) + Santa voice | game/assets/audio/sfx/*.mp3 | audiogen sfx / voice | 21 | $2.30 |

Build run total: about $7.0. With the shared design's pictures ($0.76): **about $7.8 of $30.**

Change 6 (2026-11-24): hammer-2 (both files) mirrored in Pillow so its flat face leads; no new spending. The six present pictures are no longer drawn in the game (the pile shows the toys themselves) but stay on the art sheet.
