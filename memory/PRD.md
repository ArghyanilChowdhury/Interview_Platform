# Interview Platform - PRD

## Problem Statement
Build a modern, responsive Interview Practice Platform where users can sign up, log in, practice mock interviews, and review their recorded answers.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Shadcn UI, qrcode.react
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via Emergent LLM Key (question generation, feedback)
- **Transcription**: OpenAI Whisper via Emergent LLM Key
- **TTS**: Browser SpeechSynthesis API (free)
- **Auth**: JWT with OTP email verification (Gmail SMTP)
- **Media**: Browser MediaRecorder API

## What's Implemented (as of April 14, 2026)

### Authentication
- JWT-based email/password auth
- **OTP email verification on signup** (3-step: email → OTP → name+password)
- **Forgot Password** flow (email → OTP → new password)
- Gmail SMTP for sending OTPs from arghyanilryzen@gmail.com
- Google login removed per user request

### Landing Page
- Hero section, feature highlights
- **Testimonials carousel** (6 reviews, auto-scroll, prev/next controls)
- Cleaned-up footer (About Us, Contact, Donate, Feedback, Privacy, Terms, Cookies)
- All emails updated to arghyanilryzen@gmail.com

### Dashboard & History
- Bento grid stats (Total, Completed, In Progress, Questions Answered)
- Action menus (Delete, Abort, Send Feedback)
- **Real-time data refresh** after delete/abort actions

### Interview Setup
- 4-step Role Setup wizard (Role → Level → Skills → Configure)
- 2-step Resume Setup wizard (Upload → Configure)
- Configurable: num_questions (3-20), time_per_question

### Live Interview
- AI Interviewer "Sarah Mitchell" with AI-generated headshot
- **Text-to-Speech** reads questions aloud (browser SpeechSynthesis)
- Countdown timer, auto-submit, manual Stop & Submit
- Auto-navigate to next unanswered question

### Recording & Review
- Video/audio recording via MediaRecorder API
- Whisper transcription on backend
- AI feedback & summary with markdown stripped

### Donate Page
- 4 tiers in INR: ₹29, ₹49, ₹79, ₹99
- **UPI QR codes** (auto-filled amount, UPI ID: sudeshnachowdhury1071974@oksbi)

### Other
- "Made with Emergent" badge hidden via CSS + MutationObserver
- Back buttons on Login/Signup pages
- Dark/Light mode toggle

## Mocked Features
- "Send Feedback to Email" button shows toast only (no backend email service)
- Static footer pages have placeholder content

## Backlog
- **P1**: Implement "Send Feedback to Email" backend
- **P2**: AI feedback improvements, rating system
- **P3**: Populate static footer pages with real content
