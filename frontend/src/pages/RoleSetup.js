import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Briefcase, Code, Server, Layers, Database, Settings, Users,
  ArrowRight, ArrowLeft, Loader2, CheckCircle, GraduationCap,
  Zap, Award, Sparkles, Clock, Hash
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const roles = [
  { name: 'Frontend Developer', icon: Code, desc: 'React, CSS, JavaScript, UI/UX' },
  { name: 'Backend Developer', icon: Server, desc: 'APIs, Databases, System Design' },
  { name: 'Full Stack Developer', icon: Layers, desc: 'End-to-end web development' },
  { name: 'Data Analyst', icon: Database, desc: 'SQL, Python, Data Visualization' },
  { name: 'DevOps Engineer', icon: Settings, desc: 'CI/CD, Docker, Cloud Infrastructure' },
  { name: 'HR Interview', icon: Users, desc: 'Behavioral, Cultural Fit, Leadership' },
];

const levels = [
  { value: 'beginner', label: 'Beginner', icon: GraduationCap, desc: '0-1 years experience. Learning the fundamentals and building first projects.' },
  { value: 'intermediate', label: 'Intermediate', icon: Zap, desc: '2-4 years experience. Comfortable with core concepts, building production apps.' },
  { value: 'advanced', label: 'Advanced', icon: Award, desc: '5+ years experience. Deep expertise, system design, and leadership skills.' },
];

