## ADDED Requirements

### Requirement: Canvas auto-pans when dragging elements near viewport edge
When the user is dragging one or more selected elements and the pointer enters a zone within 60 px of any viewport edge, the canvas SHALL automatically pan in the direction of that edge.

#### Scenario: Pointer enters right edge zone while dragging
- **GIVEN** the user is actively dragging one or more selected elements with the canvas visible and pointer captured by the drag operation
- **WHEN** the pointer's x-coordinate is within 60 px of the right viewport edge
- **THEN** the canvas SHALL pan to the right continuously until the pointer leaves the edge zone or the drag ends

#### Scenario: Pointer enters left edge zone while dragging
- **GIVEN** the user is actively dragging one or more selected elements with the canvas visible and pointer captured by the drag operation
- **WHEN** the pointer's x-coordinate is within 60 px of the left viewport edge
- **THEN** the canvas SHALL pan to the left continuously until the pointer leaves the edge zone or the drag ends

#### Scenario: Pointer enters top edge zone while dragging
- **GIVEN** the user is actively dragging one or more selected elements with the canvas visible and pointer captured by the drag operation
- **WHEN** the pointer's y-coordinate is within 60 px of the top viewport edge
- **THEN** the canvas SHALL pan upward continuously until the pointer leaves the edge zone or the drag ends

#### Scenario: Pointer enters bottom edge zone while dragging
- **GIVEN** the user is actively dragging one or more selected elements with the canvas visible and pointer captured by the drag operation
- **WHEN** the pointer's y-coordinate is within 60 px of the bottom viewport edge
- **THEN** the canvas SHALL pan downward continuously until the pointer leaves the edge zone or the drag ends

#### Scenario: Pointer in corner triggers panning on two axes
- **GIVEN** the user is actively dragging one or more selected elements with the canvas visible and pointer captured by the drag operation
- **WHEN** the pointer is within 60 px of both a horizontal and a vertical viewport edge simultaneously
- **THEN** the canvas SHALL pan diagonally along both axes

### Requirement: Pan speed increases with proximity to edge
The pan speed SHALL scale linearly from 0 at the inner boundary of the edge zone to a maximum speed at the viewport edge, providing graduated control.

#### Scenario: Pointer at inner boundary of edge zone
- **GIVEN** the user is dragging selected elements and the pointer is in the edge zone
- **WHEN** the pointer is exactly 60 px from the viewport edge (inner boundary of the zone)
- **THEN** the pan speed SHALL be 0

#### Scenario: Pointer at the viewport edge
- **GIVEN** the user is dragging selected elements and the pointer is in the edge zone
- **WHEN** the pointer is at or beyond the viewport edge (0 px distance)
- **THEN** the pan speed SHALL be at maximum

#### Scenario: Pointer halfway into edge zone
- **GIVEN** the user is dragging selected elements and the pointer is in the edge zone
- **WHEN** the pointer is 30 px from the viewport edge (halfway into the zone)
- **THEN** the pan speed SHALL be approximately 50% of maximum

### Requirement: Pan speed adjusts for zoom level
The pan speed in scene coordinates SHALL be divided by the current zoom value so that the visual pan rate feels consistent regardless of zoom level.

#### Scenario: Panning at 2x zoom
- **GIVEN** the viewport size is set, the current zoom is 2.0, and the user is dragging selected elements
- **WHEN** the pointer is at the viewport edge
- **THEN** the scene-coordinate pan delta per frame SHALL be half of what it would be at 1.0 zoom

#### Scenario: Panning at 0.5x zoom
- **GIVEN** the viewport size is set, the current zoom is 0.5, and the user is dragging selected elements
- **WHEN** the pointer is at the viewport edge
- **THEN** the scene-coordinate pan delta per frame SHALL be double what it would be at 1.0 zoom

#### Scenario: Panning with invalid zoom (0 or negative)
- **GIVEN** the viewport size is set, the current zoom is 0 or a negative value, and the user is dragging selected elements
- **WHEN** the pointer is at the viewport edge
- **THEN** the zoom divisor SHALL be treated as 1.0 (zoom scaling is skipped), so the pan delta per frame equals what it would be at 1.0 zoom; implementations SHALL guard the division by checking that zoom is a finite positive number before applying it

### Requirement: Dragged elements maintain position relative to cursor during auto-pan
While the canvas auto-pans, the dragged elements SHALL move in sync with the pan so that the elements remain under the cursor at the same offset.

#### Scenario: Canvas pans right while dragging
- **GIVEN** one or more elements are selected and currently being dragged while auto-pan is active
- **WHEN** the canvas auto-pans 10 scene-units to the right
- **THEN** the dragged elements SHALL also shift 10 scene-units to the right, keeping the same cursor-to-element offset

### Requirement: Auto-pan stops when drag ends
The auto-pan animation loop SHALL stop immediately when the user releases the pointer (ending the drag).

#### Scenario: User releases pointer while in edge zone
- **GIVEN** auto-pan is active during a drag operation
- **WHEN** the user releases the pointer button while the cursor is in the edge zone
- **THEN** auto-pan SHALL stop immediately and no further scroll updates SHALL occur

#### Scenario: User moves pointer out of edge zone
- **GIVEN** auto-pan is active during a drag operation
- **WHEN** the user moves the pointer out of the edge zone back toward the center of the viewport while still dragging
- **THEN** auto-pan SHALL stop and normal drag behavior SHALL resume

### Requirement: Auto-pan only activates during element drag
Edge scrolling SHALL only activate when the user is dragging selected elements. It SHALL NOT activate during other pointer operations.

#### Scenario: Drawing a new shape near the edge
- **GIVEN** the user is performing a non-drag pointer operation (drawing a new rectangle)
- **WHEN** the pointer enters the edge zone
- **THEN** auto-pan SHALL NOT activate

#### Scenario: Panning the canvas manually near the edge
- **GIVEN** the user is performing a manual pan operation (e.g., with middle mouse button or spacebar)
- **WHEN** the pointer enters the edge zone
- **THEN** auto-pan SHALL NOT activate
