## ADDED Requirements

### Requirement: Dual fixed landscape canvases
The friend social page SHALL select exactly one fixed landscape canvas from the viewport width and SHALL NOT introduce a third responsive breakpoint.

#### Scenario: Compact landscape canvas
- **WHEN** the viewport width is less than 1024 pixels
- **THEN** the page uses a 960 by 540 pixel canvas with a 920 by 520 pixel main panel
- **AND** the panel uses a 340 pixel social column and a 580 pixel chat column

#### Scenario: Standard landscape canvas
- **WHEN** the viewport width is 1024 pixels or greater
- **THEN** the page uses a 1280 by 720 pixel canvas with a 1180 by 688 pixel main panel
- **AND** the panel uses a 420 pixel social column and a 760 pixel chat column

### Requirement: Whole-canvas viewport fitting
The friend social page SHALL fit the complete selected canvas within the viewport by applying one scale value to the canvas, and the scale SHALL NOT exceed 1.

#### Scenario: Viewport is smaller than the selected canvas
- **WHEN** either viewport dimension is smaller than the corresponding selected canvas dimension
- **THEN** the scale equals the minimum of the width ratio, height ratio, and 1
- **AND** the internal fixed dimensions and two-column structure remain unchanged

##### Example: width-constrained standard canvas
- **GIVEN** a 1024 by 600 pixel viewport and a 1280 by 720 pixel selected canvas
- **WHEN** the canvas model is resolved
- **THEN** the scale is 0.8 and the scaled canvas is 1024 by 576 pixels

#### Scenario: Viewport is larger than the selected canvas
- **WHEN** both viewport dimensions are at least the selected canvas dimensions
- **THEN** the scale is 1
- **AND** the canvas remains centered while the background fills the remaining viewport

#### Scenario: Invalid viewport dimensions
- **WHEN** a viewport dimension is negative or non-finite
- **THEN** the resolver normalizes that dimension to 0
- **AND** every returned dimension and scale is finite and non-negative

### Requirement: Stable two-column social layout
The friend social page SHALL retain the social navigation and chat area as two fixed columns in both canvas modes.

#### Scenario: Compact canvas content layout
- **WHEN** the compact canvas is active
- **THEN** all four social tabs remain directly operable without horizontal scrolling
- **AND** the page does not rearrange the chat area below the social area

#### Scenario: Standard canvas content layout
- **WHEN** the standard canvas is active
- **THEN** all four social tabs remain directly operable without horizontal scrolling
- **AND** the page does not rearrange the chat area below the social area

### Requirement: Bounded scrolling and long content
The friend social page SHALL confine overflow to the content region that owns it and SHALL NOT create page-level horizontal or vertical scrolling from friend or chat content.

#### Scenario: Long friend content
- **WHEN** a friend name, player identifier, status, request, search result, or blocked-player entry exceeds its fixed column space
- **THEN** text is truncated or wrapped within its owning content region
- **AND** the fixed column width does not change

#### Scenario: Long conversation
- **WHEN** the selected conversation contains more messages than the chat area can display
- **THEN** only the message body scrolls vertically
- **AND** the chat toolbar and composer remain visible

#### Scenario: Long chat message
- **WHEN** a message exceeds the fixed message bubble width
- **THEN** the message wraps inside the bubble
- **AND** no page-level horizontal scrolling is introduced

### Requirement: Landscape orientation and interaction preservation
The friend social page SHALL preserve the existing orientation notice and all current friend and chat interactions while adapting the layout.

#### Scenario: Portrait viewport
- **WHEN** the viewport is in portrait orientation
- **THEN** the existing global rotate-device notice covers the social page
- **AND** no portrait-specific social layout is rendered

#### Scenario: Interactive states in either canvas
- **WHEN** a user navigates tabs, friend actions, chat controls, or the return control with pointer or keyboard input
- **THEN** default, hover, active, focus-visible, and disabled states remain available where applicable
- **AND** focus indicators are not clipped by fixed canvas overflow

#### Scenario: Existing functional state
- **WHEN** the page displays authentication, loading, empty, error, processing, realtime retry, message sending, or return-transition state
- **THEN** the existing functional behavior and data flow remain unchanged
- **AND** the state remains contained within its assigned fixed panel
