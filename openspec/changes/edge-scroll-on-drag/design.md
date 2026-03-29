## Context

Excalidraw's drag-move flow lives in `onPointerMoveFromPointerDownHandler` (App.tsx ~line 9459). When the user drags selected elements, the handler converts pointer coordinates to scene coordinates, computes a drag offset, and calls `dragSelectedElements()` from `packages/element/src/dragElements.ts` to update positions. Panning is handled by `translateCanvas()`, which sets `scrollX`/`scrollY` on AppState. Today, dragging near the viewport edge does nothing special — users must drop, pan, then re-select.

The viewport dimensions are available as `appState.width` / `appState.height`, and offsets as `appState.offsetLeft` / `appState.offsetTop`. Zoom is `appState.zoom.value`.

## Goals / Non-Goals

**Goals:**
- Auto-pan the canvas when the pointer enters a configurable edge zone during an element drag
- Graduated pan speed: faster the closer the pointer is to the edge
- Maintain cursor-to-element offset so elements track correctly while panning
- Clean start/stop lifecycle with no leaked animation frames

**Non-Goals:**
- Edge scrolling during other operations (drawing, resizing, text editing) — can be added later
- User-configurable edge threshold or speed via UI/settings
- Edge scrolling on touch/mobile devices (different UX considerations)

## Decisions

### 1. Animation loop via `requestAnimationFrame`

The pointer may sit motionless in the edge zone, yet the canvas must keep scrolling. A `requestAnimationFrame` loop running while the pointer is in the zone handles this. The loop calls `translateCanvas` each frame with a delta derived from pointer proximity to the edge.

**Alternative considered**: Updating scroll only on `pointermove` events. Rejected because the user can hold the pointer still at the edge and expect continuous scrolling.

### 2. Edge zone threshold: 60 px (constant)

A 60 px strip along each viewport edge activates scrolling. This is large enough to be easy to hit but small enough not to interfere with normal drag operations.

**Alternative considered**: Percentage-based threshold (e.g. 5% of viewport). Rejected — on very large monitors the zone would be too wide; on small screens too narrow. A fixed pixel value is predictable.

### 3. Speed calculation: linear ramp, zoom-adjusted

Pan speed scales linearly from 0 at the inner edge of the threshold zone to a max of ~20 px/frame at the viewport edge. The delta is divided by `zoom.value` so that the scene-coordinate shift stays consistent regardless of zoom level.

`speed = MAX_SPEED * (1 - distanceFromEdge / THRESHOLD) / zoom.value`

**Alternative considered**: Exponential ramp. Rejected for first iteration — linear is simpler to tune and easier to reason about.

### 4. Dedicated module `edgeScrolling.ts`

Edge-detection logic, speed calculation, and the animation loop live in a new file `packages/excalidraw/edgeScrolling.ts`. This keeps App.tsx minimal — it only needs to call `startEdgeScroll` / `stopEdgeScroll` / `updateEdgeScroll` from the drag handler.

**Alternative considered**: Inline in App.tsx. Rejected — App.tsx is already very large (~11k lines) and a self-contained module is easier to test and maintain.

### 5. Hook into existing drag path, update element positions after pan

Inside the rAF loop, after calling `translateCanvas`, the dragged elements' positions must also be updated to account for the scroll change. This is done by calling `dragSelectedElements` with an adjusted offset that includes the accumulated scroll delta — keeping elements glued to the cursor.

## Risks / Trade-offs

- **Performance on low-end devices** → The rAF loop is lightweight (one scroll update + re-render per frame). Excalidraw already re-renders on every pointer move during drag, so the marginal cost is low. Mitigated by using `requestAnimationFrame` which naturally throttles to display refresh rate.
- **Interaction with snapping and grid** → `dragSelectedElements` already applies snapping. Edge scroll feeds the same offset pipeline, so snapping continues to work. No special handling needed.
- **Stale pointer state** → The rAF callback must use the latest pointer position, not a captured closure value. Mitigated by storing the latest pointer coords in a mutable ref that the move handler updates.
