# Interview Platform - PRD

## Problem Statement
Build a modern, responsive Interview Practice Platform where users can sign up, log in, practice mock interviews, and review their recorded answers.

## Tech Stack
- Frontend: React.js, Tailwind CSS, Shadcn UI, qrcode.react
- Backend: FastAPI, Motor (async MongoDB)
- Database: MongoDB
- AI: Gemini 3 Flash via Emergent LLM Key
- Transcription: OpenAI Whisper via Emergent LLM Key
- TTS: Browser SpeechSynthesis API (free)
- Auth: JWT with OTP email verification (Gmail SMTP)
- Email: Gmail SMTP (OTP, Forgot Password, Send Feedback, Contact, Feedback notifications)
- Media: Browser MediaRecorder API, Fullscreen API

## What's Implemented (as of April 15, 2026)

### Authentication
- JWT email/password with OTP email verification (3-step signup)
- Forgot Password flow (email → OTP → new password)
- Gmail SMTP for all emails

### Live Interview (Fullscreen Video Call)
- Fullscreen enforcement — exit = auto-abort
- AI Interviewer "Sarah Mitchell" with TTS
- Preparation timer after TTS → auto-start recording
- Camera feed fix (re-attach on fullscreen)
- Auto-navigate, countdown, stop & submit

### Profile
- Profile picture upload (JPG/PNG/WEBP, shown in navbar)
- Change email with OTP verification
- Name editing
- Interview stats (total, completed, member since)

### Contact & Feedback
- Functional Contact form — sends to admin + copy to user
- Functional Feedback form with star rating — saves to DB + email
- Real user feedback appears in Landing page testimonials carousel

### Other
- Landing page with testimonials carousel (real + static)
- Dashboard with real-time stats refresh
- UPI QR code donations in INR
- Send Feedback to Email (real, not mocked)
- 4-step Role Setup + 2-step Resume Setup wizards
- Whisper transcription, AI feedback, video playback
- Dark/Light mode, responsive design

## Backlog
- P2: AI feedback improvements, rating system
- P3: Populate static footer pages with real content

## Latest Testing (April 15, 2026 - Iteration 11)
- Backend: 27/27 tests passed (100%)
- Frontend: All features verified working (100%)
- Fixed: Whisper transcription file format error (pass file path instead of file object)
- DB state: Wiped clean with 1 seeded test user (test@interviewmaster.com / Test@123)
- Status: READY FOR USER FINAL QA
