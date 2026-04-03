# Edge Scroll on Drag

## Why

When dragging selected elements to a location that is off-screen, users must drop the selection, manually pan the canvas, then re-select and drag again — often multiple times. This breaks flow and makes large-canvas work tedious. Edge scrolling (auto-panning when the cursor reaches the viewport edge during a drag) is a standard UX pattern in design tools that eliminates this friction.

## What Changes

- Add auto-pan behavior that activates when the pointer moves within a threshold zone near any viewport edge while dragging selected elements
- Pan speed increases the closer the pointer is to the edge (graduated speed)
- Auto-pan continues via an animation loop as long as the pointer stays in the edge zone
- Dragged elements follow the pan so their position relative to the cursor is maintained
- Auto-pan stops immediately when the pointer leaves the edge zone or the drag ends

## Capabilities

### New Capabilities
- `edge-scroll`: Auto-pan the canvas when the pointer enters an edge zone during element drag operations

### Modified Capabilities

## Risks

- **Performance regressions from animation loop**: The `requestAnimationFrame` loop runs continuously while the pointer is in the edge zone. *Mitigation*: The loop only runs when the pointer is actively in the edge zone during a drag and stops immediately when the pointer leaves or the drag ends; `getEdgeScrollDelta` is a lightweight arithmetic function with no allocations.
- **Unintended canvas translation at edges**: False-positive edge detection could cause unexpected panning during normal interactions. *Mitigation*: Edge scrolling only activates during element drag operations (not drawing, manual panning, or other pointer operations); bounds checks in `getEdgeScrollDelta` clamp deltas to `[-MAX_SPEED, MAX_SPEED]` before applying.
- **Resource leaks from transient animation frame ref**: If the `requestAnimationFrame` loop is not cancelled on component unmount or drag end, the RAF callback could continue calling `translateCanvas` on a destroyed component. *Mitigation*: `stopEdgeScroll` is called both on pointer-up/drag-end and in `componentWillUnmount`; `cancelAnimationFrame` is invoked and the animation frame ID is nulled out.
- **Interaction regressions with existing gestures**: Edge scrolling could interfere with alt-duplicate, shift-lock-direction, or lasso selection near edges. *Mitigation*: Edge scroll is integrated after existing drag logic and only feeds `scrollDeltaX`/`scrollDeltaY` into the existing `dragOffset` calculation; unit and integration tests cover the `getEdgeScrollDelta`, `startEdgeScroll`/`stopEdgeScroll` lifecycle, and zoom-scaling behavior.

## Impact

- **Code**: `packages/excalidraw/components/App.tsx` — the `onPointerMoveFromPointerDownHandler` drag path gains edge-detection and triggers `translateCanvas` in an animation loop
- **New module**: Edge scroll logic (detection, speed calculation, animation loop) in a dedicated file under `packages/excalidraw/`
- **State**: No new persisted state; uses a transient animation frame ref that lives on the App instance
- **APIs/Dependencies**: No new external dependencies; uses `requestAnimationFrame` and existing `translateCanvas`
