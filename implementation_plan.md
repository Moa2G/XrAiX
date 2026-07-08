# ImageKit Storage Integration Plan

This plan details the process of integrating the ImageKit SDK to securely store uploaded X-ray images, linking them with your Supabase database, and displaying the images in the dashboard UI.

## User Review Required
- **Missing Environment Variables**: In your prompt you mentioned the `.env` file was updated with ImageKit keys. However, when I inspected the `.env` file, I did not see them (the file only has 5 lines currently). Please double-check that you have saved the `.env` file in your editor with the following keys:
  - `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
  - `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
  - `IMAGEKIT_PRIVATE_KEY`
- **Predict API Flow**: Currently, `app/api/predict/route.ts` sends the image directly to the Hugging Face AI. I plan to add the ImageKit upload directly inside this exact API route so that when the AI prediction finishes, the frontend receives both the prediction data AND the newly minted ImageKit URL in one go. The frontend will then save everything to Supabase. Does this parallel approach sound good?

## Proposed Changes

### 1. SDK Installation and Utility Setup
- **Install** the `imagekit` package using npm.
- **NEW File:** `lib/imagekit.ts`
  - This file will configure and export a secure, server-side instance of the ImageKit client using the private environment variables.

### 2. Update Prediction API
- **MODIFY** `app/api/predict/route.ts`
  - Intercept the uploaded `File` object and convert it to a Node.js Buffer.
  - While waiting for the Hugging Face AI, concurrently execute `imagekit.upload()` using the `folder: "/patient-xrays"` parameter.
  - Generate a secure filename format using a timestamp and a unique identifier (e.g., `xray_${Date.now()}.jpg`).
  - Return the resulting ImageKit `url` within the JSON response back to the frontend dashboard.

### 3. Link with Supabase & Database Logging
- **MODIFY** `components/dashboard.tsx`
  - In `handleRunDiagnostics`, grab the newly returned ImageKit URL from the API response.
  - Pass this URL into the `logAnalysisHistory` server action so it gets securely inserted into the `history` table under the `image_url` column.

### 4. UI Dashboard Updates
- **MODIFY** `components/dashboard.tsx`
  - **Patient History Tab**: Add an image thumbnail column or block next to each historical analysis record. If the `image_url` exists, we will render a small, optimized `<img>` tag using the ImageKit URL.
  - **Recent Analyses Card**: Add tiny square thumbnails next to the Patient names to make the widget more visually engaging.

## Verification Plan

### Automated/Manual Verification
1. Attempt an X-ray upload workflow in the dashboard.
2. Verify that the Next.js API responds successfully and includes the newly minted `imageKitUrl`.
3. Check the Supabase `history` table manually to ensure the `image_url` column was populated.
4. Navigate to the "Patient History" tab and verify the actual image thumbnail loads successfully from the ImageKit CDN.
