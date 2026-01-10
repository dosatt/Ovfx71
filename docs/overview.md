# OVFX Application Overview

## Introduction
OVFX is a cutting-edge, web-based workspace operating system designed to merge the flexibility of an infinite canvas with the structure of document-based organization and the utility of productivity apps. It provides a unified environment where users can manage projects, ideas, and workflows through a highly interactive and visually premium interface.

## Core Philosophy
The platform is built on the concept of **Spaces**. A Space is not just a file or a folder but a versatile container that can adapt to different needs:
- **Page**: A rich-text document environment similar to modern block-based editors (e.g., Notion), suitable for writing, documentation, and structured notes.
- **Canvas**: An infinite, free-form whiteboard for visual brainstorming, diagramming, wireframing, and collecting mixed media.
- **Database**: Structured data organization (presumably for future expansion or current data listing capabilities).
- **Dashboard**: A high-level overview for key metrics and widgets.

These spaces live within a hierarchical tree structure, allowing for deep nesting and organized knowledge management.

## Key Features

### 1. Viewport System (Multitasking)
OVFX distinguishes itself with a robust **Viewport System**. Users are not limited to a single view; they can:
- **Split Screens**: Divide the workspace vertically or horizontally to view multiple spaces or apps simultaneously.
- **Tabs**: Manage multiple contexts within each viewport using a browser-like tab system.
- **Drag and Drop**: Seamlessly move tabs between viewports to organize the layout.

### 2. Applications
Beyond basic spaces, OVFX integrates full-featured internal applications:
- **Calendar App**: A comprehensive scheduling tool supporting:
    - Month, Week, Day, and Timeline views.
    - Drag-and-drop event management.
    - Multi-day events.
    - "Linked Spaces" integration to associate events with project spaces.
- **Settings App**: A centralized control panel for system-wide preferences, including theme customization (light/dark mode, gradients), design tokens (border radius, padding), and visual debugging.

### 3. The Canvas Space
The Canvas is a powerhouse for visual thinkers, featuring:
- **Drawing Tools**: Pen, Rectangle, Circle, Line, Arrow.
- **Media Support**: Drag-and-drop support for images and files.
- **Embeds**: Ability to embed other Blocks or Spaces directly onto the canvas.
- **Interactive Elements**: Connectors for diagrams, grouping/ungrouping, and z-index management.
- **Infinite Navigation**: Panning and zooming to manage vast amounts of information.

### 4. Rich Text Editor
The Page space utilizes a sophisticated block-based editor supporting:
- **Markdown Shortcuts**: rapid formatting (headings, lists, quotes).
- **Slash Commands**: Quick insertion of elements.
- **Media Embedding**: Integration of images and other assets.

## Design System & Architecture

### Tech Stack
- **Framework**: React (with Vite for fast tooling).
- **Styling**: Tailwind CSS for utility-first styling, combined with standard CSS for complex animations.
- **UI Components**: Built on top of `@heroui/react` for accessible and beautiful primitives.
- **Icons**: `lucide-react` for a consistent and clean iconography.
- **State Management**: React Context and potentially local state for granular control.

### Aesthetics
OVFX prioritizes a **Premium User Experience**:
- **Glassmorphism**: Extensive use of backdrop blurs and transparencies to create depth.
- **Gradients**: Customizable, vibrant background gradients that give the app a distinct character.
- **Micro-interactions**: Smooth transitions and hover effects to make the interface feel alive.
- **Customizability**: Users can fine-tune the look, from "Ocean" or "Sunset" themes to specific border radii of buttons, making the workspace truly theirs.

## Directory Structure (Docs Refactor)
The project structure has been organized to separate documentation and library components:
- `docs/`: Contains entry points for documentation and the UI library (`library.html`, `description.html`).
- `src/docs/`: Contains the source code for the documentation sites (`library/`, `description/`).
- `src/components/`: The core application components.
- `src/hooks/`: Custom React hooks for logic reuse.

## Conclusion
OVFX represents a step forward in web-based productivity tools, offering a fluid, customizable, and powerful environment that adapts to the user's mental model, whether they prefer structured text, visual maps, or time-based organization.
