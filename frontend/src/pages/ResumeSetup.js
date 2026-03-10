import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { FileText, Upload, ArrowLeft, ArrowRight, Loader2, X, CheckCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ResumeSetup() {
  const [file, setFile] = useState(null);
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

  const startInterview = async () => {
    if (!file) {
      toast.error('Please upload your resume');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${API}/interviews/start-resume`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      toast.success('Interview started!');
      navigate(`/interview/${res.data.interview_id}/live`, {
        state: { interview: res.data }
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="resume-setup-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Upload Resume</h1>
          <p className="text-sm text-muted-foreground">Get personalized interview questions from your resume</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Upload Area */}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-destructive"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  data-testid="remove-file-btn"
                >
                  <X className="w-3 h-3" /> Remove
                </Button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">
                    Drop your resume here or <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PDF, DOC, DOCX (max 10MB)
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-md bg-muted/50 border">
          <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How it works</p>
            <p>Your resume will be analyzed by AI to extract skills, projects, and experience. Interview questions will be personalized based on your background.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={startInterview}
            disabled={!file || loading}
            className="gap-2 min-w-[160px]"
            data-testid="start-resume-interview-btn"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Start Interview <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
