
# Peak Pulse - Next.js E-commerce Project

This is a Next.js application for Peak Pulse, a Nepali clothing brand blending traditional craftsmanship with contemporary streetwear aesthetics. It includes features like product listings, product details, a shopping cart, checkout, user accounts (with Firebase Authentication), and an admin panel for managing products, categories, orders, and site content. The backend for data persistence uses Supabase.

## Tech Stack

*   **Framework:** Next.js (with App Router)
*   **UI:** React, ShadCN UI Components, Tailwind CSS
*   **Authentication:** Firebase Authentication
*   **Database:** Supabase (PostgreSQL)
*   **AI Features:** Genkit (with Google AI)
*   **Styling:** Tailwind CSS, CSS Variables
*   **State Management:** React Context (for Cart, Auth)
*   **Forms:** React Hook Form with Zod for validation

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up Environment Variables:**
    *   Create a `.env` file in the root of your project by copying `.env.example` if it exists, or use the structure below.
    *   Fill in your actual Firebase project configuration values (API Key, Auth Domain, Project ID, etc.).
    *   Fill in your Google AI API Key for Genkit (`GOOGLE_API_KEY`).
    *   Fill in your Supabase Project URL and Anon Key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
    *   Fill in your Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) - this is crucial for admin operations.
    *   Set `NEXT_PUBLIC_APP_URL` (e.g., `http://localhost:9003` for local development).

    Example `.env` structure (refer to your project's `.env` file for the most up-to-date list):
    ```env
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    # ... (all other Firebase variables)

    # Google AI (Genkit)
    GOOGLE_API_KEY=AIzaSy...

    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key # Server-side only, keep secure

    # Application URL
    NEXT_PUBLIC_APP_URL=http://localhost:9003
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9003](http://localhost:9003) (or the port specified in your `package.json` dev script) with your browser to see the result.

5.  **Set up Supabase Database:**
    *   Ensure you have a Supabase project.
    *   Run the SQL scripts provided in the development process (or in `supabase/migrations` if they exist) to create tables for `products`, `categories`, `users`, `orders`, and `loans`.
    *   **Important Note for SQL Scripts:** When running SQL scripts (e.g., in the Supabase SQL Editor or via migration files), ensure they only contain valid SQL commands. Do not include non-SQL instructional text or notes directly within the script blocks unless they are properly formatted as SQL comments (e.g., starting a line with `--` or enclosing text in `/* ... */`). Including plain text instructions directly in executable SQL will cause syntax errors.
    *   Configure Row Level Security (RLS) policies as needed for each table.

## Key Features

*   Product Catalog & Detail Pages
*   Shopping Cart & Checkout
*   User Authentication (Login, Register, Profile, Orders, Wishlist - powered by Firebase Auth and Supabase for profiles)
*   Admin Panel:
    *   Dashboard with Supabase data counts
    *   Product Management (CRUD operations, connected to Supabase)
    *   Category Management (CRUD operations, connected to Supabase)
    *   Order Management (View orders from Supabase, update status)
    *   Loan Management (CRUD operations, connected to Supabase) with AI Financial Analysis
    *   Site Content Management (Homepage, Our Story page - via JSON files, editable from admin)
    *   General Site Settings (Site Title, Description, Social Links - via JSON file, editable from admin)
    *   AI-Powered Site Analytics Demo
    *   Tax Data Export
*   Print-on-Demand Customization for Products
*   User-Generated Content/Style Posts (Submission form, homepage display, Supabase backed)
*   AI Chatbot Concierge
*   Responsive Design
*   Light/Dark/Sustainable Themes

## Deployment to Vercel (Recommended)

This project is optimized for deployment on Vercel.

**Prerequisites:**
*   Your project code pushed to a Git repository (e.g., GitHub, GitLab, Bitbucket).
*   A Vercel account ([vercel.com](https://vercel.com/)). Sign up with your Git provider for easy integration.

**Deployment Steps:**

1.  **Import Project on Vercel:**
    *   Log in to your Vercel dashboard.
    *   Click **"Add New..."** -> **"Project"**.
    *   Choose **"Continue with Git"** and select your Git provider.
    *   Authorize Vercel to access your repositories (if you haven't already).
    *   Find your project's repository (e.g., `peak-pulse-app`) and click **"Import"**.

2.  **Configure Project Settings on Vercel:**
    *   **Project Name:** Vercel will suggest one; you can change it.
    *   **Framework Preset:** Vercel should automatically detect **"Next.js"**.
    *   **Root Directory:** Usually `./` (leave as default if your `package.json` is in the root).
    *   **Build and Output Settings:** Vercel's defaults for Next.js are typically correct.
        *   Build Command: `next build` or `npm run build`
        *   Install Command: `npm install` (or `yarn install`, `pnpm install` if you use those)
    *   **Environment Variables (CRUCIAL STEP):**
        *   Expand the "Environment Variables" section.
        *   You **must** add all the variables that are in your local `.env` file here. Vercel securely stores these.
        *   **Copy each variable name and its corresponding value from your local `.env` file and add them one by one in Vercel:**
            *   `NEXT_PUBLIC_FIREBASE_API_KEY`
            *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
            *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
            *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
            *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
            *   `NEXT_PUBLIC_FIREBASE_APP_ID`
            *   `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
            *   `GOOGLE_API_KEY` (This is server-side only and will be secure on Vercel)
            *   `NEXT_PUBLIC_SUPABASE_URL`
            *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
            *   `SUPABASE_SERVICE_ROLE_KEY` (This is server-side only, **keep it secret and secure on Vercel**. Found in your Supabase project settings under API.)
            *   **`NEXT_PUBLIC_APP_URL`**: For Vercel deployment, initially set this to your Vercel-provided domain (e.g., `https://your-project-name.vercel.app`). Once you assign a custom domain, update this to your primary production domain (e.g., `https://www.yourdomain.com`). This is important for server-side API calls and absolute URLs.
        *   For each variable, enter the name and value, then click "Add".
        *   **Important:** Ensure the values are copied exactly.

3.  **Deploy:**
    *   Click the **"Deploy"** button.
    *   Vercel will clone your repository, install dependencies, run the build command, and deploy your application. You can watch the build logs in real-time.

4.  **Access Your Site:**
    *   Once deployment is successful, Vercel will provide you with a URL (e.g., `your-project-name.vercel.app`). Your site is now live!
    *   Test thoroughly. Check browser console and Vercel function logs for any runtime errors.

5.  **Custom Domain (Optional):**
    *   In your Vercel Project Settings -> **"Domains"**:
    *   Add your custom domain (e.g., `www.milijuli.com`). Vercel will provide instructions on how to update your DNS records with your domain registrar (e.g., GoDaddy, Namecheap).

**Automatic Deployments:**
Once set up, Vercel will automatically build and deploy new versions of your site whenever you push changes to your connected Git repository's main branch (or other branches configured for deployment). Vercel also creates "Preview Deployments" for every pull request, allowing you to test changes before merging.

**Troubleshooting Deployment:**
*   **Check Build Logs on Vercel:** If a deployment fails, the Vercel build logs are the first place to look for errors.
*   **Environment Variables:** Double-check that all environment variables are correctly set in Vercel and that their names match exactly what your application expects.
*   **Local Build:** Ensure your project builds successfully locally (`npm run build`) before pushing, as this can catch many issues.

## Scripts

*   `npm run dev`: Starts the development server (uses Turbopack).
*   `npm run build`: Creates a production build.
*   `npm run start`: Starts a production server (after building).
*   `npm run lint`: Runs Next.js ESLint.
*   `npm run typecheck`: Runs TypeScript type checking.
*   `npm run genkit:dev`: Starts the Genkit development server (for testing AI flows).
*   `npm run genkit:watch`: Starts Genkit dev server with watch mode.

    
