import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const targetDisease = formData.get('target_disease') as string | null

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // 1. Define your Hugging Face API URL from environment variable
    const HUGGING_FACE_URL = process.env.HUGGING_FACE_URL;
    if (!HUGGING_FACE_URL) {
      return NextResponse.json({ error: 'HUGGING_FACE_URL is not configured' }, { status: 500 })
    }

    // 2. We use FormData directly as FastAPI expects 'file' (v0 uses 'image', so we append it)
    const backendFormData = new FormData();
    backendFormData.append('file', image);
    if (targetDisease) {
        backendFormData.append('target_disease', targetDisease);
    }

    // 3. Forward the exact FormData directly to your FastAPI backend
    const response = await fetch(HUGGING_FACE_URL, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    // 4. Get the real JSON response from your Python Backend
    const backendData = await response.json();

    // 5. Map the FastAPI response to exactly what your Vercel v0 Frontend expects
    // The backend uses a 0-100 probability, but v0 expects 0-1 confidence.
    // The backend uses a text verdict, but v0 expects a boolean `predicted`.
    const mappedPredictions = backendData.predictions.map((p: any) => ({
      disease: p.disease,
      confidence: p.probability / 100.0, 
      predicted: p.verdict.includes("POSITIVE"), 
    }));

    return NextResponse.json({
      predictions: mappedPredictions,
      // Wrap the raw base64 string in the proper Data URI format for the browser to render
      gradcam_overlay: `data:image/jpeg;base64,${backendData.gradcam_base64}`,
      target_disease: targetDisease || null,
    })

  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to process prediction through the AI Ensemble' },
      { status: 500 }
    )
  }
}