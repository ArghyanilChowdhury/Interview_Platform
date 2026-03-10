import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import {
  ArrowLeft, Play, CheckCircle, XCircle, TrendingUp, Lightbulb,
  MessageSquare, Video, Clock, Loader2, BarChart3, Download
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function InterviewReview() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeResponse, setActiveResponse] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/interviews/${interviewId}`, {
          headers: getAuthHeaders(),
          withCredentials: true
        });
        setInterview(res.data);
      } catch {
        toast.error('Failed to load interview');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId, getAuthHeaders, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="review-loading">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!interview) return null;

  const questions = interview.questions || [];
  const responses = interview.responses || [];
  const activeResp = responses[activeResponse];
  const activeQuestion = activeResp ? questions[activeResp.question_index] : questions[0];

  const formatDuration = (s) => {
    if (!s) return '0:00';
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="interview-review-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">Interview Review</h1>
            <p className="text-sm text-muted-foreground">
              {interview.type === 'role' ? interview.role : 'Resume-Based'} · {questions.length} questions
            </p>
          </div>
        </div>
        <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'} className="text-xs capitalize">
          {interview.status}
        </Badge>
      </div>

      {/* Summary Card */}
      {interview.summary && (
        <Card className="border bg-primary/5" data-testid="interview-summary">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-2 font-heading">Performance Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{interview.summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Questions & Responses */}
      <Tabs defaultValue="responses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="responses" data-testid="tab-responses">Responses ({responses.length})</TabsTrigger>
          <TabsTrigger value="questions" data-testid="tab-questions">All Questions ({questions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-6">
          {responses.length === 0 ? (
            <Card className="border">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No responses recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Response List */}
              <div className="space-y-2">
                {responses.map((resp, i) => (
                  <Card
                    key={i}
                    className={`border cursor-pointer transition-all duration-200 ${
                      activeResponse === i ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'
                    }`}
                    onClick={() => setActiveResponse(i)}
                    data-testid={`response-item-${i}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-mono">
                            Q{resp.question_index + 1}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDuration(resp.duration)}
                          </span>
                        </div>
                        {resp.recording_path && (
                          <Video className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {resp.transcript || 'No transcript'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active Response Detail */}
              <div className="lg:col-span-2 space-y-4">
                {activeResp && (
                  <>
                    {/* Question */}
                    <Card className="border">
                      <CardContent className="p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Question</p>
                        <p className="text-base font-medium leading-relaxed">{activeQuestion}</p>
                      </CardContent>
                    </Card>

                    {/* Video Playback */}
                    {activeResp.recording_path && (
                      <Card className="border overflow-hidden" data-testid="recording-playback">
                        <div className="aspect-video bg-black rounded-t-md">
                          <video
                            key={activeResp.recording_path}
                            controls
                            className="w-full h-full"
                            src={`${BACKEND}${activeResp.recording_path}`}
                          >
                            Your browser does not support video playback.
                          </video>
                        </div>
                      </Card>
                    )}

                    {/* Transcript */}
                    <Card className="border">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transcript</p>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {activeResp.transcript || 'No transcript available'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* AI Feedback */}
                    {activeResp.feedback && (
                      <Card className="border" data-testid="ai-feedback">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Feedback</p>
                          </div>
                          <p className="text-sm leading-relaxed">{activeResp.feedback}</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {questions.map((q, i) => {
            const resp = responses.find(r => r.question_index === i);
            return (
              <Card key={i} className="border" data-testid={`question-review-${i}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-xs font-mono ${
                      resp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {resp ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-relaxed">{q}</p>
                      {resp && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Answered · {formatDuration(resp.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
