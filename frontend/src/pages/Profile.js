import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  ArrowLeft, User, Mail, Calendar, Video, CheckCircle,
  Loader2, Save, Shield
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { user, getAuthHeaders, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/profile`, {
          headers: getAuthHeaders(),
          withCredentials: true
        });
        setProfile(res.data);
        setName(res.data.name || '');
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [getAuthHeaders]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API}/profile`, { name: name.trim() }, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      toast.success('Profile updated!');
      await checkAuth();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="profile-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card className="border">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {profile?.picture ? (
                  <img src={profile.picture} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <h3 className="font-semibold font-heading">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Badge variant="secondary" className="mt-3 text-xs capitalize gap-1">
                <Shield className="w-3 h-3" />
                {profile?.auth_type === 'google' ? 'Google Account' : 'Email Account'}
              </Badge>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border mt-4">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Video className="w-4 h-4" /> Total Interviews
                </span>
                <span className="font-semibold">{profile?.total_interviews || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Completed
                </span>
                <span className="font-semibold">{profile?.completed_interviews || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Member Since
                </span>
                <span className="text-sm font-medium">{formatDate(profile?.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  data-testid="profile-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                    data-testid="profile-email-input"
                  />
                  <Badge variant="outline" className="text-xs shrink-0">
                    <Mail className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving || name === profile?.name}
                  className="gap-2"
                  data-testid="save-profile-btn"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
