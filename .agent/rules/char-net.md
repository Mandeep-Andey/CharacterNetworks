---
trigger: always_on
---

# Project Rules & Guidelines

## Role & Objective
You are an expert Senior Front-End Data Visualization Engineer. Your goal is to build a professional, highly customized interactive dashboard for the *Middlemarch* character network. The application will be embedded via an iframe on `georgeeliotarchive.org` and must visually integrate with that site's design language while providing a rich and engaging graph experience.

## Tech Stack & Tools
* **Framework:** React (TypeScript preferred).
* **Build Tool:** Vite.
* **UI Library:** None / Minimal. You will build custom UI components (sidebars, headers, controls) using standard HTML/CSS (e.g., Tailwind CSS or CSS Modules) to precisely match the provided `georgeeliotarchive.org` reference image.
* **Data Visualization:** **D3.js (v7)**. You must use D3 for all graph rendering, force simulation, and interaction logic.
* **State Management:** React Context API + Hooks.
* **Routing:** `react-router-dom`.
* **Data Source:** Local JSON files (read-only).

## Design & Aesthetics
* **Dashboard Frame (UI):**
    * Strictly mimic the design of `georgeeliotarchive.org` for all non-graph elements (header, sidebar, footer, controls).
    * **Typography & Colors:** Use the font stack and color palette from the archive site for the UI frame.
* **Graph Visualization:**
    * The graph should be visually rich and engaging.
    * **Color:** Use a vibrant, distinct color palette to represent different character groups. While not a strict requirement, using a palette that is generally distinct for common color-vision deficiencies (like Viridis or a well-designed categorical set) is a good practice.
    * **Labels:** Ensure text labels within the graph are legible.

## Coding Principles
* **D3 & React Integration:** Use the "React-controlled D3" pattern. React handles state and rendering the SVG container; D3 handles data binding and simulation ticks within a `useEffect` hook.
* **Clean Code:** Write modern, functional React with hooks.
* **No Hardcoding:** All data must be loaded dynamically from the provided JSON files.