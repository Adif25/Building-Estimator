# Backyard Builder — Roadmap

Purpose: turn the working prototype (2D canvas + live material estimate) into a
tool real contractors use day-to-day, with a plan-driven, photorealistic AI
render of the design. This doc is the build plan for the **next prototype** and
beyond.

> Status legend: `[ ]` todo · `[~]` in progress · `[x]` done
> Priority: **P0** correctness/trust · **P1** usability · **P2** differentiation · **P3** scale

---

## Where the prototype is today

- React + Vite + Tailwind app at `backyard-builder/`, themed to match Build Estimator.
- 2D top-down canvas (40×30ft fixed): place/drag/resize deck, patio, pavers, grass, fence, plant bed.
- Live itemized estimate from a **local seed catalog** (`src/data/catalog.ts`); ported deck/fence BOM math.
- **Materials only.** No labor, no region, no persistence.
- AI render lives in the *old* Express app: blob mask → text prompt → `flux-fill-dev`. Not plan-driven, not scale-aware.

---

## Part 1 — Estimation correctness (P0)

These are wrong today and erode trust. Fix before anything else.

- [ ] **Fence picket spacing is inverted.** `privacy ? 5.5 : 4.5` undercounts privacy fences (privacy = butted/tight = MORE pickets). Swap so spaced/picket uses the wider gap.
- [ ] **Material ID collisions.** Deck reuses `2x8_8ft` for joists *and* ledger; shed reuses `osb_4x8` ×4 and `2x4_8ft` ×2. Give every distinct material a unique catalog ID so pricing/aggregation don't collide.
- [ ] **Missing major line items:**
  - Deck: **railings, stairs/stringers, framing fasteners**, beam/joist hangers per actual count. (Railing alone ≈ 15-25% of deck material cost.)
  - Fence: **gates + gate hardware.**
  - Shed: **doors, windows, house wrap, soffit/fascia, framing nails.**
- [ ] **Standard stock lengths.** Don't `ceil` arbitrary linear feet — lumber sells in 8/10/12/16ft. Add a cut-list optimizer that buys real lengths and reports offcut waste.
- [ ] **Span/load awareness.** Joist/beam/rafter sizing should use span tables, not `width <= 8`. Footing depth by frost line (region). This also gates code compliance (Part 2).
- [ ] **Input validation.** Reject/clamp zero/negative/absurd dimensions in estimators (not just canvas position). Guard divisions.
- [ ] **Per-material configurable waste %** (default sensible per type; contractor can override).
- [ ] Add **unit tests** for each calculator with known-good takeoffs.

---

## Part 2 — Contractor-grade estimation (P1)

The jump from "demo" to "usable." A contractor quotes **installed jobs**, not material lists.

- [ ] **Labor.** Per-task labor model: per sqft (deck/patio install), per linear ft (fence), per post/footing, plus crew hours. Regional wage rates. Labor is 40-60% of most jobs — this is the #1 gap.
- [ ] **Contractor-editable price lists.** Real contractors have negotiated supplier pricing. Let each user **import/maintain their own catalog** (CSV import, editable unit costs) with the seed catalog as default. This beats scraping retail prices.
  - [ ] Optional paid refresh layer (SerpApi / Apify / pricing vendor) — a *refresh*, not the source of truth. Keep the seam clean.
