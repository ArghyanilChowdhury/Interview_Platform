import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';
import {
  FileText, Upload, ArrowLeft, ArrowRight, Loader2, X, CheckCircle,
  Sparkles, Clock, Hash
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TOTAL_STEPS = 2;

export default function ResumeSetup() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState('7');
  const [timePerQuestion, setTimePerQuestion] = useState('120');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const canProceed = () => {
    if (step === 1) return !!file;
    if (step === 2) return true;
    return false;
  };

  const nextStep = () => { if (canProceed() && step < TOTAL_STEPS) setStep(s => s + 1); };
  const prevStep = () => { if (step > 1) setStep(s => s - 1); else navigate('/dashboard'); };

  const timeLabel = { '30': '30 seconds', '60': '1 minute', '90': '1.5 minutes', '120': '2 minutes', '180': '3 minutes', '300': '5 minutes' };

  const startInterview = async () => {
    if (!file) { toast.error('Please upload your resume'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('num_questions', numQuestions);
      formData.append('time_per_question', timePerQuestion);

      const res = await axios.post(`${API}/interviews/start-resume`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      toast.success('Interview started!');
      navigate(`/interview/${res.data.interview_id}/live`, { state: { interview: res.data } });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const progressValue = (step / TOTAL_STEPS) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="resume-setup-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={prevStep} data-testid="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            {step === 1 ? 'Upload Resume' : 'Configure Interview'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1 ? 'Get personalized interview questions from your resume' : 'Set the number of questions and time limit'}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono shrink-0">Step {step} of {TOTAL_STEPS}</Badge>
      </div>

      <Progress value={progressValue} className="h-1.5" data-testid="setup-progress" />

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card
            className={`border-2 border-dashed transition-all duration-200 ${
              dragOver ? 'border-primary bg-primary/5' : file ? 'border-emerald-500' : 'hover:border-primary/50'
            }`}
          >
            <CardContent
              className="p-10 flex flex-col items-center gap-4 cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              data-testid="resume-upload-area"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                data-testid="resume-file-input"
              />
              {file ? (
                <>
                  <div className="w-14 h-14 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={(e) => { e.stopPropagation(); setFile(null); }} data-testid="remove-file-btn">
                    <X className="w-3 h-3" /> Remove
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">Drop your resume here or <span className="text-primary">browse</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOC, DOCX (max 10MB)</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 p-4 rounded-md bg-muted/50 border">
            <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How it works</p>
              <p>Your resume will be analyzed by AI to extract skills, projects, and experience. Interview questions will be personalized based on your background.</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <div className="max-w-xl mx-auto space-y-8" data-testid="step-config">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Number of Questions</Label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger data-testid="num-questions-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['3','5','7','10','12','15'].map(n => (
                    <SelectItem key={n} value={n}>{n} questions</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Choose how many questions you want to answer</p>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Time Per Question</Label>
              <Select value={timePerQuestion} onValueChange={setTimePerQuestion}>
                <SelectTrigger data-testid="time-per-question-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[['30','30 seconds'],['60','1 minute'],['90','1.5 minutes'],['120','2 minutes'],['180','3 minutes'],['300','5 minutes']].map(([v,l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Recording auto-submits when time runs out</p>
            </div>
          </div>

          <Card className="border bg-primary/5" data-testid="setup-summary">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold font-heading">Interview Preview</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-muted-foreground">
                    <span>Type: <span className="text-foreground font-medium">Resume-Based</span></span>
                    <span>Resume: <span className="text-foreground font-medium">{file?.name || 'N/A'}</span></span>
                    <span>Questions: <span className="text-foreground font-medium">{numQuestions}</span></span>
                    <span>Time each: <span className="text-foreground font-medium">{timeLabel[timePerQuestion] || timePerQuestion + 's'}</span></span>
                  </div>
                  <p className="text-muted-foreground">Questions will be generated from your resume content.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          {step === 1 && (file ? `Selected: ${file.name}` : 'Upload your resume to continue')}
          {step === 2 && 'Review your settings and start the interview'}
        </p>
        {step < TOTAL_STEPS ? (
          <Button onClick={nextStep} disabled={!canProceed()} className="gap-2 min-w-[140px]" data-testid="next-step-btn">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={startInterview} disabled={loading} className="gap-2 min-w-[160px]" data-testid="start-resume-interview-btn">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start Interview <ArrowRight className="w-4 h-4" /></>}
          </Button>
        )}
      </div>
    </div>
  );
}
