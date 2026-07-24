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
Your task is to select a cohesive outfit EXCLUSIVELY from the provided "Retrieved Items" list.

User Request: "${userRequest || "Suggest a nice outfit."}"
Weather Context: "${weatherContext || "Any weather"}"
Retrieved Items (JSON list of garments):
${JSON.stringify(retrievedItems, null, 2)}

CRITICAL SYSTEM INSTRUCTIONS:
1. ABSOLUTE GROUNDING: You MUST ONLY select items that exist in the "Retrieved Items" array. Do not invent, hallucinate, or suggest garments outside of this list.
2. SELECTION PROTOCOL: Try to select one "top", one "bottom", and one "shoes". Use the 'cloudinary_url' for the selection. If a category is completely missing or inappropriate, you MUST return an empty string "" for that field. 
3. FACTUAL REASONING: Your "reasoning" MUST accurately describe the physical garments you ACTUALLY selected based on their metadata (style, category, description). Do NOT describe ideal clothes for the weather if you did not select them. Acknowledge any missing items gracefully.
4. JSON OUTPUT STRUCTURE:
{
  "top": "cloudinary_url or empty string",
  "bottom": "cloudinary_url or empty string",
  "shoes": "cloudinary_url or empty string",
  "reasoning": "Strictly accurate explanation of the actual selected pieces."
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
