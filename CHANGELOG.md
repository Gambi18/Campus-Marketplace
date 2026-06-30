# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MIT License
- `.npmrc` with ignore-scripts and audit-level=high defaults
- Graceful HTTP server shutdown with signal handling
- CSP header in security middleware
- Product existence check before report creation
- Rate limiting on product creation endpoint
- `fadeInUp` CSS animation for Hero heading (replaces framer-motion)
- Debounced search input (300ms)
- Deploy stub job in CI pipeline
- Vitest and React Testing Library as dev dependencies
- Smoke test for root page render
- `test` and `typecheck` npm scripts

### Changed
- Restricted `next.config.js` `remotePatterns` to specific hosts instead of wildcard `**`
- WebSocket concurrent write path: route messages through `client.Send` channel instead of direct `Conn.WriteMessage`
- Email notification goroutine uses `context.WithTimeout` instead of bare `context.Background`
- Hero images migrated from `<img>` to `next/image` with `fill`, `sizes`, and `priority`
- Hero heading animation from framer-motion `motion.h1` to plain CSS `animate-fadeInUp`
- StatCard switched from `import * as LucideIcons` to explicit named imports
- Removed unused `Plus_Jakarta_Sans` font import and `--brand-secondary` CSS variable
- Hero outlined button styles moved from inline `!important` to class `hero-btn-outlined`
- `setTimeout` in pricing page stores reference ID for cleanup on unmount
- `load()` calls in purchases page use proper `await`
- Fragile mutex lock/unlock pattern replaced with closure + `defer`
- All AI boilerplate comments removed across frontend and backend

### Removed
- framer-motion dependency (only used in Hero)
- `Plus_Jakarta_Sans` font (unused)
- `--brand-secondary` from globals.css and tailwind.config.js
- AI-generated numbered step comments and section markers across all handler files

### Security
- Go `x/crypto` updated to latest version
- JWT secret minimum length enforced with startup panic
- `x/crypto` strict minimum version enforced via `replace` directive in go.mod
