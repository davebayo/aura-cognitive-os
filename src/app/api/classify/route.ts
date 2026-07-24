import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  let rawResponse = "";
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType
      }
    };

    const systemInstruction = 'You are a fashion classification agent. Analyze the clothing item in the image. Return ONLY a valid JSON object with two exact keys: "category" (must be exactly one of: Tops, Bottoms, Shoes, Outerwear, Accessories, Headwear) and "genderStyle" (must be exactly one of: Menswear, Womenswear, Unisex. If ambiguous, default to Unisex). Do not include markdown formatting.';

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction
    });

    const result = await model.generateContent([imagePart]);
    rawResponse = result.response.text();

    let cleanedText = rawResponse.trim();
    // Strip markdown formatting using regex
    cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    // Isolate from first { to last }
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    }

    const classification = JSON.parse(cleanedText);

    // Validate predicted category and genderStyle against valid options
    const validCategories = ["Tops", "Bottoms", "Shoes", "Outerwear", "Accessories", "Headwear"];
    const validGenderStyles = ["Menswear", "Womenswear", "Unisex"];

    let category = classification.category || "Tops";
    let genderStyle = classification.genderStyle || "Unisex";

    // Normalize casing or default
    const matchedCategory = validCategories.find(c => c.toLowerCase() === category.toLowerCase());
    if (matchedCategory) category = matchedCategory;
    else category = "Tops";

    const matchedGender = validGenderStyles.find(g => g.toLowerCase() === genderStyle.toLowerCase());
    if (matchedGender) genderStyle = matchedGender;
    else genderStyle = "Unisex";

    return NextResponse.json({ category, genderStyle });
  } catch (error: any) {
    console.error('Classification Error Message:', error.message);
    console.error('Classification Error Stack:', error.stack);
    console.error('Raw Gemini Response:', rawResponse);
    return NextResponse.json({ error: 'Failed to classify image', details: error.message }, { status: 500 });
  }
}
