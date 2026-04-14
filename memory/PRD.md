# Interview Platform - PRD

## Problem Statement
Build a modern, responsive Interview Practice Platform where users can sign up, log in, practice mock interviews, and review their recorded answers.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Shadcn UI, qrcode.react
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via Emergent LLM Key (questions, feedback)
- **Transcription**: OpenAI Whisper via Emergent LLM Key
- **TTS**: Browser SpeechSynthesis API (free)
- **Auth**: JWT with OTP email verification (Gmail SMTP)
- **Email**: Gmail SMTP (OTP, Forgot Password, Send Feedback)
- **Media**: Browser MediaRecorder API, Fullscreen API

## What's Implemented (as of April 14, 2026)

### Authentication
- JWT email/password auth with OTP email verification (3-step signup)
- Forgot Password flow (email → OTP → new password)
- Gmail SMTP for all emails from arghyanilryzen@gmail.com

### Live Interview (Fullscreen Video Call)
- **Fullscreen enforcement** — interview won't start without fullscreen, exit = auto-abort
- AI Interviewer "Sarah Mitchell" with TTS reads questions aloud
- **Preparation timer** — after TTS ends, countdown (= time_per_question) starts, recording auto-starts at 0
- "Record Now (skip wait)" option during prep
- Countdown timer during recording, auto-submit, manual Stop & Submit
- Auto-navigate to next unanswered question

### Send Feedback to Email (REAL)
- POST /api/interviews/{id}/send-feedback sends formatted HTML email
- Includes performance summary + Q&A feedback per question
- Available from InterviewReview, Dashboard, and InterviewHistory

### Other Features
- Landing page with testimonials carousel (6 reviews)
- Dashboard with real-time stats refresh after delete/abort
- UPI QR code donations (₹29, ₹49, ₹79, ₹99)
- 4-step Role Setup + 2-step Resume Setup wizards
- Whisper transcription, AI feedback, video playback
- Dark/Light mode, responsive design

## Backlog
- **P2**: AI feedback improvements, rating system
- **P3**: Populate static footer pages with real content