const skillsByRole = {
  'Frontend Developer': ['React.js', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Redux/State Management', 'REST APIs', 'GraphQL', 'Testing (Jest/Cypress)', 'Performance Optimization', 'Responsive Design', 'Accessibility (a11y)', 'Next.js/SSR', 'Webpack/Bundlers'],
  'Backend Developer': ['Node.js', 'Python', 'Java', 'Go', 'REST API Design', 'GraphQL', 'SQL Databases', 'NoSQL (MongoDB)', 'Redis/Caching', 'Docker', 'Authentication/Auth', 'Microservices', 'Message Queues', 'System Design', 'Testing', 'Cloud Services (AWS/GCP)'],
  'Full Stack Developer': ['React.js', 'Node.js', 'Python', 'TypeScript', 'SQL Databases', 'NoSQL (MongoDB)', 'REST APIs', 'GraphQL', 'Docker', 'CI/CD', 'Cloud Deployment', 'Authentication', 'System Design', 'Testing', 'Performance Optimization', 'DevOps Basics'],
  'Data Analyst': ['SQL', 'Python', 'R', 'Excel/Sheets', 'Tableau', 'Power BI', 'Pandas/NumPy', 'Data Cleaning', 'Statistical Analysis', 'Data Visualization', 'ETL Pipelines', 'Machine Learning Basics', 'A/B Testing', 'Business Intelligence', 'Data Storytelling', 'BigQuery/Snowflake'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD Pipelines', 'Jenkins/GitHub Actions', 'Linux Administration', 'Monitoring (Prometheus/Grafana)', 'Ansible/Chef', 'Networking', 'Security Best Practices', 'Shell Scripting', 'GitOps', 'Incident Management'],
  'HR Interview': ['Leadership', 'Teamwork', 'Communication', 'Problem Solving', 'Conflict Resolution', 'Time Management', 'Adaptability', 'Decision Making', 'Project Management', 'Cultural Fit', 'Career Goals', 'Work-Life Balance', 'Salary Negotiation', 'Remote Work', 'Cross-functional Collaboration', 'Mentoring'],
};

const TOTAL_STEPS = 4;

export default function RoleSetup() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [numQuestions, setNumQuestions] = useState('7');
  const [timePerQuestion, setTimePerQuestion] = useState('120');
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : prev.length < 8 ? [...prev, skill] : prev
    );
  };

  const canProceed = () => {
    if (step === 1) return !!selectedRole;
    if (step === 2) return !!selectedLevel;
    if (step === 3) return selectedSkills.length >= 2;
    if (step === 4) return true;
    return false;
  };

  const nextStep = () => { if (canProceed() && step < TOTAL_STEPS) setStep(s => s + 1); };
  const prevStep = () => { if (step > 1) setStep(s => s - 1); else navigate('/dashboard'); };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/interviews/start`, {
        type: 'role',
        role: selectedRole,
        experience_level: selectedLevel,
        skills: selectedSkills,
        num_questions: parseInt(numQuestions),
        time_per_question: parseInt(timePerQuestion),
      }, { headers: getAuthHeaders(), withCredentials: true });
      toast.success('Interview started!');
      navigate(`/interview/${res.data.interview_id}/live`, { state: { interview: res.data } });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const progressValue = (step / TOTAL_STEPS) * 100;
  const availableSkills = selectedRole ? skillsByRole[selectedRole] || [] : [];
  const timeLabel = { '30': '30 seconds', '60': '1 minute', '90': '1.5 minutes', '120': '2 minutes', '180': '3 minutes', '300': '5 minutes' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="role-setup-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={prevStep} data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            {step === 1 && 'Choose Your Role'}
            {step === 2 && 'Experience Level'}
            {step === 3 && 'Select Your Skills'}
            {step === 4 && 'Configure Interview'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1 && 'Select the position you\'re preparing for'}
            {step === 2 && 'Tell us about your experience level'}
            {step === 3 && 'Pick 2-8 skills you want to be tested on'}
            {step === 4 && 'Set the number of questions and time limit'}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono shrink-0">Step {step} of {TOTAL_STEPS}</Badge>
      </div>

      <Progress value={progressValue} className="h-1.5" data-testid="setup-progress" />

      {/* Step 1: Role */}
      {step === 1 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children" data-testid="step-role">
          {roles.map((role) => (
            <Card key={role.name} className={`border cursor-pointer transition-all duration-200 animate-fade-in-up ${selectedRole === role.name ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`} onClick={() => { setSelectedRole(role.name); setSelectedSkills([]); }} data-testid={`role-card-${role.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 transition-colors ${selectedRole === role.name ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><role.icon className="w-5 h-5" /></div>
                  <div className="space-y-1"><h3 className="font-semibold text-sm">{role.name}</h3><p className="text-xs text-muted-foreground">{role.desc}</p></div>
                </div>
                {selectedRole === role.name && <Badge className="mt-3 text-xs gap-1"><CheckCircle className="w-3 h-3" /> Selected</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Level */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-4" data-testid="step-level">
          {levels.map((level) => (
            <Card key={level.value} className={`border cursor-pointer transition-all duration-200 ${selectedLevel === level.value ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`} onClick={() => setSelectedLevel(level.value)} data-testid={`level-card-${level.value}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors ${selectedLevel === level.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><level.icon className="w-6 h-6" /></div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{level.label}</h3>
                      {selectedLevel === level.value && <Badge className="text-xs gap-1"><CheckCircle className="w-3 h-3" /> Selected</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{level.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 3: Skills */}
      {step === 3 && (
        <div className="space-y-6" data-testid="step-skills">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{selectedSkills.length} of 8 skills selected (minimum 2)</p>
            {selectedSkills.length > 0 && <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedSkills([])} data-testid="clear-skills-btn">Clear all</Button>}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {availableSkills.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button key={skill} onClick={() => toggleSkill(skill)} className={`px-3.5 py-2 rounded-md text-sm font-medium border transition-all duration-150 ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent'}`} data-testid={`skill-${skill.toLowerCase().replace(/[\s\/().]+/g, '-')}`}>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}{skill}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Configure */}
      {step === 4 && (
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

          {/* Summary */}
          <Card className="border bg-primary/5" data-testid="setup-summary">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold font-heading">Interview Preview</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-muted-foreground">
                    <span>Role: <span className="text-foreground font-medium">{selectedRole}</span></span>
                    <span>Level: <span className="text-foreground font-medium capitalize">{selectedLevel}</span></span>
                    <span>Questions: <span className="text-foreground font-medium">{numQuestions}</span></span>
                    <span>Time each: <span className="text-foreground font-medium">{timeLabel[timePerQuestion] || timePerQuestion + 's'}</span></span>
                  </div>
                  <p className="text-muted-foreground">
                    Focused on {selectedSkills.slice(0, 3).join(', ')}{selectedSkills.length > 3 ? ` and ${selectedSkills.length - 3} more` : ''}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          {step === 1 && (selectedRole ? `Selected: ${selectedRole}` : 'Select a role to continue')}
          {step === 2 && (selectedLevel ? `Level: ${selectedLevel}` : 'Choose your experience level')}
          {step === 3 && (selectedSkills.length >= 2 ? `${selectedSkills.length} skills selected` : `Select ${Math.max(0, 2 - selectedSkills.length)} more skill${2 - selectedSkills.length !== 1 ? 's' : ''}`)}
          {step === 4 && 'Review your settings and start the interview'}
        </p>
        {step < TOTAL_STEPS ? (
          <Button onClick={nextStep} disabled={!canProceed()} className="gap-2 min-w-[140px]" data-testid="next-step-btn">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={startInterview} disabled={loading} className="gap-2 min-w-[160px]" data-testid="start-role-interview-btn">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start Interview <ArrowRight className="w-4 h-4" /></>}
          </Button>
        )}
      </div>
    </div>
  );
}
