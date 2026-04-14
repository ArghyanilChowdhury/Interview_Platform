import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Briefcase, FileText, Play, ArrowRight, Clock,
  CheckCircle, Video, BarChart3, TrendingUp, MoreVertical,
  Trash2, XCircle, Mail
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, answered: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/interviews`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      const interviews = res.data;
      setRecentInterviews(interviews.slice(0, 4));
      const totalAnswered = interviews.reduce((sum, i) => sum + (i.responses?.length || 0), 0);
      setStats({
        total: interviews.length,
        completed: interviews.filter(i => i.status === 'completed').length,
        inProgress: interviews.filter(i => i.status === 'in_progress').length,
        answered: totalAnswered,
      });
    } catch { /* ignore */ }
    setLoading(false);
  }, [getAuthHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteInterview = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      await axios.delete(`${API}/interviews/${id}`, { headers: getAuthHeaders(), withCredentials: true });
      toast.success('Interview deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const sendFeedbackEmail = async (id) => {
    try {
      await axios.post(`${API}/interviews/${id}/send-feedback`, {}, { headers: getAuthHeaders(), withCredentials: true });
      toast.success('Feedback sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send feedback');
    }
  };

  const abortInterview = async (id) => {
    if (!window.confirm('Abort this interview?')) return;
    try {
      await axios.post(`${API}/interviews/${id}/abort`, {}, { headers: getAuthHeaders(), withCredentials: true });
      toast.success('Interview aborted');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to abort'); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="dashboard-page">
      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-heading">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground text-base">Ready to practice? Choose how you'd like to start.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Interviews', value: stats.total, icon: Video, color: 'text-primary' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-500' },
          { label: 'Questions Answered', value: stats.answered, icon: BarChart3, color: 'text-violet-500' },
        ].map((stat, i) => (
          <Card key={i} className="border" data-testid={`stat-card-${i}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bento Grid - Start Interview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Role-Based */}
        <Card
          className="group border cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
          onClick={() => navigate('/interview/role')}
          data-testid="start-role-interview"
        >
          <CardContent className="p-0">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold font-heading mb-1">Role-Based Interview</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Select a job role and practice with AI-generated questions tailored to that position.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Frontend', 'Backend', 'Full Stack', 'DevOps', 'Data Analyst'].map(r => (
                  <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                ))}
              </div>
              <Button className="gap-2 group-hover:gap-3 transition-all" size="sm">
                Start Interview <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resume-Based */}
        <Card
          className="group border cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
          onClick={() => navigate('/interview/resume')}
          data-testid="start-resume-interview"
        >
          <CardContent className="p-0">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-md bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <FileText className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold font-heading mb-1">Resume-Based Interview</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Upload your resume and get personalized questions based on your experience and skills.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['PDF', 'DOCX', 'Personalized', 'AI Analysis'].map(r => (
                  <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                ))}
              </div>
              <Button variant="outline" className="gap-2 group-hover:gap-3 transition-all" size="sm">
                Upload Resume <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Interviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-heading">Recent Interviews</h2>
          {recentInterviews.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1 text-sm" onClick={() => navigate('/history')} data-testid="view-all-history">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <Card key={i} className="border">
                <CardContent className="p-5 space-y-3">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentInterviews.length === 0 ? (
          <Card className="border" data-testid="empty-interviews">
            <CardContent className="py-12 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No interviews yet. Start your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {recentInterviews.map((interview) => (
              <Card
                key={interview.interview_id}
                className="border cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => navigate(
                  interview.status === 'completed'
                    ? `/interview/${interview.interview_id}/review`
                    : interview.status === 'in_progress'
                      ? `/interview/${interview.interview_id}/live`
                      : '#'
                )}
                data-testid={`interview-card-${interview.interview_id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {interview.type === 'role' ? (
                          <Briefcase className="w-4 h-4 text-primary" />
                        ) : (
                          <FileText className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="font-semibold text-sm">
                          {interview.type === 'role' ? interview.role : 'Resume-Based'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(interview.created_at)} · {interview.questions?.length || 0} questions
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <Badge
                        variant={interview.status === 'completed' ? 'default' : interview.status === 'aborted' ? 'destructive' : 'secondary'}
                        className="text-xs capitalize"
                      >
                        {interview.status === 'completed' ? <><CheckCircle className="w-3 h-3 mr-1" /> Done</> : interview.status === 'aborted' ? 'Aborted' : <><Play className="w-3 h-3 mr-1" /> Continue</>}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {interview.status === 'in_progress' && (
                            <DropdownMenuItem onClick={() => abortInterview(interview.interview_id)} className="text-amber-600">
                              <XCircle className="w-4 h-4 mr-2" /> Abort
                            </DropdownMenuItem>
                          )}
                          {interview.status === 'completed' && (
                            <DropdownMenuItem onClick={() => sendFeedbackEmail(interview.interview_id)}>
                              <Mail className="w-4 h-4 mr-2" /> Send Feedback to Email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteInterview(interview.interview_id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
