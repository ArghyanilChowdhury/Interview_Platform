import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Video, VideoOff, Mic, MicOff, Play, SkipForward,
  CheckCircle, Loader2, AlertCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getSupportedMimeType() {
  const types = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
  for (const type of types) { if (MediaRecorder.isTypeSupported(type)) return type; }
  return '';
}

export default function LiveInterview() {
  const { interviewId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();

  const [interview, setInterview] = useState(location.state?.interview || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [savingResponse, setSavingResponse] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const isRecordingRef = useRef(false);
  const mountedRef = useRef(true);
  const autoStopRef = useRef(null);
  const recordStartTimeRef = useRef(0);

  const timeLimit = interview?.time_per_question || 120;
  const countdownRef = useRef(0);

  useEffect(() => {
    if (!interview) {
      (async () => {
        try {
          const res = await axios.get(`${API}/interviews/${interviewId}`, { headers: getAuthHeaders(), withCredentials: true });
          setInterview(res.data);
          const answered = new Set((res.data.responses || []).map(r => r.question_index));
          setAnsweredQuestions(answered);
          const firstUnanswered = res.data.questions.findIndex((_, i) => !answered.has(i));
          if (firstUnanswered >= 0) setCurrentIndex(firstUnanswered);
        } catch { toast.error('Failed to load interview'); navigate('/dashboard'); }
      })();
    }
  }, [interview, interviewId, getAuthHeaders, navigate]);

  const initMedia = useCallback(async () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true); setMicOn(true); setMediaReady(true); setMediaError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setMediaError(err.name === 'NotAllowedError' ? 'Camera/microphone access denied. Please allow access in your browser settings.' : err.name === 'NotFoundError' ? 'No camera or microphone found on this device.' : 'Unable to access camera/microphone.');
      setMediaReady(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    initMedia();
    return () => {
      mountedRef.current = false;
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    };
  }, [initMedia]);

  const toggleCamera = () => { if (streamRef.current) { const t = streamRef.current.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setCameraOn(t.enabled); } } };
  const toggleMic = () => { if (streamRef.current) { const t = streamRef.current.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setMicOn(t.enabled); } } };

  // Stop recording helper (used by manual stop AND auto-stop)
  const doStopRecording = useCallback(async (isAutoStop = false) => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();

    await new Promise(resolve => setTimeout(resolve, 500));

    if (isAutoStop) toast.info('Time\'s up! Auto-submitting your answer...');

    setSavingResponse(true);
    const savedIndex = currentIndex;
    const elapsed = Math.floor((Date.now() - recordStartTimeRef.current) / 1000);
    try {
      let recordingPath = null;
      let whisperTranscript = null;
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('file', blob, `recording_${currentIndex}.webm`);
        formData.append('interview_id', interviewId);
        formData.append('question_index', currentIndex.toString());
        const uploadRes = await axios.post(`${API}/recordings/upload`, formData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }, withCredentials: true });
        recordingPath = uploadRes.data.recording_path;
        whisperTranscript = uploadRes.data.transcript;
      }
      const finalTranscript = whisperTranscript || transcriptRef.current || transcript || 'No transcript available';
      await axios.post(`${API}/interviews/${interviewId}/responses`, {
        question_index: currentIndex,
        transcript: finalTranscript,
        recording_path: recordingPath,
        duration: elapsed
      }, { headers: getAuthHeaders(), withCredentials: true });

      setAnsweredQuestions(prev => {
        const next = new Set([...prev, savedIndex]);
        return next;
      });
      toast.success('Response saved!');

      // Auto-navigate to next unanswered question
      if (interview) {
        const totalQ = interview.questions.length;
        setAnsweredQuestions(prev => {
          const answered = new Set([...prev, savedIndex]);
          // Find next unanswered
          let nextIdx = -1;
          for (let i = savedIndex + 1; i < totalQ; i++) {
            if (!answered.has(i)) { nextIdx = i; break; }
          }
          if (nextIdx === -1) {
            // Check earlier questions
            for (let i = 0; i < savedIndex; i++) {
              if (!answered.has(i)) { nextIdx = i; break; }
            }
          }
          if (nextIdx >= 0) {
            setCurrentIndex(nextIdx);
            setTranscript('');
            setCountdown(0);
          }
          return answered;
        });
      }
    } catch { toast.error('Failed to save response'); }
    finally { setSavingResponse(false); }
  }, [currentIndex, interviewId, getAuthHeaders, transcript, interview]);

  const startRecording = () => {
    if (!streamRef.current || !mediaReady) { toast.error('Camera/mic not available. Click "Enable Camera" to retry.'); return; }
    const vt = streamRef.current.getVideoTracks()[0];
    const at = streamRef.current.getAudioTracks()[0];
    if (!vt || vt.readyState === 'ended' || !at || at.readyState === 'ended') { toast.error('Media stream ended. Reinitializing...'); setMediaReady(false); initMedia(); return; }

    chunksRef.current = [];
    transcriptRef.current = '';
    setTranscript('');
    countdownRef.current = timeLimit;
    setCountdown(timeLimit);
    recordStartTimeRef.current = Date.now();

    try {
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
    } catch { toast.error('Failed to start recording.'); return; }

    // Countdown timer — use ref to avoid calling side-effects inside setState
    timerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      const val = countdownRef.current;
      setCountdown(val);
      if (val <= 0) {
        doStopRecording(true);
      }
    }, 1000);

    // Speech recognition
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
        recognition.onresult = (event) => {
          let final = '', interim = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
            else interim += event.results[i][0].transcript;
          }
          transcriptRef.current = final;
          setTranscript(final + interim);
        };
        recognition.onerror = () => {};
        recognition.onend = () => { if (isRecordingRef.current) try { recognition.start(); } catch {} };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {}

    isRecordingRef.current = true;
    setIsRecording(true);
  };

  const nextQuestion = () => {
    if (interview && currentIndex < interview.questions.length - 1) {
      setCurrentIndex(prev => prev + 1); setTranscript(''); setCountdown(0);
    }
  };

  const completeInterview = async () => {
    setCompleting(true);
    try {
      await axios.post(`${API}/interviews/${interviewId}/complete`, {}, { headers: getAuthHeaders(), withCredentials: true });
      toast.success('Interview completed! Generating feedback...');
      navigate(`/interview/${interviewId}/review`);
    } catch { toast.error('Failed to complete interview'); }
    finally { setCompleting(false); }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!interview) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const questions = interview.questions || [];
  const progress = ((answeredQuestions.size) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCurrentAnswered = answeredQuestions.has(currentIndex);
  const allAnswered = answeredQuestions.size >= questions.length;
  const countdownPct = isRecording ? (countdown / timeLimit) * 100 : 0;
  const isLowTime = countdown <= 10 && countdown > 0;

  return (
    <div className="min-h-screen bg-background" data-testid="live-interview-page">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs font-mono">{interview.type === 'role' ? interview.role : 'Resume Interview'}</Badge>
              <span className="text-sm text-muted-foreground">Question {currentIndex + 1} / {questions.length}</span>
            </div>
            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-recording-pulse" />
                  <span className={`text-sm font-mono ${isLowTime ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>{formatTime(countdown)}</span>
                </div>
              )}
              {allAnswered && (
                <Button onClick={completeInterview} disabled={completing} size="sm" className="gap-2" data-testid="complete-interview-btn">
                  {completing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Finish Interview
                </Button>
              )}
            </div>
          </div>
          <Progress value={progress} className="mt-2 h-1" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border" data-testid="question-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">Q{currentIndex + 1}</Badge>
                  {isCurrentAnswered && <Badge className="text-xs gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Answered</Badge>}
                </div>
                <h2 className="text-lg font-semibold font-heading leading-relaxed">{questions[currentIndex]}</h2>
                {/* Countdown bar during recording */}
                {isRecording && (
                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${isLowTime ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${countdownPct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{formatTime(countdown)} remaining</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border" data-testid="transcript-card">
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Live Transcript</p>
                {transcript ? <p className="text-sm leading-relaxed">{transcript}</p> : <p className="text-sm text-muted-foreground italic">{isRecording ? 'Listening... Start speaking' : 'Transcript will appear here when you start recording'}</p>}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              {questions.map((_, i) => (
                <Button key={i} variant={i === currentIndex ? 'default' : answeredQuestions.has(i) ? 'secondary' : 'outline'} size="sm" className="w-9 h-9 p-0 text-xs font-mono" onClick={() => { if (!isRecording) { setCurrentIndex(i); setTranscript(''); setCountdown(0); } }} disabled={isRecording} data-testid={`question-nav-${i}`}>
                  {answeredQuestions.has(i) ? <CheckCircle className="w-3 h-3" /> : i + 1}
                </Button>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-24">
              <Card className="border overflow-hidden" data-testid="video-preview">
                <div className="relative aspect-[4/3] bg-black rounded-md overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`} />
                  {!cameraOn && <div className="absolute inset-0 flex items-center justify-center"><div className="text-center space-y-2"><VideoOff className="w-8 h-8 text-zinc-500 mx-auto" /><p className="text-xs text-zinc-400">{mediaError ? 'Permission needed' : 'Camera off'}</p></div></div>}
                  {isRecording && <div className="absolute top-3 left-3 flex items-center gap-2 glass rounded-md px-3 py-1.5"><div className="w-2 h-2 rounded-full bg-red-500 animate-recording-pulse" /><span className={`text-xs font-mono ${isLowTime ? 'text-red-400' : 'text-white'}`}>{formatTime(countdown)}</span></div>}
                  {isRecording && <div className="absolute bottom-3 left-3 right-3 glass rounded-md px-3 py-2 flex items-center gap-1 justify-center">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="w-1 bg-red-400 rounded-full animate-waveform" style={{ animationDelay: `${i * 0.08}s`, height: '4px' }} />)}</div>}
                </div>
              </Card>

              {mediaError && (
                <div className="flex items-start gap-2 p-3 mt-3 rounded-md bg-destructive/10 border border-destructive/20" data-testid="media-error-banner">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-xs"><p className="text-destructive font-medium">{mediaError}</p><Button variant="link" size="sm" className="h-auto p-0 text-xs text-destructive underline mt-1" onClick={initMedia} data-testid="retry-media-btn">Retry camera access</Button></div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 mt-4">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full" onClick={toggleCamera} data-testid="toggle-camera-btn">{cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}</Button>
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full" onClick={toggleMic} data-testid="toggle-mic-btn">{micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}</Button>

                {!mediaReady && !isRecording ? (
                  <Button size="lg" className="gap-2 rounded-full px-6" onClick={initMedia} data-testid="enable-camera-btn"><Video className="w-4 h-4" /> Enable Camera</Button>
                ) : !isRecording ? (
                  <Button size="lg" className="gap-2 rounded-full px-6 bg-red-500 hover:bg-red-600 text-white" onClick={startRecording} disabled={isCurrentAnswered || savingResponse} data-testid="start-recording-btn">
                    {savingResponse ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Record ({formatTime(timeLimit)})</>}
                  </Button>
                ) : (
                  <Button size="lg" className="gap-2 rounded-full px-6 bg-red-600 hover:bg-red-700 text-white animate-recording-pulse" onClick={() => doStopRecording(false)} data-testid="stop-recording-btn">
                    <CheckCircle className="w-4 h-4" /> Stop &amp; Submit
                  </Button>
                )}

                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full" onClick={nextQuestion} disabled={isRecording || isLastQuestion} data-testid="next-question-btn"><SkipForward className="w-4 h-4" /></Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">
                {!mediaReady ? 'Click "Enable Camera" to start recording' : isRecording ? 'Click "Stop & Submit" to finish early, or wait for auto-submit' : isCurrentAnswered ? 'This question is answered. Navigate to another.' : `Click Record to answer (${formatTime(timeLimit)} per question)`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
