## 1. Edge Scroll Module

- [x] 1.1 Create `packages/excalidraw/edgeScrolling.ts` with constants (`EDGE_THRESHOLD = 60`, `MAX_SPEED = 20`), an `EdgeScrollState` type (storing pointer coords, animation frame ID, active flag), and exported helper `getEdgeScrollDelta(pointerViewportX, pointerViewportY, viewportWidth, viewportHeight, zoom)` that returns `{ dx, dy }` based on linear proximity ramp
- [x] 1.2 Add `startEdgeScroll(state, onTick)` that begins a `requestAnimationFrame` loop calling `onTick` each frame with the current delta, and `stopEdgeScroll(state)` that cancels the animation frame and resets the active flag
- [x] 1.3 Add `updateEdgeScrollPointer(state, viewportX, viewportY)` so the move handler can push latest pointer coords into the shared mutable state used by the rAF loop

## 2. Integration into Drag Handler

- [x] 2.1 In `App.tsx`, add an `edgeScrollState` ref (instance property) initialized in the constructor or at class level
- [x] 2.2 In `onPointerMoveFromPointerDownHandler`, after the block that sets `selectedElementsAreBeingDragged = true`, call `updateEdgeScrollPointer` with the current viewport-relative pointer position and call `startEdgeScroll` if not already active
- [x] 2.3 Implement the `onTick` callback passed to `startEdgeScroll`: call `this.translateCanvas(dx, dy)`, then call `dragSelectedElements` with an adjusted offset so elements follow the pan
- [x] 2.4 Call `stopEdgeScroll` in the pointer-up / drag-end path (where `selectedElementsAreBeingDragged` is reset to false)

## 3. Edge-Zone Exit Handling

- [x] 3.1 In the `updateEdgeScrollPointer` flow, if the returned delta is `{ 0, 0 }` (pointer outside edge zone), call `stopEdgeScroll` to halt the animation loop

## 4. Testing

- [x] 4.1 Write unit tests for `getEdgeScrollDelta` covering: pointer in center (no delta), pointer at each edge (max delta), pointer in corner (diagonal delta), zoom scaling (2x halves delta, 0.5x doubles delta), and pointer exactly at threshold boundary (zero delta)
- [x] 4.2 Write unit tests for `startEdgeScroll` / `stopEdgeScroll` lifecycle: verify rAF is requested on start, cancelled on stop, and that `onTick` receives correct deltas
- [x] 4.3 Run `yarn test:typecheck` to verify no type errors introduced
