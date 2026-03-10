import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Briefcase, Code, Server, Layers, Database, Settings, Users,
  ArrowRight, ArrowLeft, Loader2
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

export default function RoleSetup() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const startInterview = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/interviews/start`, {
        type: 'role',
        role: selectedRole
      }, {
        headers: getAuthHeaders(),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="role-setup-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Choose Your Role</h1>
          <p className="text-sm text-muted-foreground">Select the position you're preparing for</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {roles.map((role) => (
          <Card
            key={role.name}
            className={`border cursor-pointer transition-all duration-200 animate-fade-in-up ${
              selectedRole === role.name
                ? 'ring-2 ring-primary shadow-md'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedRole(role.name)}
            data-testid={`role-card-${role.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                  selectedRole === role.name ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <role.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">{role.name}</h3>
                  <p className="text-xs text-muted-foreground">{role.desc}</p>
                </div>
              </div>
              {selectedRole === role.name && (
                <Badge className="mt-3 text-xs">Selected</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          {selectedRole ? `Ready to start ${selectedRole} interview` : 'Select a role to continue'}
        </p>
        <Button
          onClick={startInterview}
          disabled={!selectedRole || loading}
          className="gap-2 min-w-[160px]"
          data-testid="start-role-interview-btn"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>Start Interview <ArrowRight className="w-4 h-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
