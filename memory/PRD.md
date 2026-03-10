# InterviewMaster - Product Requirements Document

## Problem Statement
Build a modern, responsive Interview Practice Platform where candidates can sign up, log in, practice mock interviews (role-based and resume-based), record answers via webcam/microphone, and review recordings with AI-generated feedback.

## Architecture
- **Frontend**: React.js + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via Emergent LLM key
- **Auth**: JWT (email/password) + Emergent Google OAuth
- **Speech-to-Text**: Browser Web Speech API
- **Recording**: Browser MediaRecorder API

## User Personas
1. **Job Seeker** - Wants to practice technical/behavioral interviews
2. **Career Changer** - Needs role-specific interview practice
3. **Student** - Preparing for first job interviews

## Core Requirements (Static)
- User authentication (signup, login, logout)
- Role-based mock interviews (6 roles)
- Resume-based mock interviews (PDF/DOCX upload)
- AI-generated interview questions (Gemini 3 Flash)
- Webcam/mic recording per question
- Speech-to-text transcription (Web Speech API)
- AI feedback on each answer
- Interview review with video playback
- Interview history
- Profile management
- Dark/Light mode toggle

## What's Been Implemented (March 10, 2026)
- Full authentication system (JWT + Google OAuth)
- Landing page with hero, features, CTA
- Candidate dashboard with Bento grid layout
- Role-based interview setup (6 roles)
- Resume upload + AI parsing interview setup
- Live interview page with split view (question + video)
- Recording with MediaRecorder + Web Speech API transcription
- Interview completion with AI feedback generation
- Interview review page with video playback + AI feedback
- Interview history with filtering
- Profile page with stats and edit
- Dark/Light mode toggle
- Responsive design with Plus Jakarta Sans typography

## Prioritized Backlog
### P0 (Done)
- Auth, Dashboard, Role/Resume interviews, Recording, Review, History

### P1 (Next Phase)
- Answer confidence/communication rating (numeric scores)
- Timer per answer with configurable time limits
- Progress bar improvements during interview
- Better error handling for media permissions

### P2 (Future)
- Admin dashboard for analytics
- Interview sharing/export functionality
- Multiple language support
- Practice streaks and gamification
- Comparison between interview attempts

## Next Tasks
1. Add numeric confidence/communication ratings to AI feedback
2. Add configurable timer limits per question
3. Improve mobile experience for live interview page
4. Add interview session export (PDF report)
