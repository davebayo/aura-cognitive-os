import { NextResponse } from "next/server";
import { stylistGraph } from "@/lib/stylistGraph";

export async function POST(req: Request) {
  try {
    const { userRequest, weatherContext } = await req.json();

    // Invoke the compiled LangGraph stylistGraph
    const finalState = await stylistGraph.invoke({
      userRequest: userRequest || "",
      weatherContext: weatherContext || "",
      retrievedItems: [],
      finalOutfit: {},
    });

    // Return the generated outfit recommendation object
    return NextResponse.json({ finalOutfit: finalState.finalOutfit });
  } catch (error: any) {
    console.error("Stylist Graph Execution Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute styling graph" },
      { status: 500 }
    );
  }
}
