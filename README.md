# GitHub Agent Orchestration Platform

A Ruflo-inspired multi-agent orchestration platform for GitHub workflow automation.

## Overview

This platform implements a hierarchical multi-agent swarm architecture (CEO → Directors → Managers → Workers) for orchestrating complex GitHub operations. Built with Next.js 16, TypeScript, and integrated with GitHub OAuth, OpenRouter AI, and PostgreSQL.

## Features

- **Hierarchical Agent Swarm**: CEO delegates to Directors (Engineering, Security, Product, DevOps, Research, Quality), who manage Worker agents
- **GitHub Integration**: Full REST API access via OAuth (repo, issues, PRs, etc.)
- **Multi-Model AI**: OpenRouter integration with GPT-4o, Claude, Gemini, and more
- **Persistent Memory**: PostgreSQL with Prisma 7 ORM
- **Task Queuing**: BullMQ + Redis for distributed agent execution
- **Real-time Chat**: Streaming AI responses with model selection
- **Agent Visualization**: Hierarchical swarm dashboard with status tracking

## Architecture

```
CEO Agent
  ↓
Director Agents (Engineering, Security, Product, DevOps, Research, Quality)
  ↓
Manager Agents (Specialized by domain)
  ↓
Worker Agents (Task execution units)
```

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required values:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `AUTH_SECRET` and `AUTH_GITHUB_ID/SECRET` (GitHub OAuth)
   - `OPENROUTER_API_KEY` (for AI models)
   - `REDIS_URL` (for BullMQ queues)
   - `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
3. Install dependencies: `npm install`
4. Set up database: `npx prisma migrate dev`
5. Start development: `npm run dev`

## Deployment

The platform can be deployed to:
- Vercel (for Next.js frontend)
- Railway/Render/Docker (for PostgreSQL + Redis)
- Environment variables must be configured in the deployment platform

## GitHub OAuth Setup

1. Create a GitHub OAuth App at: https://github.com/settings/developers
2. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID to `AUTH_GITHUB_ID`
4. Copy Client Secret to `AUTH_GITHUB_SECRET`
5. Required scopes: `user:email`, `read:user`, `repo`, `read:org`

## License

MIT
