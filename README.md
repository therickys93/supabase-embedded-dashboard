# Supabase Manager

A modern Next.js dashboard built with shadcn/ui components for managing Supabase projects through the Supabase Management API. Features an embeddable dialog interface for database, authentication, storage, users, secrets, logs, and performance monitoring.

## Features

- 🗄️ **Database Management** - Browse tables, edit records, run SQL queries
- 🔐 **Authentication Config** - Manage auth settings and providers
- 📁 **Storage Management** - Browse buckets and objects
- 👥 **User Management** - View and manage users with growth analytics
- 🔑 **Secrets Management** - Create, view, and delete project secrets
- 📊 **Logs & Analytics** - View project logs and analytics
- 💡 **Performance Suggestions** - Get security and performance recommendations
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Quick Start

This is a complete Next.js application that you can clone and customize for your needs. Fork this repository, or copy only the necessary parts, and modify the components to match your requirements.

### Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd supabase-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up your environment variables**
   ```bash
   cp .env.example .env.local
   ```

## Configuration

### 1. Supabase Management API Proxy

The application includes a Next.js API route that acts as a proxy to the Supabase Management API. This is required for security and to add your own project-level permissions.

**File:** `app/api/supabase-proxy/[...path]/route.ts`

### 2. Environment Variables

Add your Supabase Management API token to your `.env.local` file:

```bash
SUPABASE_MANAGEMENT_API_TOKEN=your_management_api_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

- **SUPABASE_MANAGEMENT_API_TOKEN**: Get this from https://supabase.com/dashboard/account/tokens
- **OPENAI_API_KEY**: Required for AI-powered SQL generation in the SQL editor (optional but recommended)

### 3. Implement Permission Checks

**Important:** You must implement proper permission checks in the proxy route to ensure users can only access projects they have permission for.

Update the `checkUserPermissions` function in `app/api/supabase-proxy/[...path]/route.ts` with your authentication logic.

### 4. Start the Development Server

```bash
npm run dev
# or
pnpm dev
```

Your application will be available at `http://localhost:3000`.

## Application Structure

### Key Files

#### API Client

- `lib/management-api.ts` - OpenAPI client configuration
- `lib/management-api-schema.d.ts` - TypeScript types for Supabase Management API

#### Hooks

- `hooks/use-supabase-manager.ts` - React hooks for all Supabase operations

#### Components

- `components/supabase-manager/index.tsx` - Main dialog component
- `contexts/SheetNavigationContext.tsx` - Navigation context for the manager

#### Database Utilities

- `lib/pg-meta/` - SQL queries for PostgreSQL metadata
- `lib/schemas.ts` - Zod schemas for form validation

## How It Works

The application is built around the `SupabaseManagerDialog` component, which provides a complete interface for managing your Supabase projects.

### Main Entry Point

The main page (`app/page.tsx`) demonstrates how to integrate the manager:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import SupabaseManagerDialog from "@/components/supabase-manager";
import { useMobile } from "@/hooks/use-mobile";

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMobile();
  const projectRef = "your-project-ref-here"; // Get this from your app state

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Manage Backend</Button>

      <SupabaseManagerDialog
        projectRef={projectRef}
        open={isOpen}
        onOpenChange={setIsOpen}
        isMobile={isMobile}
      />
    </>
  );
}
```

### React Query Integration

The application uses React Query for data fetching and state management. The providers are already configured in the layout.

### AI-Powered SQL Generation

The SQL editor (`components/sql-editor.tsx`) includes AI functionality that converts natural language queries into SQL. This feature:

- Uses OpenAI's API to generate SQL from natural language prompts
- Automatically fetches your database schema to provide context
- Handles the conversion via the `/api/ai/sql` endpoint (`app/api/ai/sql/route.ts`)
- Requires an `OPENAI_API_KEY` environment variable

Users can toggle between SQL mode and chat mode using the interface controls. In chat mode, they can ask questions like "Show me all users who signed up in the last 7 days" and get executable SQL.

## Component Architecture

### Main Components

- **SupabaseManagerDialog** - Main entry point with responsive dialog/drawer
- **DatabaseManager** - SQL editor and table browser
- **AuthManager** - Authentication configuration
- **StorageManager** - File and bucket management
- **UsersManager** - User management with analytics
- **SecretsManager** - Environment variables management
- **LogsManager** - Project logs and analytics
- **SuggestionsManager** - Performance and security recommendations

### Navigation System

The manager uses a stack-based navigation system powered by `SheetNavigationContext`. This allows for:

- Breadcrumb navigation
- Deep linking within the manager
- Back/forward navigation
- Mobile-optimized tab navigation

## UI Components

This project uses shadcn/ui components as a foundation for the UI, chosen for their wide adoption and excellent customization capabilities. The components in the `components/ui/` directory are mostly default implementations, making it easy to replace them with your own custom components or copy them as a starting point for your design system.

## Security Considerations

### Important Security Notes

1. **Never expose your Management API token to the client**
2. **Always implement proper authentication checks** in your proxy
3. **Validate project access permissions** for each user
4. **Consider rate limiting** your proxy endpoints

## Customization

### Adding Your Own Managers

You can extend the manager with your own custom panels by modifying the `navigationItems` array in `components/supabase-manager/index.tsx`:

```tsx
// Add to the navigationItems array
{
  title: "My Custom Manager",
  icon: MyIcon,
  component: <MyCustomManager projectRef={projectRef} />,
}
```
