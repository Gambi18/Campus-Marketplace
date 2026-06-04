# Campus Marketplace Frontend

This is a Next.js frontend application for the Campus Marketplace platform.

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: npm

## Project Structure

```
frontend/
├── app/                 # Next.js app directory
│   ├── components/      # Reusable React components
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── public/             # Static assets
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── postcss.config.js   # PostCSS configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm installed

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:
```bash
npm run build
npm start
```

### Linting

Run ESLint:
```bash
npm run lint
```

### Formatting

Format code with Prettier:
```bash
npm run format
```

## Product UX conventions

- **Peer-to-peer:** Students both list and browse; avoid copy that implies separate buyer/seller roles (no role switcher in the navbar).
- **No ratings:** Do not display stars, scores, or review counts.
- **Listing owner:** API fields `seller_id` / `seller_name` are shown in the UI as **Listed by** + student name.

## API Integration

The frontend connects to the backend API at:
- Development: `http://localhost:8080` (configurable via `NEXT_PUBLIC_API_URL`)

## Contributing

1. Create a feature branch
2. Make your changes
3. Format code: `npm run format`
4. Commit and push
5. Open a pull request
