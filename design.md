# Koshur Canvas Design System

## Purpose

Koshur Canvas is a mobile-first Kashmiri Unicode writing, typography, and design studio. The interface combines native text input with a professional visual canvas for Kashmiri and Urdu design.

## Core Principles

- Canvas first. Give the canvas maximum usable screen space.
- Mobile first. Design primarily for Android phone interaction.
- Minimal UI. Show only controls relevant to the current context.
- One function, one primary location. Avoid duplicate tools.
- Contextual controls. Detailed actions open in compact bottom sheets.
- Unicode first. Kashmiri text remains editable Unicode.
- Offline first. Core fonts and editing must work without network access.
- Preserve functionality. UI improvements must not alter document or rendering behavior.

## Visual Language

Primary color: deep emerald green.

Surfaces: white with a very light neutral workspace background.

Active controls: emerald green with clear but subtle emphasis.

Inactive controls: dark neutral icons on white surfaces.

Borders: thin and low contrast.

Corners: rounded, generally 12 to 16dp for controls and larger for document surfaces.

Shadows: soft and restrained.

UI typography: clean sans-serif.

Document typography: Noto Nastaliq Urdu v4 for Kashmiri and Urdu where selected.

## Main Editor Layout

The editor follows this hierarchy:

1. Compact top app bar.
2. Compact essential editor toolbar.
3. Large canvas workspace.
4. Small floating page and zoom controls.
5. Compact contextual bottom toolbar.
6. Bottom sheets for detailed controls.

The canvas is the dominant visual element.

## Top App Bar

The top bar contains only global actions:

- Back
- Document title
- Rename
- Save status
- Projects
- App/profile
- More

Detailed editing controls must not be duplicated here.

## Essential Editor Toolbar

Keep only essential global controls:

- Page indicator
- Undo
- Redo
- Selection tool
- Layers
- Add
- Canvas/Text mode

Do not put font, color, effects, transform, or other detailed styling controls in this toolbar.

## Contextual Bottom Toolbar

The bottom toolbar changes according to the current editing state.

### Nothing selected

- Text
- Image
- Shape
- Layers
- More

### Text selected

- Edit
- Font
- Size
- Color
- Style
- Transform
- More

### Image selected

- Style
- Transform
- Color
- Effects
- Layers
- More

### Multiple layers selected

- Group
- Merge
- Align
- Delete
- More

### Group selected

- Ungroup
- Transform
- Duplicate
- Delete
- More

Only relevant controls should be visible. Avoid duplicate controls across the top and bottom toolbars.

## Bottom Sheets

Detailed functions use a consistent rounded bottom-sheet component.

### Text Style

- Font
- Size
- Weight
- Style
- Color
- Spacing
- Kashida
- Stroke
- Shadow
- Opacity

### Transform

- Position
- Width
- Height
- Rotation
- Alignment

### Effects

- Effects
- Filters
- Adjustments
- Mask

### Layers

- Layer list
- Visibility
- Lock
- Duplicate
- Reorder
- Group
- Merge
- Align
- Delete

### Page Manager

- Add Page
- Duplicate Page
- Reorder Page
- Delete Page

### Canvas Settings

- Canvas Size
- Background
- Margins
- Grid
- Guides

### Export

- PNG
- JPG
- PDF
- SVG
- Resolution
- Share

## Canvas

The canvas workspace must occupy the largest practical area of the phone screen.

It must support:

- Text
- Images
- Shapes
- Groups
- Multi-selection
- Move
- Resize
- Rotate
- Duplicate
- Delete
- Lock
- Hide
- Reorder
- Alignment
- Styling
- Zoom
- Pan

Selection UI is editor-only and must never appear in exported output.

## Selection System

### Single Selection

One object has one thin emerald bounding box with touch-friendly handles.

### Multi Selection

Multiple layer checkboxes in the Layers panel create one logical selection.

The canvas displays exactly one combined bounding box around the selected layers.

Moving, resizing, and rotating the selection must preserve relative geometry.

Never show separate transformation boxes for each selected layer.

## Layers

Each document page owns an independent layer tree.

The Layers panel displays only the layers of the active page.

### Normal state

Show Add Layer.

### Multi-selection state

When two or more layer checkboxes are selected, replace Add Layer with:

- Group
- Merge
- Align
- Delete

Clear the selection to restore Add Layer.

## Groups

A group is an editable parent containing child layers.

Grouping must preserve:

