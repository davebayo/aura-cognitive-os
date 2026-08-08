✦ Aura Cognitive OS

> **An agentic multi-modal orchestration layer, currently demonstrating its capabilities through an environment-aware wardrobe stylist sandbox.**

**[Live Demo](https://www.google.com/search?q=https://aura-cognitive-os-8ck1.vercel.app)** 

# The Problem

The average person spends 17 minutes deciding what to wear every morning. Aura's **Daily Pick** engine eliminates that entirely.

Aura resolves daily decision fatigue and context-blind clothing recommendations by replacing static database filters with an intelligent, environment-aware AI agent. Instead of manual queries, the system dynamically synthesizes outfits by evaluating your personal digital inventory against real-time weather constraints and occasion requirements.


## Interface

<img width="756" height="911" alt="Image" src="https://github.com/user-attachments/assets/82f0f329-f510-449c-896d-4fd949e25ee2" />

<img width="1186" height="1066" alt="Image" src="https://github.com/user-attachments/assets/e1323c40-e116-4864-9e6b-6419742552f0" />

<img width="657" height="1052" alt="Image" src="https://github.com/user-attachments/assets/0044d8e4-d429-4f36-90c9-aff70bae88e7" />

## System Architecture & Tech Stack

Aura is built on a modern, decoupled full-stack architecture prioritizing secure server-side execution and semantic reasoning.

* **Frontend Client:** Next.js (App Router), React, Tailwind CSS, Framer Motion.
* **Backend Orchestration:** Next.js Serverless API Routes utilizing the **Firebase Admin SDK** for secure, privileged server-to-database communication.
* **Vector Retrieval & Storage:** Pinecone & Firestore.
* **Asset Management:** Cloudinary.

## How It Works (The AI Flow)

Aura relies on a multi-agent orchestration pipeline powered by **LangGraph** and the **Gemini API** (`gemini-2.5-flash` / `gemini-1.5-flash`).

1. **Ingestion & Hashing:** When an item is uploaded, the Next.js server generates a SHA-256 hash of the file buffer to strictly block redundant duplicates.
2. **Vision Extraction:** Gemini Vision extracts complex visual metadata (seasonality, fabric density, formality) from the validated image.
3. **Semantic Retrieval:** Pinecone performs a vector search against the wardrobe inventory, retrieving items that conceptually match the real-time OpenWeatherMap data.
4. **Reasoning & Synthesis:** LangGraph evaluates the retrieved constraints, explicitly identifies missing categories (without hallucinating assets), and generates the final natural language "Aura's Notes" before returning the outfit array to the frontend.

## Local Development Setup

**1. Clone the repository:**

```bash
git clone https://github.com/yourusername/aura-cognitive-os.git
cd aura-cognitive-os

```

**2. Install dependencies:**

```bash
npm install

```

**3. Configure Environment Variables:**
Create a `.env.local` file in the root directory. Provision keys for Google Generative AI, Pinecone, Cloudinary, and your Firebase Admin Service Account.

```env
# AI & Data
GEMINI_API_KEY=your_key
PINECONE_API_KEY=your_key

# Database & Storage
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
# ... (other standard Firebase client keys)

# Firebase Admin SDK (Server-Side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"

```

**4. Run the development server:**

```bash
npm run dev

```

## What's Next (Roadmap)

* **Semantic Deduplication:** Transitioning from strict SHA-256 file hashing to Pinecone vector similarity scoring (Cosine Similarity > 98%) to detect duplicate items even if photographed in different lighting or angles.
* **Multi-Turn Agent Chat:** Expanding the LangGraph state machine to allow users to hold continuous, iterative conversations with the stylist agent regarding their daily pick.






<!-- # aura-cognitive-os

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
*   **Backend:** Node.js / Next.js API Routes -->


