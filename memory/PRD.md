# Interview Platform - PRD

## Problem Statement
Build a modern, responsive Interview Practice Platform where users can sign up, log in, practice mock interviews, and review their recorded answers.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via Emergent LLM Key (question generation, feedback)
- **Transcription**: OpenAI Whisper via Emergent LLM Key (accurate speech-to-text on backend)
- **TTS**: Browser SpeechSynthesis API (AI Interviewer reads questions aloud - free)
- **Auth**: JWT + Emergent-managed Google OAuth
- **Media**: Browser MediaRecorder API for video/audio recording

## What's Implemented (as of March 15, 2026)
- Full auth system (JWT + Google OAuth) with back buttons on Login/Signup
- Landing page with hero section and cleaned-up footer
- Dashboard with bento grid layout, real stats, action menus (Delete, Abort, Send Feedback)
- 4-step Role Setup wizard (Role → Level → Skills → Configure)
- 2-step Resume Setup wizard (Upload → Configure) with num_questions and time_per_question
- **Live Interview page (realistic video call experience)**:
  - AI Interviewer "Sarah Mitchell" with AI-generated professional headshot
  - User's camera feed on right
  - Sarah reads ALL questions aloud via browser TTS (including first question - voices loaded async)
  - "Speaking" indicator with animated waveform on interviewer panel and question card
  - Countdown timer, auto-submit, manual Stop & Submit, auto-navigate to next question
- OpenAI Whisper integration for accurate transcription on recording upload
- Interview Review page with video playback, transcripts, AI feedback (markdown stripped)
- Interview History page with filter and action menus
- Profile page, 7 static footer pages

## Cost Structure
- Gemini 3 Flash + OpenAI Whisper: Emergent Universal Key balance
- Browser TTS, MediaRecorder, MongoDB (local): Free
- Google Auth: Free (Emergent-managed)

## Mocked Features
- "Send Feedback to Email" button shows toast only (no backend email service)
- Static footer pages have placeholder content

## Backlog
- **P1**: Implement "Send Feedback to Email" backend
- **P2**: AI feedback improvements, rating system
- **P3**: Populate static footer pages with real content
