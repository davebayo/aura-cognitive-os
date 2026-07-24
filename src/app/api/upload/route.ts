import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'db3ftkvyc',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Pinecone Client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { image, id, category, genderStyle } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const itemCategory = category || 'Tops';
    const itemStyle = genderStyle || 'Unisex';
    const itemId = id || `temp-${Date.now()}`;

    // Secure signed upload to Cloudinary with background removal
    const uploadResult = await cloudinary.uploader.upload(image, {
      background_removal: 'cloudinary_ai',
      format: 'png'
    });

    const secureUrl = uploadResult.secure_url;

    // 1. Generate Text Meta-string
    const metaString = `A garment categorized as ${itemCategory} with a ${itemStyle} style layout`;

    // 2. Generate Text Embeddings using gemini-embedding-2
    const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const embeddingResult = await embeddingModel.embedContent({
      content: { parts: [{ text: metaString }] },
      outputDimensionality: 768,
    } as any);
    const embeddingValues = embeddingResult.embedding.values;

    // 3. Pinecone Upsert
    const indexName = process.env.PINECONE_INDEX_NAME || 'aura-closet';
    const index = pinecone.index(indexName);
    await index.upsert({
      records: [
        {
          id: itemId,
          values: embeddingValues,
          metadata: {
            category: itemCategory,
            style: itemStyle,
            cloudinary_url: secureUrl,
          },
        },
      ]
    });

    return NextResponse.json({ secure_url: secureUrl });
  } catch (error: any) {
    console.error('Upload API Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Upload and sync failed' }, { status: 500 });
  }
}
