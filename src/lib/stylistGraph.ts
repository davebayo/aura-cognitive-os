import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Initialize Pinecone Client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

// 1. State Definition
export const StateAnnotation = Annotation.Root({
  userRequest: Annotation<string>(),
  weatherContext: Annotation<string>(),
  retrievedItems: Annotation<any[]>(),
  finalOutfit: Annotation<Record<string, any>>(),
});

// 2. Placeholder Nodes
export async function retrieveWardrobe(state: typeof StateAnnotation.State) {
  console.log("retrieveWardrobe execution");
  const { userRequest, weatherContext } = state;
  const searchQuery = `${userRequest || ""} ${weatherContext || ""}`.trim();

  if (!searchQuery) {
    return { retrievedItems: [] };
  }

  // 1. Embed the Query using gemini-embedding-2 (768 dimensions)
  const embeddingModel = genAI.getGenerativeModel({
    model: "gemini-embedding-2",
  });
  const embeddingResult = await embeddingModel.embedContent({
    content: { parts: [{ text: searchQuery }] },
    outputDimensionality: 768,
  } as any);
  const embeddingValues = embeddingResult.embedding.values;

  // 2. Pinecone Search
  const indexName = process.env.PINECONE_INDEX_NAME || "aura-closet";
  const index = pinecone.index(indexName);

  const queryResponse = await index.query({
    vector: embeddingValues,
    topK: 15,
    includeMetadata: true,
  });

  // 3. State Update: extract metadata objects
  const retrievedItems = (queryResponse.matches || [])
    .map((match) => match.metadata)
    .filter(Boolean);

  return {
    retrievedItems,
  };
}

export async function generateOutfit(state: typeof StateAnnotation.State) {
  console.log("generateOutfit execution");
  const { userRequest, weatherContext, retrievedItems } = state;

  if (!retrievedItems || retrievedItems.length === 0) {
    return {
      finalOutfit: {
        error: "No items found in wardrobe retrieval.",
        top: "",
        bottom: "",
        shoes: "",
        missing_pieces: ["top", "bottom", "shoes"],
        reasoning:
          "Please upload some garments to your wardrobe first so I can style an outfit for you!",
      },
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are Aura, an expert fashion stylist and strict data processor.
Your task is to select a cohesive outfit EXCLUSIVELY from the provided "Retrieved Items" list while strictly respecting live weather conditions.

User Request: "${userRequest || "Suggest a nice outfit."}"
Live Weather Context: "${weatherContext || "Any weather"}"
Retrieved Items (JSON list of garments):
${JSON.stringify(retrievedItems, null, 2)}

CRITICAL SYSTEM INSTRUCTIONS:
1. ABSOLUTE GROUNDING: You MUST ONLY select items that exist in the "Retrieved Items" array. Do not invent, hallucinate, or suggest garments outside of this list.
2. STRICT ENVIRONMENTAL GUARDRAILS: You MUST filter and evaluate all recommendations based strictly on the provided Live Weather Context. Do NOT recommend light/warm-weather items for cold/rainy weather, nor heavy winter coats for hot sunny weather.
3. MISSING CLIMATE PIECES: If the retrieved vector inventory lacks climate-appropriate items necessary for the current weather (e.g. no heavy coat for cold weather, or no raincoat for rain), you MUST list those missing items explicitly under the "missing_pieces" array rather than hallucinating or ignoring the climate.
4. SELECTION PROTOCOL: Select one "top", one "bottom", and one "shoes" from Retrieved Items using their 'cloudinary_url'. If a category is missing or lacks weather-appropriate pieces, return an empty string "" for that field and list the item in "missing_pieces".
5. FACTUAL REASONING: Your "reasoning" MUST accurately describe the physical garments you ACTUALLY selected based on their metadata and explain how they fit the weather and occasion.
6. JSON OUTPUT STRUCTURE:
{
  "top": "cloudinary_url or empty string",
  "bottom": "cloudinary_url or empty string",
  "shoes": "cloudinary_url or empty string",
  "missing_pieces": ["list of climate-appropriate garments missing from inventory for this weather"],
  "reasoning": "Strictly accurate explanation of the actual selected pieces and weather suitability."
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log("Gemini generateOutfit Raw Response:", responseText);
    const finalOutfit = JSON.parse(responseText);
    return { finalOutfit };
  } catch (error: any) {
    console.error("Error in generateOutfit node:", error);
    return {
      finalOutfit: {
        error: error.message || "Failed to generate outfit",
        top: "",
        bottom: "",
        shoes: "",
        missing_pieces: [],
        reasoning:
          "An error occurred while generating the outfit recommendation.",
      },
    };
  }
}

export async function formatResponse(state: typeof StateAnnotation.State) {
  console.log("formatResponse execution");
  return {};
}

// 3. Graph Construction
const builder = new StateGraph(StateAnnotation)
  .addNode("retrieveWardrobe", retrieveWardrobe)
  .addNode("generateOutfit", generateOutfit)
  .addNode("formatResponse", formatResponse)
  .addEdge(START, "retrieveWardrobe")
  .addEdge("retrieveWardrobe", "generateOutfit")
  .addEdge("generateOutfit", "formatResponse")
  .addEdge("formatResponse", END);

// 4. Compile and Export
export const stylistGraph = builder.compile();
