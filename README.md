# aura-cognitive-os

Aura is a "High-Finish" agentic operating system designed to act as an Intelligent Chief of Staff for the modern creative. 

The core purpose of Aura is to bridge the gap between complex life/project management and human creativity. By eliminating cognitive load and decision fatigue, Aura allows creatives to focus entirely on execution and artistry. It anticipates needs, understands deep contextual environments, and orchestrates solutions proactively.

### Current Implementation: The Cognitive Stylist Module
As the first fully operational module of the Aura OS, the Cognitive Stylist targets daily decision fatigue. It acts as an intelligent wardrobe assistant that doesn't just store images, but semantically understands the physical characteristics and environmental context of the user's clothing.

**Core Capabilities:**
*   **Multimodal Ingestion:** Users upload images of garments, which are processed via AI vision models to automatically extract physical metadata (category, style, color palette, weather suitability).
*   **Vectorized Memory:** Extracted metadata is embedded and stored in Pinecone, allowing Aura to retrieve garments based on semantic, human-language queries (e.g., "warm and sunny day out").
*   **Agentic Orchestration:** A cyclical LangGraph state machine retrieves relevant physical inventory, grounds the LLM strictly to those available items, and generates a cohesive, reasoned outfit recommendation without hallucinating garments.
*   **Premium Glassmorphic UI:** Built to feel like a high-end personal assistant, utilizing fluid Framer Motion haptics, dual-view UI architecture, and ambient mother-of-pearl styling.

### The Tech Stack (2026 Ready)
*   **Orchestration:** LangGraph (Multi-agent cyclic state management)
*   **Memory:** Pinecone (Vector Database for long-term semantic retrieval)
*   **Frontend:** React 19 + Tailwind CSS + Framer Motion
*   **Backend:** Node.js / Next.js API Routes