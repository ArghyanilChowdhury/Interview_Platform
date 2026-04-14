import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, Send, Mail, Phone, MapPin, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/contact`, form);
      toast.success('Query sent! Check your email for a copy.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send query');
    } finally { setLoading(false); }
  };

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'arghyanilryzen@gmail.com', sub: 'We reply within 24 hours' },
    { icon: Phone, label: 'Phone', value: '+91-XXXXXXXXXX', sub: 'Mon-Fri 10am-6pm IST' },
    { icon: MapPin, label: 'Location', value: 'India', sub: 'Remote-first team' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" data-testid="contact-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Contact Us</h1>
          <p className="text-sm text-muted-foreground">We'd love to hear from you</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {contactInfo.map((item, i) => (
          <Card key={i} className="border">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Name *</Label>
                <Input placeholder="Your name" value={form.name} onChange={e => handleChange('name', e.target.value)} data-testid="contact-name" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email *</Label>
                <Input type="email" placeholder="your@email.com" value={form.email} onChange={e => handleChange('email', e.target.value)} data-testid="contact-email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Subject *</Label>
              <Input placeholder="What's this about?" value={form.subject} onChange={e => handleChange('subject', e.target.value)} data-testid="contact-subject" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Message *</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[140px] resize-y"
                placeholder="Describe your query in detail..."
                value={form.message}
                onChange={e => handleChange('message', e.target.value)}
                data-testid="contact-message"
              />
            </div>
            <Button type="submit" className="gap-2" disabled={loading} data-testid="contact-submit">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Message
            </Button>
            <p className="text-xs text-muted-foreground">A copy of your query will be sent to your email for your records.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
