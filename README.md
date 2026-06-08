# AI Task Manager

A full-stack task management application with AI-powered features
built with Next.js 16, Supabase, and Anthropic Claude.

## Live Demo

- URL: https://ai-task-manager-woad.vercel.app
- Test email: test@example.com - (user05@email.com, user06@email.com)
- Test password: password123 - (123456)

## Features

- User authentication with email/password
- Create, edit, delete and track tasks
- Filter tasks by status, priority and category
- AI-powered natural language task creation
- AI task breakdown into actionable subtasks
- AI priority and time estimation suggestions
- Data isolation — each user only sees their own tasks
- CI/CD pipeline with GitHub Actions

## Tech Stack

- Framework: Next.js 16 App Router with TypeScript
- Auth: NextAuth v5 with JWT sessions
- Database: Supabase (PostgreSQL) with Row Level Security
- AI: Anthropic Claude API (claude-sonnet-4-5)
- Styling: Tailwind CSS v3
- Deployment: Vercel with automatic deploys on push
- CI/CD: GitHub Actions — typecheck and lint on every push

## Why This Stack

- Next.js App Router — full stack in one framework, Server Components for fast initial loads
- Supabase — PostgreSQL + Auth + RLS in one free service, data isolation handled at database level
- NextAuth v5 — JWT sessions with httpOnly cookies, secure by default
- Claude API — best structured JSON output for AI features, reliable prompt following

## Architecture

See ARCHITECTURE.md for detailed decisions and trade-offs.

## Local Setup

1. Clone the repository

   ```
   git clone https://github.com/utviklerToni/ai-task-manager
   ```

2. Install dependencies

   ```
   pnpm install
   ```

3. Set up environment variables

   ```
   cp .env.example .env.local
   ```

   Fill in your Supabase, NextAuth and Anthropic API keys

4. Set up Supabase
   Create a project at supabase.com
   Run the SQL schema from ARCHITECTURE.md

5. Run development server
   ```
   pnpm dev
   ```

## Deployment

This app is deployed on Vercel with automatic deployments via GitHub Actions.

### Deploy Your Own Instance

1. Push your code to GitHub

2. Go to vercel.com and import your repository
   Vercel auto-detects Next.js — no config needed

3. Add all environment variables from .env.example in Vercel project settings

4. Update these two variables to your Vercel URL:

   ```
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

5. Update Supabase allowed URLs:
   Go to Supabase → Authentication → URL Configuration
   Add your Vercel URL to Site URL and Redirect URLs

6. Deploy — Vercel builds and deploys automatically

### CI/CD Pipeline

Every push to master triggers GitHub Actions which runs:

- TypeScript type check
- ESLint linting

Vercel only deploys after CI passes.

## Environment Variables

See .env.example for all required variables.
