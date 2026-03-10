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
  Video, VideoOff, Mic, MicOff, Play, Square, SkipForward,
  CheckCircle, Clock, Loader2, AlertCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LiveInterview() {
  const { interviewId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();

  const [interview, setInterview] = useState(location.state?.interview || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [transcript, setTranscript] = useState('');
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

  // Fetch interview data if not passed via state
  useEffect(() => {
    if (!interview) {
      (async () => {
        try {
          const res = await axios.get(`${API}/interviews/${interviewId}`, {
            headers: getAuthHeaders(),
            withCredentials: true
          });
          setInterview(res.data);
          // Calculate which questions are already answered
          const answered = new Set((res.data.responses || []).map(r => r.question_index));
          setAnsweredQuestions(answered);
          // Start from first unanswered question
          const firstUnanswered = res.data.questions.findIndex((_, i) => !answered.has(i));
          if (firstUnanswered >= 0) setCurrentIndex(firstUnanswered);
        } catch {
          toast.error('Failed to load interview');
          navigate('/dashboard');
        }
      })();
    }
  }, [interview, interviewId, getAuthHeaders, navigate]);

  // Start camera/mic
  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setMicOn(true);
    } catch (err) {
      toast.error('Please allow camera and microphone access');
    }
  }, []);

  useEffect(() => {
    startMedia();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [startMedia]);

  // Toggle camera
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  };

  // Toggle mic
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) {
      toast.error('Camera/mic not available');
      return;
    }

    chunksRef.current = [];
    transcriptRef.current = '';
    setTranscript('');
    setTimer(0);

    // Start MediaRecorder
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9,opus' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current = recorder;
    recorder.start(1000);

    // Start timer
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);

    // Start Speech Recognition
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let final = '';
          let interim = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          transcriptRef.current = final;
          setTranscript(final + interim);
        };

        recognition.onerror = () => {};
        recognition.onend = () => {
          // Restart if still recording
          if (isRecording) {
            try { recognition.start(); } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {}

    setIsRecording(true);
  };

  // Stop recording
  const stopRecording = async () => {
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Wait for final data
    await new Promise(resolve => setTimeout(resolve, 500));

    // Upload recording
    setSavingResponse(true);
    try {
      let recordingPath = null;

      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('file', blob, `recording_${currentIndex}.webm`);
        formData.append('interview_id', interviewId);
        formData.append('question_index', currentIndex.toString());

        const uploadRes = await axios.post(`${API}/recordings/upload`, formData, {
          headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        recordingPath = uploadRes.data.recording_path;
      }

      // Save response
      await axios.post(`${API}/interviews/${interviewId}/responses`, {
        question_index: currentIndex,
        transcript: transcriptRef.current || transcript || 'No transcript available',
        recording_path: recordingPath,
        duration: timer
      }, {
        headers: getAuthHeaders(),
        withCredentials: true
      });

      setAnsweredQuestions(prev => new Set([...prev, currentIndex]));
      toast.success('Response saved!');
    } catch (err) {
      toast.error('Failed to save response');
    } finally {
      setSavingResponse(false);
    }
  };

  // Navigate questions
  const nextQuestion = () => {
    if (interview && currentIndex < interview.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTranscript('');
      setTimer(0);
    }
  };

  const completeInterview = async () => {
    setCompleting(true);
    try {
      await axios.post(`${API}/interviews/${interviewId}/complete`, {}, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      toast.success('Interview completed! Generating feedback...');
      navigate(`/interview/${interviewId}/review`);
    } catch {
      toast.error('Failed to complete interview');
    } finally {
      setCompleting(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const questions = interview.questions || [];
  const progress = ((answeredQuestions.size) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCurrentAnswered = answeredQuestions.has(currentIndex);
  const allAnswered = answeredQuestions.size >= questions.length;

  return (
    <div className="min-h-screen bg-background" data-testid="live-interview-page">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs font-mono">
                {interview.type === 'role' ? interview.role : 'Resume Interview'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-recording-pulse" />
                  <span className="text-sm font-mono text-red-500">{formatTime(timer)}</span>
                </div>
              )}
              {allAnswered && (
                <Button
                  onClick={completeInterview}
                  disabled={completing}
                  size="sm"
                  className="gap-2"
                  data-testid="complete-interview-btn"
                >
                  {completing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  Finish Interview
                </Button>
              )}
            </div>
          </div>
          <Progress value={progress} className="mt-2 h-1" />
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Question & Transcript */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question */}
            <Card className="border" data-testid="question-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    Q{currentIndex + 1}
                  </Badge>
                  {isCurrentAnswered && (
                    <Badge className="text-xs gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Answered
                    </Badge>
                  )}
                </div>
                <h2 className="text-lg font-semibold font-heading leading-relaxed">
                  {questions[currentIndex]}
                </h2>
              </CardContent>
            </Card>

            {/* Transcript */}
            <Card className="border" data-testid="transcript-card">
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Live Transcript
                </p>
                {transcript ? (
                  <p className="text-sm leading-relaxed">{transcript}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {isRecording ? 'Listening... Start speaking' : 'Transcript will appear here when you start recording'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Question Navigation */}
            <div className="flex flex-wrap gap-2">
              {questions.map((_, i) => (
                <Button
                  key={i}
                  variant={i === currentIndex ? 'default' : answeredQuestions.has(i) ? 'secondary' : 'outline'}
                  size="sm"
                  className="w-9 h-9 p-0 text-xs font-mono"
                  onClick={() => { if (!isRecording) setCurrentIndex(i); setTranscript(''); setTimer(0); }}
                  disabled={isRecording}
                  data-testid={`question-nav-${i}`}
                >
                  {answeredQuestions.has(i) ? <CheckCircle className="w-3 h-3" /> : i + 1}
                </Button>
              ))}
            </div>
          </div>

          {/* Right: Video Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-24">
              {/* Video Preview */}
              <Card className="border overflow-hidden" data-testid="video-preview">
                <div className="relative aspect-[4/3] bg-black rounded-md overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`}
                  />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <VideoOff className="w-8 h-8 text-zinc-500 mx-auto" />
                        <p className="text-xs text-zinc-400">Camera off</p>
                      </div>
                    </div>
                  )}

                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 glass rounded-md px-3 py-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-recording-pulse" />
                      <span className="text-xs text-white font-mono">{formatTime(timer)}</span>
                    </div>
                  )}

                  {/* Waveform */}
                  {isRecording && (
                    <div className="absolute bottom-3 left-3 right-3 glass rounded-md px-3 py-2 flex items-center gap-1 justify-center">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-400 rounded-full animate-waveform"
                          style={{
                            animationDelay: `${i * 0.08}s`,
                            height: '4px'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={toggleCamera}
                  data-testid="toggle-camera-btn"
                >
                  {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={toggleMic}
                  data-testid="toggle-mic-btn"
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>

                {!isRecording ? (
                  <Button
                    size="lg"
                    className="gap-2 rounded-full px-6 bg-red-500 hover:bg-red-600 text-white"
                    onClick={startRecording}
                    disabled={isCurrentAnswered || savingResponse}
                    data-testid="start-recording-btn"
                  >
                    {savingResponse ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><Play className="w-4 h-4" /> Record</>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="destructive"
                    className="gap-2 rounded-full px-6"
                    onClick={stopRecording}
                    data-testid="stop-recording-btn"
                  >
                    <Square className="w-4 h-4" /> Stop
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={nextQuestion}
                  disabled={isRecording || isLastQuestion}
                  data-testid="next-question-btn"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              {/* Status hint */}
              <p className="text-xs text-muted-foreground text-center mt-3">
                {isRecording
                  ? 'Recording in progress... Click Stop when finished'
                  : isCurrentAnswered
                    ? 'This question has been answered. Navigate to another.'
                    : 'Click Record to start answering'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