- Text
- Unicode content
- Images
- Shapes
- Position
- Size
- Rotation
- Styling
- Z-order

Groups can be moved, resized, rotated, duplicated, reordered, and ungrouped.

Group and Merge are different operations. Group preserves child editability. Merge produces one resulting layer where technically supported.

## Input Text Mode

Input Text mode is optimized for native writing.

The native text input is the source of truth for Unicode content.

Support:

- Cursor
- Selection
- Copy
- Cut
- Paste
- Undo
- Redo
- Android keyboard
- Kashmiri keyboard

The keyboard selector appears only in Input Text mode.

Options:

- Android Keyboard
- Kashmiri Keyboard

When the keyboard opens, it must receive real layout space. The active input and corresponding canvas preview must remain visible.

## Kashmiri Typography

Use Noto Nastaliq Urdu v4 where selected.

Preserve Kashmiri Unicode characters and combining marks exactly.

Preserve RTL direction and OpenType shaping.

Never rasterize text during normal editing.

Never modify Unicode merely to achieve visual styling.

## Multi-page Documents

A document consists of independent pages.

Every page is a complete design canvas.

Every page supports the full canvas element and toolbar system.

Each page owns its own:

- Layers
- Groups
- Text
- Images
- Shapes
- Background
- Design elements

Documents mode uses horizontal page navigation on mobile.

Pages should:

- Appear horizontally.
- Support smooth swipe navigation.
- Snap to the nearest page.
- Keep the active page centered.
- Allow adjacent pages to be subtly visible.
- Maintain fixed page dimensions.

## Document Text Flow

For flowing document text, content must automatically move to the next page when the usable page area is exceeded.

Maintain consistent margins.

Do not extend page height.

Recalculate pagination when font, font size, line spacing, paragraph spacing, or other text dimensions change.

Freeform design elements must not automatically move between pages.

## Page Management

Support:

- Add Page
- Duplicate Page
- Delete Page
- Reorder Page

Duplicating a page duplicates its complete layer tree and generates new IDs.

Copying layers between pages creates independent layers.

## Export

Export must render the document model, not a screenshot of the editor.

Exclude:

- Cursor
- Selection boxes
- Handles
- Keyboard
- Toolbars
- Page indicators
- Zoom controls
- Layers panel
- Editor background
- Other editor UI

### Multi-page PDF

Each document page maps exactly to one PDF page.

PDF page dimensions must match the document page dimensions.

PDF rendering must use the page's own layer stack and z-order.

Editor pagination and PDF pagination must match.

The PDF must preserve:

- Kashmiri Unicode
- RTL shaping
- Noto Nastaliq Urdu v4
- Positions
- Sizes
- Rotation
- Color
- Opacity
- Supported effects

## Persistence

Persist the complete document model:

- Documents
- Pages
- Page order
- Layers
- Groups
- Text content
- Text styles
- Backgrounds
- Visibility
- Locks
- Active page
- Canvas settings

State must survive application restart.

## Responsive Android Design

Use comfortable touch targets, approximately 44 to 48dp where practical.

Respect:

- Android status bar
- Navigation area
- Gesture navigation
- Keyboard insets
- Screen cutouts

Avoid desktop-style sidebars and dense permanent toolbars.

## Performance

- Keep typing responsive.
- Keep canvas gestures smooth.
- Avoid unnecessary re-renders.
- Use efficient text measurement.
- Use efficient rendering for multiple pages and layers.
- Use full-resolution rendering primarily for export.

## UI Consistency

Use reusable components across the application:

- MobileAppBar
- EssentialToolbar
- ContextualToolbar
- BottomSheet
- IconButton
- SegmentedControl
- FloatingControl
- PageIndicator
- LayerRow
- PageThumbnail
- PrimaryButton
- SecondaryButton

Every function should use the same spacing, corner radius, typography, icon sizing, active-state treatment, and bottom-sheet behavior.

## Release Checklist

Before release verify:

- Android phone layout
- Touch interaction
- Canvas space
- Toolbar consistency
- No duplicate controls
- Native text input
- Android keyboard
- Kashmiri keyboard
- Noto Nastaliq Urdu v4
- Unicode integrity
- Multi-selection
- Group and ungroup
- Merge
- Alignment
- Independent page layers
- Horizontal page navigation
- Document text flow
- Autosave
- Offline fonts
- Offline editing
- PNG export
- JPG export
- SVG export
- Multi-page PDF export
- PDF page-to-editor page mapping
- No editor UI in exports
