import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, Send, Star, MessageSquare, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a rating'); return; }
    if (!feedbackText) { toast.error('Please share your feedback'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/feedback`, { name, email, rating, text: feedbackText });
      toast.success('Thank you for your feedback! It will appear on our homepage.');
      setRating(0); setFeedbackText(''); setName(''); setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit feedback');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" data-testid="feedback-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Feedback</h1>
          <p className="text-sm text-muted-foreground">Help us improve InterviewMaster</p>
        </div>
      </div>

      <Card className="border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">How would you rate your experience?</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} className="transition-transform hover:scale-110" data-testid={`rating-star-${n}`}>
                    <Star className={`w-8 h-8 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
                {rating > 0 && <span className="text-sm text-muted-foreground ml-2">{rating}/5</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Your Name (optional)</Label>
              <Input placeholder="Your name — shown with your review" value={name} onChange={e => setName(e.target.value)} data-testid="feedback-name" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Your Feedback *</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[140px] resize-y"
                placeholder="What did you like? What could be better? Any feature requests?"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                data-testid="feedback-text"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Email (optional)</Label>
              <Input type="email" placeholder="your@email.com — to receive a copy" value={email} onChange={e => setEmail(e.target.value)} data-testid="feedback-email" />
            </div>

            <Button type="submit" className="gap-2" disabled={loading} data-testid="feedback-submit">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 p-4 rounded-md bg-muted/50 border">
        <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Your feedback directly shapes our roadmap. Approved reviews appear on our homepage testimonials section.
        </p>
      </div>
    </div>
  );
}
