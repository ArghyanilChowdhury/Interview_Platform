import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Calendar, ExternalLink, Mail } from 'lucide-react';

const pressItems = [
  { outlet: 'TechCrunch', title: 'InterviewMaster raises awareness for AI-driven interview prep', date: 'Mar 2026' },
  { outlet: 'Product Hunt', title: 'Featured Product of the Day - InterviewMaster', date: 'Feb 2026' },
  { outlet: 'Forbes', title: 'Top 10 AI Tools for Job Seekers in 2026', date: 'Jan 2026' },
  { outlet: 'The Verge', title: 'How AI coaches are changing the job interview landscape', date: 'Dec 2025' },
];

export default function Press() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" data-testid="press-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Press</h1>
          <p className="text-sm text-muted-foreground">Media coverage and press resources</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-heading">In the News</h2>
        {pressItems.map((item, i) => (
          <Card key={i} className="border hover:shadow-md transition-all duration-200 cursor-pointer" data-testid={`press-item-${i}`}>
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{item.outlet}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</span>
                </div>
                <h3 className="font-medium text-sm">{item.title}</h3>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-heading">Press Kit</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Need logos, screenshots, or brand assets? Download our press kit or reach out to our media team.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">Download Press Kit</Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Mail className="w-3.5 h-3.5" /> arghyanilryzen@gmail.com
          </Button>
        </div>
      </div>
    </div>
  );
}
