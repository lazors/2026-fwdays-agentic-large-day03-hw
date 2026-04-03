import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getEdgeScrollDelta,
  createEdgeScrollState,
  startEdgeScroll,
  stopEdgeScroll,
  updateEdgeScrollPointer,
  EDGE_THRESHOLD,
  MAX_SPEED,
} from "./edgeScrolling";

describe("getEdgeScrollDelta", () => {
  const viewportWidth = 1000;
  const viewportHeight = 800;
  const zoom = 1;

  it("returns zero delta when pointer is in center of viewport", () => {
    const { dx, dy } = getEdgeScrollDelta(500, 400, viewportWidth, viewportHeight, zoom);
    expect(dx).toBe(0);
    expect(dy).toBe(0);
  });

  it("returns negative dx when pointer is at the left edge", () => {
    const { dx, dy } = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, zoom);
    expect(dx).toBeLessThan(0);
    expect(dy).toBe(0);
  });

  it("returns positive dx when pointer is at the right edge", () => {
    const { dx, dy } = getEdgeScrollDelta(viewportWidth, 400, viewportWidth, viewportHeight, zoom);
    expect(dx).toBeGreaterThan(0);
    expect(dy).toBe(0);
  });

  it("returns negative dy when pointer is at the top edge", () => {
    const { dx, dy } = getEdgeScrollDelta(500, 0, viewportWidth, viewportHeight, zoom);
    expect(dx).toBe(0);
    expect(dy).toBeLessThan(0);
  });

  it("returns positive dy when pointer is at the bottom edge", () => {
    const { dx, dy } = getEdgeScrollDelta(500, viewportHeight, viewportWidth, viewportHeight, zoom);
    expect(dx).toBe(0);
    expect(dy).toBeGreaterThan(0);
  });

  it("returns diagonal delta when pointer is in a corner", () => {
    const { dx, dy } = getEdgeScrollDelta(0, 0, viewportWidth, viewportHeight, zoom);
    expect(dx).toBeLessThan(0);
    expect(dy).toBeLessThan(0);
  });

  it("returns zero delta when pointer is exactly at threshold boundary", () => {
    const { dx, dy } = getEdgeScrollDelta(
      EDGE_THRESHOLD,
      EDGE_THRESHOLD,
      viewportWidth,
      viewportHeight,
      zoom,
    );
    expect(dx).toBe(0);
    expect(dy).toBe(0);
  });

  it("halves scene-coordinate delta at 2x zoom", () => {
    const at1x = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, 1);
    const at2x = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, 2);
    expect(at2x.dx).toBeCloseTo(at1x.dx / 2);
  });

  it("doubles scene-coordinate delta at 0.5x zoom", () => {
    const at1x = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, 1);
    const atHalf = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, 0.5);
    expect(atHalf.dx).toBeCloseTo(at1x.dx * 2);
  });

  it("handles zoom of 0 by treating it as zoom=1 (no division by zero)", () => {
    const at1x = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, 1);
    const atZero = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, 0);
    expect(atZero.dx).toBeCloseTo(at1x.dx);
    expect(atZero.dy).toBeCloseTo(at1x.dy);
  });

  it("handles negative zoom by treating it as zoom=1", () => {
    const at1x = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, 1);
    const atNeg = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, -1);
    expect(atNeg.dx).toBeCloseTo(at1x.dx);
    expect(atNeg.dy).toBeCloseTo(at1x.dy);
  });

  it("handles NaN zoom by treating it as zoom=1", () => {
    const at1x = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, 1);
    const atNaN = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, NaN);
    expect(atNaN.dx).toBeCloseTo(at1x.dx);
    expect(atNaN.dy).toBeCloseTo(at1x.dy);
  });

  it("clamps deltas to MAX_SPEED when pointer is outside viewport (negative coords)", () => {
    const { dx, dy } = getEdgeScrollDelta(-100, -50, viewportWidth, viewportHeight, zoom);
    expect(dx).toBe(-MAX_SPEED);
    expect(dy).toBe(-MAX_SPEED);
  });

  it("gives approximately 50% speed at halfway into the edge zone", () => {
    const atEdge = getEdgeScrollDelta(0, 400, viewportWidth, viewportHeight, zoom);
    const halfway = getEdgeScrollDelta(EDGE_THRESHOLD / 2, 400, viewportWidth, viewportHeight, zoom);
    expect(halfway.dx).toBeCloseTo(atEdge.dx / 2);
  });
});

describe("startEdgeScroll / stopEdgeScroll lifecycle", () => {
  let rafId: number;
  let rafCallback: FrameRequestCallback | null;
  const getViewport = () => ({ width: 1000, height: 800, zoom: 1 });

  beforeEach(() => {
    rafId = 0;
    rafCallback = null;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return ++rafId;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests an animation frame on start", () => {
    const state = createEdgeScrollState();
    const onScrollChange = vi.fn();
    startEdgeScroll(state, onScrollChange, getViewport);
    expect(state.active).toBe(true);
    expect(state.animationFrameId).toBe(1);
  });

  it("does not start a second loop if already active", () => {
    const state = createEdgeScrollState();
    const onScrollChange = vi.fn();
    startEdgeScroll(state, onScrollChange, getViewport);
    const firstId = state.animationFrameId;
    startEdgeScroll(state, onScrollChange, getViewport);
    expect(state.animationFrameId).toBe(firstId);
  });

  it("cancels the animation frame and resets deltas on stop", () => {
    const state = createEdgeScrollState();
    const onScrollChange = vi.fn();
    updateEdgeScrollPointer(state, 0, 400);
    startEdgeScroll(state, onScrollChange, getViewport);
    // Simulate a tick to accumulate deltas
    rafCallback!(0);
    expect(state.scrollDeltaX).not.toBe(0);

    stopEdgeScroll(state);
    expect(state.active).toBe(false);
    expect(state.animationFrameId).toBe(null);
    expect(state.scrollDeltaX).toBe(0);
    expect(state.scrollDeltaY).toBe(0);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("calls onScrollChange and accumulates deltas when pointer is in edge zone", () => {
    const state = createEdgeScrollState();
    updateEdgeScrollPointer(state, 0, 400);
    const onScrollChange = vi.fn();
    startEdgeScroll(state, onScrollChange, getViewport);

    expect(rafCallback).not.toBeNull();
    rafCallback!(0);

    expect(onScrollChange).toHaveBeenCalledTimes(1);
    const [dx, dy] = [onScrollChange.mock.calls[0][0], onScrollChange.mock.calls[0][1]];
    expect(dx).toBeLessThan(0);
    expect(dy).toBe(0);
    expect(state.scrollDeltaX).toBe(dx);
    expect(state.scrollDeltaY).toBe(0);
  });

  it("does not call onScrollChange when pointer is in center (no delta)", () => {
    const state = createEdgeScrollState();
    updateEdgeScrollPointer(state, 500, 400);
    const onScrollChange = vi.fn();
    startEdgeScroll(state, onScrollChange, getViewport);

    rafCallback!(0);

    expect(onScrollChange).not.toHaveBeenCalled();
    expect(state.scrollDeltaX).toBe(0);
    expect(state.scrollDeltaY).toBe(0);
  });
});
