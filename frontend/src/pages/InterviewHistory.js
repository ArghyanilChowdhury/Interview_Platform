import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import axios from 'axios';
import {
  ArrowLeft, Briefcase, FileText, Play, Eye, CheckCircle,
  Clock, Calendar, Loader2, TrendingUp, MoreVertical, Trash2,
  XCircle, Mail
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function InterviewHistory() {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await axios.get(`${API}/interviews`, { headers: getAuthHeaders(), withCredentials: true });
      setInterviews(res.data);
    } catch {}
    setLoading(false);
  };

  const deleteInterview = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this interview? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/interviews/${id}`, { headers: getAuthHeaders(), withCredentials: true });
      setInterviews(prev => prev.filter(i => i.interview_id !== id));
      toast.success('Interview deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const abortInterview = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Abort this interview? It will be marked as aborted and cannot be resumed.')) return;
    try {
      await axios.post(`${API}/interviews/${id}/abort`, {}, { headers: getAuthHeaders(), withCredentials: true });
      setInterviews(prev => prev.map(i => i.interview_id === id ? { ...i, status: 'aborted' } : i));
      toast.success('Interview aborted');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to abort'); }
  };

  const sendFeedbackEmail = (e, interview) => {
    e.stopPropagation();
    toast.success(`Feedback for "${interview.type === 'role' ? interview.role : 'Resume-Based'}" sent to ${user?.email || 'your email'}!`);
  };

  const filtered = filter === 'all' ? interviews : interviews.filter(i => i.status === filter);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const map = {
      completed: { variant: 'default', label: 'Completed' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      aborted: { variant: 'destructive', label: 'Aborted' },
    };
    const s = map[status] || { variant: 'outline', label: status };
    return <Badge variant={s.variant} className="text-xs capitalize">{s.label}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="interview-history-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard"><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">Interview History</h1>
            <p className="text-sm text-muted-foreground">{interviews.length} interviews total</p>
          </div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]" data-testid="history-filter"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="aborted">Aborted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border" data-testid="empty-history">
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><TrendingUp className="w-6 h-6 text-muted-foreground" /></div>
            <div className="text-center"><p className="font-semibold mb-1">No interviews found</p><p className="text-sm text-muted-foreground">Start your first interview to see it here</p></div>
            <Button onClick={() => navigate('/dashboard')} size="sm" className="gap-2">Go to Dashboard</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((interview) => (
            <Card
              key={interview.interview_id}
              className="border cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => navigate(
                interview.status === 'completed' ? `/interview/${interview.interview_id}/review`
                : interview.status === 'in_progress' ? `/interview/${interview.interview_id}/live`
                : '#'
              )}
              data-testid={`history-item-${interview.interview_id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${interview.type === 'role' ? 'bg-primary/10' : 'bg-emerald-500/10'}`}>
                      {interview.type === 'role' ? <Briefcase className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{interview.type === 'role' ? interview.role : 'Resume-Based Interview'}</h3>
                        {getStatusBadge(interview.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(interview.created_at)}</span>
                        <span>{interview.questions?.length || 0} questions</span>
                        <span>{(interview.responses || []).length} answered</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {interview.status === 'completed' && (
                      <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={() => navigate(`/interview/${interview.interview_id}/review`)}>
                        <Eye className="w-3.5 h-3.5" /> Review
                      </Button>
                    )}
                    {interview.status === 'in_progress' && (
                      <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={() => navigate(`/interview/${interview.interview_id}/live`)}>
                        <Play className="w-3.5 h-3.5" /> Continue
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8" data-testid={`menu-${interview.interview_id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {interview.status === 'in_progress' && (
                          <DropdownMenuItem onClick={(e) => abortInterview(e, interview.interview_id)} className="text-amber-600" data-testid={`abort-${interview.interview_id}`}>
                            <XCircle className="w-4 h-4 mr-2" /> Abort Interview
                          </DropdownMenuItem>
                        )}
                        {interview.status === 'completed' && (
                          <DropdownMenuItem onClick={(e) => sendFeedbackEmail(e, interview)} data-testid={`email-${interview.interview_id}`}>
                            <Mail className="w-4 h-4 mr-2" /> Send Feedback to Email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => deleteInterview(e, interview.interview_id)} className="text-destructive" data-testid={`delete-${interview.interview_id}`}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Interview
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
  );
}
