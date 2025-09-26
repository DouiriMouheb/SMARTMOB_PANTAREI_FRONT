# SmartMob Pantarei Frontend

Modern React application built with Vite, TypeScript, and Tailwind CSS v4.

## Tech Stack

- **React 19.1.1** - Latest React with concurrent features
- **Vite 7.1.2** - Fast build tool and dev server
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **DM Sans** - Beautiful Google Font

## Key Dependencies

- **@tailwindcss/vite** (v4.1.11) - Tailwind CSS v4 Vite plugin
- **lucide-react** (v0.525.0) - Beautiful icon library
- **react-router-dom** (v7.7.0) - Client-side routing
- **react-hot-toast** (v2.5.2) - Elegant notifications
- **@microsoft/signalr** (v9.0.6) - Real-time communication
- **oidc-client-ts** & **react-oidc-context** (v3.3.0) - Authentication
- **@zxing/browser** (v0.1.5) - Barcode scanning capabilities

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API services and utilities
├── layouts/       # Layout components
├── types/         # TypeScript type definitions
└── assets/        # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

## Features

- ✅ **Modern React 19.1.1** with concurrent features
- ✅ **Vite 7.1.2** for lightning-fast development
- ✅ **Tailwind CSS v4** with custom animations
- ✅ **TypeScript** for type safety
- ✅ **DM Sans font** integration
- ✅ **React Router** for client-side routing
- ✅ **Hot Toast** notifications
- ✅ **SignalR** for real-time features
- ✅ **OIDC authentication** ready
- ✅ **Barcode scanning** capabilities
- ✅ **Lucide React** icons

## Configuration

### Tailwind CSS

The project uses Tailwind CSS v4 with custom configuration including:
- DM Sans font family
- Custom animations (fade-in, slide-up, pulse-slow)
- Custom keyframes for smooth transitions

### Authentication

OIDC authentication is pre-configured with `oidc-client-ts` and `react-oidc-context`. Configure your identity provider settings in the appropriate service files.
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
