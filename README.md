# 🫁 Medical AI Diagnostic Dashboard (Chest X-Ray Analysis)

> **A graduation project featuring an advanced, end-to-end medical web application designed to assist doctors in diagnosing chest X-Rays using Deep Learning.** 
> It features multi-label classification and explainable AI (XAI) to provide transparent, accurate, and rapid clinical insights.

---

## 🏗️ System Architecture & Tech Stack

This project is built using a modern, scalable, and secure technology stack:

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn UI
- **Backend API:** FastAPI (Hosted on Hugging Face Spaces)
- **AI Engine:** An ensemble of 5 Deep Learning CNN architectures (Basic DenseNet, DenseNet LSE, Medical Enhancement, etc.) utilizing Grad-CAM to generate visual heatmaps.
- **Database & Auth:** Supabase (PostgreSQL) for secure Role-Based Access Control (RBAC).
- **Cloud Storage:** ImageKit for raw, uncompressed medical image storage.

---

## ✨ Key Features

- 🧠 **Explainable AI:** Interactive Grad-CAM heatmaps with adjustable opacity for transparent and trustworthy diagnoses.
- 🔐 **Role-Based Access:**
  - **Admin:** Full system overview and user management.
  - **Doctors:** Private, secure access strictly limited to their own patients.
  - **Guest Mode:** Ephemeral testing environment without database pollution.
- 📊 **Smart Analytics:** Real-time dashboards, interactive age/gender distribution charts, and comprehensive multi-label disease tracking.
- 🔄 **Rediagnosis:** Ability to instantly re-evaluate existing patient scans with new models without duplicating storage.

---

## 🚀 Getting Started (Local Development)

Follow these steps to set up the project locally:

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd medical-ai-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
You must configure your local environment with Supabase and ImageKit credentials. Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ImageKit
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 👥 The Team

This project was proudly developed by:

- **[Team Member Name 1]** - *[Role / Contribution]*
- **[Team Member Name 2]** - *[Role / Contribution]*
- **[Team Member Name 3]** - *[Role / Contribution]*
- **[Team Member Name 4]** - *[Role / Contribution]*
