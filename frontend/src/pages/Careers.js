import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Briefcase, MapPin, Clock } from 'lucide-react';

const openings = [
  { title: 'Senior Frontend Engineer', team: 'Engineering', location: 'Remote', type: 'Full-time', desc: 'Build and improve our React-based interview platform with modern UI/UX practices.' },
  { title: 'AI/ML Engineer', team: 'AI & Data', location: 'Remote', type: 'Full-time', desc: 'Develop and refine our AI models for question generation, feedback, and candidate assessment.' },
  { title: 'Product Designer', team: 'Design', location: 'Remote', type: 'Full-time', desc: 'Shape the user experience of interview preparation through research-driven design.' },
  { title: 'Content Writer', team: 'Marketing', location: 'Remote', type: 'Part-time', desc: 'Create interview tips, career advice, and educational content for our blog and platform.' },
  { title: 'Community Manager', team: 'Growth', location: 'Remote', type: 'Contract', desc: 'Build and nurture our community of job seekers and career professionals.' },
];

export default function Careers() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" data-testid="careers-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Careers</h1>
      </div>

      <div className="space-y-4">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Join us in building the future of interview preparation. We're a remote-first team passionate about helping people land their dream jobs.
        </p>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{openings.length} Open Positions</Badge>
          <Badge variant="outline">Remote First</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {openings.map((job, i) => (
          <Card key={i} className="border hover:shadow-md transition-all duration-200 cursor-pointer" data-testid={`job-card-${i}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold font-heading text-base">{job.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{job.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.team}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.type}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">Apply</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border bg-primary/5">
        <CardContent className="p-6 text-center space-y-3">
          <h3 className="font-semibold font-heading">Don't see a fit?</h3>
          <p className="text-sm text-muted-foreground">We're always looking for talented people. Send your resume to <span className="text-primary font-medium">arghyanilryzen@gmail.com</span></p>
        </CardContent>
      </Card>
    </div>
  );
}
