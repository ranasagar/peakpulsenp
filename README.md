
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
    *   Create a `.env` file in the root of your project.
    *   Copy the contents of `.env.example` (if provided, otherwise see variables below) into `.env`.
    *   Fill in your actual Firebase project configuration values (API Key, Auth Domain, Project ID, etc.).
    *   Fill in your Google AI API Key for Genkit (`GOOGLE_API_KEY`).
    *   Fill in your Supabase Project URL and Anon Key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
    *   Set `NEXT_PUBLIC_APP_URL` (e.g., `http://localhost:9003` for local development).

    Example `.env` structure:
    ```env
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-your-measurement-id

    # Google AI (Genkit)
    GOOGLE_API_KEY=AIzaSy...

    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

    # Application URL (for server-side fetches to own API routes)
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
    *   Configure Row Level Security (RLS) policies as needed.

## Key Features

*   Product Catalog & Detail Pages
*   Shopping Cart & Checkout (Mock payment processing)
*   User Authentication (Login, Register, Profile, Orders, Wishlist)
*   Admin Panel:
    *   Dashboard with Supabase data counts
    *   Product Management (CRUD operations, connected to Supabase)
    *   Category Management (CRUD operations, connected to Supabase)
    *   Order Management (View orders from Supabase, update status)
    *   Loan Management (CRUD operations, connected to Supabase) with AI Financial Analysis
    *   Site Content Management (Homepage, Our Story page - via JSON files)
    *   General Site Settings (Site Title, Description, Social Links - via JSON file)
    *   AI-Powered Site Analytics Demo
    *   Tax Data Export
*   Print-on-Demand Customization for Products
*   User-Generated Content/Style Posts (Submission form, homepage display)
*   AI Chatbot Concierge
*   Responsive Design
*   Light/Dark/Sustainable Themes

## Deployment to Vercel

This project is optimized for deployment on Vercel.

1.  **Push to GitHub:** Ensure your project is in a GitHub repository and your latest changes are pushed. Make sure your `.env` file (with secrets) is in `.gitignore` and **NOT** committed.

2.  **Import Project on Vercel:**
    *   Sign up or log in to [vercel.com](https://vercel.com/).
    *   Click "Add New..." -> "Project".
    *   Import your Git repository from GitHub. Vercel should automatically detect it as a Next.js project.

3.  **Configure Environment Variables on Vercel:**
    *   This is the most crucial step for connecting Firebase, Supabase, and Genkit.
    *   In your Vercel Project Settings -> Environment Variables:
        *   Add all the variables from your local `.env` file.
        *   **`NEXT_PUBLIC_FIREBASE_API_KEY`**
        *   **`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`**
        *   **`NEXT_PUBLIC_FIREBASE_PROJECT_ID`**
        *   **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`**
        *   **`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`**
        *   **`NEXT_PUBLIC_FIREBASE_APP_ID`**
        *   **`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`**
        *   **`GOOGLE_API_KEY`** (This is server-side only and will be secure on Vercel)
        *   **`NEXT_PUBLIC_SUPABASE_URL`**
        *   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
        *   **`NEXT_PUBLIC_APP_URL`**: Set this to your Vercel production domain (e.g., `https://your-project-name.vercel.app` or your custom domain like `https://www.milijuli.com` after you set it up).
    *   Ensure the values are copied correctly.

4.  **Deploy:**
    *   Click the "Deploy" button on Vercel.
    *   Vercel will build and deploy your application.

5.  **Custom Domain (Optional):**
    *   Once deployed, you can add your custom domain (`www.milijuli.com`) in the Vercel project settings under "Domains".

Your Vercel deployment will automatically update whenever you push changes to your connected GitHub branch.

## Scripts

*   `npm run dev`: Starts the development server (uses Turbopack).
*   `npm run build`: Creates a production build.
*   `npm run start`: Starts a production server (after building).
*   `npm run lint`: Runs Next.js ESLint.
*   `npm run typecheck`: Runs TypeScript type checking.
*   `npm run genkit:dev`: Starts the Genkit development server (for testing AI flows).
*   `npm run genkit:watch`: Starts Genkit dev server with watch mode.
