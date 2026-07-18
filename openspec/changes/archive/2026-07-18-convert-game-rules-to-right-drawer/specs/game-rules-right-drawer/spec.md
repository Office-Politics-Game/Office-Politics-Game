## ADDED Requirements

### Requirement: Right-edge drawer presentation
The game rules interface SHALL use one semicircular toggle centered one third of the canvas height above the bottom edge. When collapsed, the toggle SHALL be flush with the canvas right edge and display `<`. When opened, the same toggle SHALL be attached to the drawer's left edge and display `>`. The drawer SHALL overlay the right side without resizing, repositioning, transforming, or animating other game UI.

#### Scenario: Open drawer on supported landscape canvases

- **WHEN** the player activates the trigger on a 960×540 or 1280×720 game canvas
- **THEN** a square-cornered, full-height drawer slides in from the right edge
- **AND** the drawer width is 400px on 960×540 and 480px on 1280×720
- **AND** the reveal transition changes only the drawer's own clip path
- **AND** the underlying game UI retains its existing size, position, and transform

#### Scenario: Toggle the open drawer closed

- **WHEN** the drawer is open
- **THEN** the same semicircular toggle is attached to the drawer's left edge and displays `>`
- **AND** activating it closes the drawer

### Requirement: Drawer content layout
The drawer SHALL open on the Cards page. Its card information table SHALL fill the available content height. The Rules page SHALL omit the Game Information section and SHALL divide the available content height equally between Game Objective, Victory Conditions, and Game Flow.

#### Scenario: Browse rules and card information

- **WHEN** the player switches between the Rules and Cards page
- **THEN** the selected page is displayed within the fixed-width drawer
- **AND** the selected page fills the available drawer content height

#### Scenario: Open the drawer

- **WHEN** the player opens the game rules drawer
- **THEN** the Cards page is selected
- **AND** the card information table fills the height below its heading

### Requirement: Drawer dismissal and focus behavior
The drawer SHALL close through its toggle, the Escape key, or a click outside. The outside interaction layer SHALL display a semi-transparent navy mask beneath the drawer without an opacity transition. Keyboard focus SHALL remain within the open drawer and return to the trigger after closing.

#### Scenario: Close through supported controls

- **WHEN** the player activates the close button, presses Escape, or clicks outside the drawer
- **THEN** the drawer slides out toward the right edge
- **AND** keyboard focus returns to the collapsed trigger

#### Scenario: Navigate drawer by keyboard

- **WHEN** the drawer is open and the player presses Tab or Shift+Tab at a focus boundary
- **THEN** focus cycles between focusable controls inside the drawer
- **AND** focus does not move to the underlying game table