- [ ] **Money mechanics:** markup / overhead / profit margin, sales tax by region, delivery, dumpster/disposal, equipment rental, permit fees — all as toggleable line items.
- [ ] **Site & code constraints (region-aware):** ZIP/region input → frost-line footing depth, railing-required threshold (>30" height), setbacks/easements reducing buildable area, slope/grading notes.
- [ ] **Outputs contractors live on:**
  - [ ] Branded **PDF proposal** (summary + itemized, contractor logo).
  - [ ] Editable line items in the estimate (override qty/price/notes).
  - [ ] Save/load **multiple projects per customer**; customer info fields.
  - [ ] Export (PDF/CSV); stretch: e-signature.
- [ ] **Accounts / multi-user** (so price lists and jobs persist per contractor).

---

## Part 3 — Canvas & design fidelity (P1 → P2)

- [ ] **Real lot sizing.** Enter actual yard/lot dimensions; buildable area after setbacks.
- [ ] **Overlap subtraction.** Don't double-count grass under a deck/patio. Compute net areas.
- [ ] **Fence as polyline.** Multi-segment runs around a perimeter, corners, angles — not a single rectangle. Per-segment gates.
- [ ] **Rotation** for all elements.
- [ ] **Persistence:** save/load, undo/redo, multi-select, keyboard delete, autosave to localStorage then backend.
- [ ] **Snapping** to lot edges / house / other elements.
- [ ] **Touch/mobile** pointer support; tablet is the contractor's field device.
- [ ] Per-plant placement for plant beds (count + positions).

---

## Part 4 — Precise masking + plan-driven AI render (P2 → P3)

**The differentiator.** Today's render is a blob mask + text prompt — it ignores
where the ground is, the photo's scale, and the design the user drew. Rebuild as
a staged pipeline so the estimate and the picture are the *same design*.

### Stage A — Precise region (segmentation, not a blob)
- [ ] Replace the "% ground coverage" blob with **SAM 2 (Segment Anything 2)**: user clicks the lawn/ground, get a pixel-accurate mask following real boundaries (grass↔patio↔house↔fence).
- [ ] Optional auto: semantic ground/lawn segmentation as a first guess, user refines.

### Stage B — Scale & perspective
- [ ] **Depth Anything V2** to recover the ground plane + vanishing point.
- [ ] Calibrate feet-per-pixel from a known reference (door ≈ 6.8ft, fence height, person) so stated dimensions are physically meaningful in *that* photo.

### Stage C — Geometry-conditioned generation (ties estimate ↔ render)
- [ ] **Project the 2D Backyard Builder plan into the photo's perspective** as a wireframe/box.
- [ ] Feed that as a **ControlNet** conditioning image (depth or canny/lineart) so the model renders the *drawn* size/shape/placement, not a hallucination.
- [ ] **Harmonize:** feather mask edges, match lighting/white balance, lock seed for reproducibility. Keep house/sky untouched (no inpaint bleed).
- [ ] Tune fill params (`steps`/`guidance`) against the model's recommended fill settings.

---

## Part 5 — Data model evolution

Today: `Element { type, x, y, lengthFt, widthFt, options }` + flat `LineItem`.

Evolve toward:
- [ ] `Project { id, customer, lot {wFt,hFt,setbacks}, region/ZIP, elements[], settings }`
- [ ] `Element` gains `rotation`, polyline geometry (fence), z-order, and references to material/labor assemblies.
- [ ] `LineItem` splits into **material + labor + equipment**, each with waste %, markup, tax flags.
- [ ] `PriceList` (per contractor) overriding the seed catalog.
- [ ] `Estimate { lineItems[], subtotals, waste, markup, tax, grandTotal }` with full breakdown.
- [ ] Persistence layer (localStorage → lightweight backend; TanStack Query when a backend exists).

---

## Part 6 — AI model stack & cost

| Job | Budget / controllable | Quality |
|---|---|---|
| Masking | **SAM 2** (cheap, standard) | — |
| Depth/perspective | **Depth Anything V2** | — |
| Generation | **SDXL inpaint + ControlNet** (depth/canny) — cheap, controllable, self-hostable | **Flux.1 [dev] Fill** or **Flux + Canny/Depth ControlNet** — more photoreal, pricier |

- Offer **two tiers** (fast/cheap SDXL vs. premium Flux) so cost scales with the user's choice.
- At volume, **self-host on a rented GPU (L4/A10-class)** — amortizes far below per-call API pricing.
- ⚠️ **Verify current per-call pricing** on Replicate/Fal before committing — it shifts often. Stable fact: SDXL < Flux on cost; Flux > SDXL on realism.

---

## Phased prototype plan

**Prototype 2 — "Trustworthy estimate"** (P0 + start P1)
- Fix all Part 1 correctness bugs + tests.
- Add labor + markup/tax + contractor-editable price list (CSV import).
- Save/load projects (localStorage).
- Branded PDF export.
- *Goal: a contractor could quote a real fence/deck job and trust the number.*

**Prototype 3 — "Real designs"** (Part 3 + masking Stage A)
- Real lot sizing, overlap subtraction, fence polylines, rotation.
- SAM 2 segmentation replaces the blob mask (biggest visible quality jump, least effort).
- Accounts + backend persistence.

**Prototype 4 — "Plan-driven render"** (masking Stages B+C)
- Depth + perspective calibration; dimensions become physically meaningful.
- ControlNet render driven by the 2D plan — estimate and picture are the same design.
- Two-tier model selection (SDXL / Flux).

---

## Success criteria

- [ ] A contractor can produce a client-ready quote (material + labor + margin + tax) in < 5 min.
- [ ] Estimate within ~10% of a real takeoff for deck/fence/patio.
- [ ] AI render visibly reflects the *drawn* dimensions and placement (not a generic stock image).
- [ ] Prices reflect the contractor's own supplier costs, not retail guesses.

## Open decisions

- Single combined app vs. keep old Express app for AI + new React app for design (currently split).
- Share calculator code between old/new (one source of truth) vs. let the React port diverge.
- Hosting/backend choice when persistence + accounts land (Cloudflare Pages + a lightweight API? Convex?).
- Build vs. buy for pricing data (own catalog + contractor lists vs. paid SERP/pricing API).
