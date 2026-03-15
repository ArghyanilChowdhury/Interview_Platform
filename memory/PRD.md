# Interview Platform - PRD

## Problem Statement
Build a modern, responsive Interview Practice Platform where users can sign up, log in, practice mock interviews, and review their recorded answers.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via Emergent LLM Key
- **Auth**: JWT + Emergent-managed Google OAuth
- **Media**: Browser MediaRecorder API + Web Speech API

## Core Requirements
1. Authentication (JWT + Google OAuth)
2. Dashboard with stats, interview start, history
3. Role-Based Interviews (select role, level, skills, configure question count/time)
4. Resume-Based Interviews (upload PDF/DOCX)
5. Live Interview Flow (one question at a time, video/audio recording, live transcription, countdown timer, auto-submit)
6. Recording & Review (save recordings, review with transcripts, AI feedback)
7. Modern responsive UI with dark/light mode

## What's Implemented (as of March 15, 2026)
- Full auth system (JWT + Google OAuth)
- Landing page with hero section and footer with 11 static pages
- Dashboard with bento grid layout, real stats, action menus
- 4-step Role Setup wizard (Role → Level → Skills → Configure)
- Resume Setup page with file upload
- Live Interview page with camera/mic, recording, countdown timer, auto-submit, manual stop
- Interview Review page with video playback, transcripts, AI feedback (markdown stripped)
- Interview History page with filter and action menus (Delete, Abort, Send Feedback)
- Backend: All CRUD endpoints, AI question generation, AI feedback/summary, recording upload/serve
- Configurable interviews: num_questions (3-20), time_per_question
- strip_markdown on both backend and frontend
- Profile page

## Mocked Features
- "Send Feedback to Email" button shows toast only (no backend email service)
- Static footer pages (About, Blog, etc.) have placeholder content

## Backlog
- **P1**: Implement "Send Feedback to Email" backend (needs email service integration)
- **P1**: Address speech-to-text accuracy (browser Web Speech API limitations)
- **P2**: AI-generated feedback improvements
- **P2**: Rating system for confidence/communication
- **P3**: Populate static footer pages with real content
