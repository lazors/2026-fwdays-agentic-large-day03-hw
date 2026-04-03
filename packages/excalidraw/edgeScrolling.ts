export const EDGE_THRESHOLD = 60;
// Maximum pan speed in pixels per animation frame at the viewport edge.
// Paired with EDGE_THRESHOLD to form the linear ramp: speed scales from
// 0 at EDGE_THRESHOLD px from the edge to MAX_SPEED at the edge itself.
export const MAX_SPEED = 20;

export type EdgeScrollState = {
  pointerX: number;
  pointerY: number;
  lastScenePointerX: number;
  lastScenePointerY: number;
  animationFrameId: number | null;
  active: boolean;
  scrollDeltaX: number;
  scrollDeltaY: number;
};

export const createEdgeScrollState = (): EdgeScrollState => ({
  pointerX: 0,
  pointerY: 0,
  lastScenePointerX: 0,
  lastScenePointerY: 0,
  animationFrameId: null,
  active: false,
  scrollDeltaX: 0,
  scrollDeltaY: 0,
});

export const getEdgeScrollDelta = (
  pointerViewportX: number,
  pointerViewportY: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
): { dx: number; dy: number } => {
  let dx = 0;
  let dy = 0;

  // Left edge
  if (pointerViewportX < EDGE_THRESHOLD) {
    dx = -MAX_SPEED * (1 - pointerViewportX / EDGE_THRESHOLD);
  }
  // Right edge
  else if (pointerViewportX > viewportWidth - EDGE_THRESHOLD) {
    dx =
      MAX_SPEED *
      (1 - (viewportWidth - pointerViewportX) / EDGE_THRESHOLD);
  }

  // Top edge
  if (pointerViewportY < EDGE_THRESHOLD) {
    dy = -MAX_SPEED * (1 - pointerViewportY / EDGE_THRESHOLD);
  }
  // Bottom edge
  else if (pointerViewportY > viewportHeight - EDGE_THRESHOLD) {
    dy =
      MAX_SPEED *
      (1 - (viewportHeight - pointerViewportY) / EDGE_THRESHOLD);
  }

  // Clamp for pointers beyond the viewport edge
  dx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, dx));
  dy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, dy));

  // Adjust for zoom so scene-coordinate shift is consistent
  if (Number.isFinite(zoom) && zoom > 0) {
    dx /= zoom;
    dy /= zoom;
  }

  return { dx, dy };
};

export const updateEdgeScrollPointer = (
  state: EdgeScrollState,
  viewportX: number,
  viewportY: number,
): void => {
  state.pointerX = viewportX;
  state.pointerY = viewportY;
};

export const startEdgeScroll = (
  state: EdgeScrollState,
  onScrollChange: (scrollDx: number, scrollDy: number) => void,
  getViewportAndZoom: () => {
    width: number;
    height: number;
    zoom: number;
  },
): void => {
  if (state.active) {
    return;
  }
  state.active = true;

  const tick = () => {
    if (!state.active) {
      return;
    }
    const { width, height, zoom } = getViewportAndZoom();
    const { dx, dy } = getEdgeScrollDelta(
      state.pointerX,
      state.pointerY,
      width,
      height,
      zoom,
    );
    if (dx !== 0 || dy !== 0) {
      state.scrollDeltaX += dx;
      state.scrollDeltaY += dy;
      onScrollChange(dx, dy);
    }
    if (state.active) {
      state.animationFrameId = requestAnimationFrame(tick);
    }
  };

  state.animationFrameId = requestAnimationFrame(tick);
};

export const stopEdgeScroll = (state: EdgeScrollState): void => {
  state.active = false;
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
  state.scrollDeltaX = 0;
  state.scrollDeltaY = 0;
};
