# Beef Quality Assessment System - Frontend

Next.js 14+ frontend application for AI-powered beef quality evaluation through image analysis.

## Technology Stack

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **React 18+** for UI components
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Supabase JS Client** for authentication, database, and storage

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── hooks/                 # Custom React hooks
│   └── useAuth.ts         # Authentication hook
├── lib/                   # Utility functions and clients
│   ├── utils.ts           # Utility functions
│   ├── supabase.ts        # Supabase client
│   └── api.ts             # Backend API client
├── types/                 # TypeScript type definitions
│   └── index.ts           # Shared types
├── public/                # Static assets
├── .env.local.example     # Environment variables template
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies

```

## TypeScript Types

All application types are defined in `types/index.ts`:

- **User**: User authentication data
- **Session**: Authentication session with tokens
- **PredictionResponse**: API response from prediction endpoint
- **Assessment**: Database assessment record
- **AnalyticsData**: Aggregate statistics for dashboard

## Custom Tailwind Configuration

The Tailwind config includes custom quality indicator colors:

- `quality-excellent`: #10b981 (green) - MQS 76-100
- `quality-good`: #84cc16 (lime) - MQS 51-75
- `quality-medium`: #eab308 (yellow) - MQS 26-50
- `quality-poor`: #ef4444 (red) - MQS 0-25

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm installed
- Backend API running (see backend README)
- Supabase project created and configured

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Key Features

### Authentication (`hooks/useAuth.ts`)

The `useAuth` hook provides:
- `signUp(email, password)` - Register new user
- `signIn(email, password)` - Authenticate user
- `signOut()` - End session
- `getAccessToken()` - Retrieve JWT for API calls
- `user` - Current user object
- `session` - Current session
- `loading` - Auth state loading flag

### API Client (`lib/api.ts`)

The API client provides:
- `submitPrediction(file, accessToken)` - Submit image for assessment
- `checkHealth()` - Check backend health status
- Error handling with `APIError` class

### Utility Functions (`lib/utils.ts`)

- `cn()` - Merge Tailwind classes
- `getQualityColor(score)` - Get color based on MQS
- `formatConfidence(confidence)` - Format confidence percentage
- `formatDate(dateString)` - Format ISO date to readable string

## Development Guidelines

### Adding New Pages

Pages are created in the `app/` directory using the App Router:

```tsx
// app/dashboard/page.tsx
export default function Dashboard() {
  return <div>Dashboard</div>
}
```

### Adding New Components

Components should be placed in `components/`:

```tsx
// components/ImageUpload.tsx
"use client"

export function ImageUpload() {
  return <div>Upload Component</div>
}
```

### Using Authentication

```tsx
"use client"

import { useAuth } from "@/hooks/useAuth"

export function ProtectedComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>
  
  return <div>Welcome {user.email}</div>
}
```

### Making API Calls

```tsx
import { submitPrediction } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"

const { getAccessToken } = useAuth()
const token = getAccessToken()

if (token) {
  const result = await submitPrediction(file, token)
  console.log(result.meat_quality_score)
}
```

## Next Steps

After setting up the frontend:

1. **Implement authentication pages** (login, signup)
2. **Create assessment upload page** with image capture/upload
3. **Build results display component** with quality indicators
4. **Implement history page** with assessment list
5. **Create dashboard** with analytics charts
6. **Add error boundaries** for graceful error handling
7. **Implement loading states** for better UX
8. **Add image validation** before upload
9. **Create responsive layouts** for mobile support
10. **Add tests** using Jest and React Testing Library

## Troubleshooting

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed

### Environment variable errors
- Ensure `.env.local` exists and contains all required variables
- Restart the dev server after changing environment variables

### Supabase connection errors
- Verify Supabase URL and anon key are correct
- Check Supabase project is active and accessible

### API connection errors
- Ensure backend is running on the configured port
- Check CORS configuration in backend allows frontend origin
- Verify `NEXT_PUBLIC_API_URL` matches backend URL

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
