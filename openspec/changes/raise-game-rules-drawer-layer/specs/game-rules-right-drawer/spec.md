## MODIFIED Requirements

### Requirement: Right-edge drawer presentation
The game rules interface SHALL use one semicircular toggle centered one third of the canvas height above the bottom edge. When collapsed, the toggle SHALL be flush with the canvas right edge and display `<`. When opened, the same toggle SHALL be attached to the drawer's left edge and display `>`. The drawer SHALL overlay the right side without resizing, repositioning, transforming, or animating other game UI. The open drawer and its mask SHALL render above every game animation layer.

#### Scenario: Open drawer on supported landscape canvases

- **WHEN** the player activates the trigger on a 960×540 or 1280×720 game canvas
- **THEN** a square-cornered, full-height drawer slides in from the right edge
- **AND** the drawer width is 400px on 960×540 and 480px on 1280×720
- **AND** the reveal transition changes only the drawer's own clip path
- **AND** the underlying game UI retains its existing size, position, and transform
- **AND** no active game animation renders above the mask or drawer

#### Scenario: Toggle the open drawer closed

- **WHEN** the drawer is open
- **THEN** the same semicircular toggle is attached to the drawer's left edge and displays `>`
- **AND** activating it closes the drawer
