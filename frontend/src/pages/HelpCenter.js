import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ArrowLeft, Search, Video, FileText, Mic, BarChart3, User, Settings, HelpCircle } from 'lucide-react';

const categories = [
  { icon: Video, title: 'Recording Issues', articles: ['Camera not working', 'Microphone permissions', 'Recording quality tips', 'Browser compatibility'] },
  { icon: FileText, title: 'Resume Upload', articles: ['Supported file formats', 'Resume parsing errors', 'Improving resume analysis', 'File size limits'] },
  { icon: Mic, title: 'Interview Flow', articles: ['Starting a mock interview', 'Answering questions', 'Skipping questions', 'Completing an interview'] },
  { icon: BarChart3, title: 'AI Feedback', articles: ['Understanding your feedback', 'Improving your scores', 'Feedback accuracy', 'Re-generating feedback'] },
  { icon: User, title: 'Account & Profile', articles: ['Creating an account', 'Google sign-in', 'Editing your profile', 'Deleting your account'] },
  { icon: Settings, title: 'Settings & Preferences', articles: ['Dark/Light mode', 'Language settings', 'Notification preferences', 'Data & privacy'] },
];

export default function HelpCenter() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" data-testid="help-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Help Center</h1>
          <p className="text-sm text-muted-foreground">Find answers to common questions</p>
        </div>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search for help..." className="pl-9" data-testid="help-search" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <Card key={i} className="border hover:shadow-md transition-all duration-200" data-testid={`help-category-${i}`}>
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <cat.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm font-heading">{cat.title}</h3>
              <ul className="space-y-1.5">
                {cat.articles.map((article, j) => (
                  <li key={j} className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                    {article}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border bg-primary/5">
        <CardContent className="p-6 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm mb-1">Still need help?</h3>
            <p className="text-sm text-muted-foreground">
              Can't find what you're looking for? <Link to="/contact" className="text-primary font-medium hover:underline">Contact our support team</Link> and we'll get back to you within 24 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
