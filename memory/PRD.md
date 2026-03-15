# Interview Platform - PRD

## Problem Statement
Build a modern, responsive Interview Practice Platform where users can sign up, log in, practice mock interviews, and review their recorded answers.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via Emergent LLM Key (question generation, feedback)
- **Transcription**: OpenAI Whisper via Emergent LLM Key (accurate speech-to-text)
- **Auth**: JWT + Emergent-managed Google OAuth
- **Media**: Browser MediaRecorder API + Web Speech API (live feedback) + Whisper (saved transcript)

## Core Requirements
1. Authentication (JWT + Google OAuth)
2. Dashboard with stats, interview start, history
3. Role-Based Interviews (4-step wizard: role → level → skills → configure)
4. Resume-Based Interviews (2-step wizard: upload → configure)
5. Live Interview Flow (recording, countdown timer, auto-submit, auto-navigate to next question)
6. Accurate Transcription via Whisper (replaces browser-only speech-to-text)
7. Recording & Review (video playback, transcripts, AI feedback with markdown stripped)
8. Modern responsive UI with dark/light mode

## What's Implemented (as of March 15, 2026)
- Full auth system (JWT + Google OAuth) with back buttons on Login/Signup
- Landing page with hero section and cleaned-up footer (removed Careers, Blog, Press, Help Center)
- Dashboard with bento grid layout, real stats, action menus (Delete, Abort, Send Feedback)
- 4-step Role Setup wizard (Role → Level → Skills → Configure)
- 2-step Resume Setup wizard (Upload → Configure) with num_questions and time_per_question
- Live Interview page: camera/mic, recording, countdown timer, auto-submit, manual Stop & Submit, auto-navigate to next question
- OpenAI Whisper integration for accurate transcription on recording upload
- Interview Review page with video playback, transcripts, AI feedback (markdown stripped)
- Interview History page with filter and action menus
- Profile page
- Backend: All CRUD endpoints, AI question generation, AI feedback/summary, Whisper transcription

## Mocked Features
- "Send Feedback to Email" button shows toast only (no backend email service)
- Static footer pages (About, Contact, etc.) have placeholder content

## Backlog
- **P1**: Implement "Send Feedback to Email" backend (needs email service integration)
- **P2**: AI-generated feedback improvements
- **P2**: Rating system for confidence/communication
- **P3**: Populate static footer pages with real content
