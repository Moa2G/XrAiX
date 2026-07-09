import { NextRequest, NextResponse } from 'next/server'
import imagekit from '@/lib/imagekit'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const targetDisease = formData.get('target_disease') as string | null
    const skipUpload = formData.get('skip_upload') === 'true'
    const existingImageUrl = formData.get('existing_image_url') as string | null

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // 1. Define your Hugging Face API URL from environment variable
    const HUGGING_FACE_URL = process.env.HUGGING_FACE_URL;
    if (!HUGGING_FACE_URL) {
      return NextResponse.json({ error: 'HUGGING_FACE_URL is not configured' }, { status: 500 })
    }

    // 2. Read the file bytes once upfront to avoid stream consumption issues
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Create FormData for backend with a fresh Blob from the buffer
    const backendFormData = new FormData();
    backendFormData.append('file', new Blob([buffer], { type: image.type || 'image/jpeg' }), image.name || 'xray.jpg');
    if (targetDisease) {
      backendFormData.append('target_disease', targetDisease);
    }
    
    // 4. Forward to backend. Conditionally upload to ImageKit (skip on rediagnose)
    let imageKitPromise: Promise<{ url: string | null }>;
    if (skipUpload && existingImageUrl) {
      // Rediagnose: skip ImageKit upload, reuse existing URL
      imageKitPromise = Promise.resolve({ url: existingImageUrl });
    } else {
      imageKitPromise = imagekit.upload({
        file: buffer,
        fileName: `xray_${Date.now()}.jpg`,
        folder: "/patient-xrays",
      }).catch(err => {
        console.error("ImageKit upload error:", err);
        return { url: null };
      });
    }

    const [response, imageKitResult] = await Promise.all([
      fetch(HUGGING_FACE_URL, {
        method: 'POST',
        body: backendFormData,
      }),
      imageKitPromise
    ]);

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
      threshold: p.threshold / 100.0,
    }));

    // Map individual heatmaps to base64 Data URIs
    const individualHeatmaps: Record<string, string> = {}
    if (backendData.individual_heatmaps) {
      for (const [modelName, base64] of Object.entries(backendData.individual_heatmaps)) {
        individualHeatmaps[modelName] = `data:image/jpeg;base64,${base64}`
      }
    }

    return NextResponse.json({
      predictions: mappedPredictions,
      // Wrap the raw base64 string in the proper Data URI format for the browser to render
      gradcam_overlay: `data:image/jpeg;base64,${backendData.gradcam_base64}`,
      target_disease: targetDisease || null,
      individual_heatmaps: individualHeatmaps,
      individual_predictions: backendData.individual_predictions || {},
      image_url: imageKitResult.url,
    })

  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to process prediction through the AI Ensemble' },
      { status: 500 }
    )
  }
}