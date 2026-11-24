# Chief Toy Officer

## Requests

1. `/gamegen --remake https://synapticnoise.com/xmasclicker --plan-only --share-design --leeway lots`
2. Plan approved: `yes` (the ctrl-click +50 cheat is dropped, as proposed).
3. Plans page: `Yes.`
4. `/gamegen:gamegen --continue --out xmas-clicker --budget 30 --art-sheet --publish --no-confirm`
- Later request (exactly as typed): `When this lands, we should apply /gamegen:gamegen --feedback to both xmas-clicker and xmas-everywhere and /gamegen:gamegen --saves to xmas-everywhere`

## Settings

- Feedback: on (from `--feedback`), added to the design as a change.
- From: https://synapticnoise.com/xmasclicker (github.com/zeveck/synapticnoise, `xmasclicker/`), remake, leeway lots
- Platform: both. Target: web. 3D: no. Scope: medium (10 ranks and 10 toys, 20–30 minutes to the top).
- Budget: $30 (from `--budget 30` on the build run; was $20 for the plan). Mockups: $5. Art sheet: yes. Publish at the end: yes (synapticnoise.com). No-confirm: yes. Rounds: 2. Plan only: yes. Share design: page.
- Plans page: yes (GAMEGEN_PLANS=synapticnoise.com/plans, gallery zeveck/synapticnoise).
- Making-of: on (GAMEGEN_MAKING_OF). Domain: synapticnoise.com.
- Credit: Rich Conlan (from GAMEGEN_CREDIT)
- ElevenLabs tier: creator (no credit line needed)
- Available: imagegen2, anim8gen (OpenAI ok), nanogen (Gemini ok), audiogen (ElevenLabs ok), playwright-cli, node, Python + Pillow (installed this run).

- GitHub preview image: to upload (none set)
- Repo: zeveck/xmas-clicker (public). Address: https://chieftoyofficer.synapticnoise.com/

## Phases

- [x] Survey of the original, plan approved; folder `xmas-clicker/`, new repo
- [x] Brief: design/BRIEF.md, with what the original aimed at as the checklist
- [x] Design: Chief Toy Officer, medium; 10 ranks, 10 toys, 4 hammers, 3 helpers, 6 upgrades, shooting stars, Christmas Eve finale
- [x] Design review: 2 rounds (30 + 24 findings, none must-fix), converged; balance sim in tools/balance-draft.mjs
- [x] Shared design (mock pictures): 9 pictures made at final quality (Pip, workshop, bench, tree, 3 toys, Santa, Cheap Hammer), about $0.76; mock screen composited in code. Design page built in .gamegen/plans/chief-toy-officer/, published on the plans page.
- [x] Plans page: card added (Planned), with the plan files and the design page. Design shared: https://synapticnoise.com/plans/chief-toy-officer/, as a page on the plans page.
- [x] Change (plan): `--feedback on` added to the design (controls, pause and settings, tech plan, done list)
- [x] Art, animation and audio: all of it, about $7.0 this run ($7.8 with the shared design's pictures) of $30. Added a step stool for Pip so his strike reaches the bench.
- [x] Build: all milestones in one pass (plain JS modules; the stage is one canvas). 5.6 MB.
- [x] Play-test: every rank proven with real input from its save (design/solutions/), finale, report-a-bug, offline, saves, away, cards, all sizes
- [x] Art sheet built in .gamegen/art-sheet/ (goes on the plans page at publish)
- [x] Final review: bug hunter (3 must-fix: away time lost on the title, finale lost on reload, pause over cards; all fixed) and playtester (no must-fix; best-buy hints added, tab dots, labels)
- [x] Polish pass: 1 must-fix (800x600 window: stage covered the shop; now side-by-side) and 9 smaller, all fixed and rechecked at every size
- [x] Wrap up: README, previews, Pages workflow, art sheet
- [x] Publish: live at https://chieftoyofficer.synapticnoise.com/ (HTTPS on), repo zeveck/xmas-clicker (public, one fresh commit; the planning history stays local on local-history because an old note held a temp path), DNS added at GoDaddy, top of the synapticnoise.com gallery, plans card Published
- Art sheet: https://synapticnoise.com/plans/chief-toy-officer/art/
