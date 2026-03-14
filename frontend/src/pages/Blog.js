import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';

const posts = [
  { title: 'Top 10 Interview Questions Every Developer Should Prepare For', category: 'Interview Tips', date: 'Mar 8, 2026', read: '5 min', excerpt: 'Whether you are a frontend, backend, or full-stack developer, these questions come up in nearly every technical interview.' },
  { title: 'How AI Is Transforming Interview Preparation in 2026', category: 'AI & Careers', date: 'Mar 5, 2026', read: '4 min', excerpt: 'From personalized question generation to real-time feedback, AI tools are changing how candidates prepare for interviews.' },
  { title: 'The STAR Method: A Complete Guide with Examples', category: 'Interview Tips', date: 'Feb 28, 2026', read: '6 min', excerpt: 'Master the Situation, Task, Action, Result framework to answer behavioral interview questions effectively.' },
  { title: 'Resume Tips That Actually Get You Interviews', category: 'Career Advice', date: 'Feb 20, 2026', read: '4 min', excerpt: 'Learn what hiring managers actually look for and how to make your resume stand out from the stack.' },
  { title: 'Overcoming Interview Anxiety: A Practical Guide', category: 'Mindset', date: 'Feb 14, 2026', read: '5 min', excerpt: 'Nervousness before an interview is normal. Here are evidence-based strategies to manage anxiety and perform your best.' },
  { title: 'System Design Interview: How to Approach It', category: 'Technical', date: 'Feb 8, 2026', read: '8 min', excerpt: 'A step-by-step framework for tackling system design questions at top tech companies.' },
];

export default function Blog() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" data-testid="blog-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Blog</h1>
          <p className="text-sm text-muted-foreground">Interview tips, career advice, and industry insights</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {posts.map((post, i) => (
          <Card key={i} className="border hover:shadow-md transition-all duration-200 cursor-pointer group" data-testid={`blog-card-${i}`}>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                <span className="text-xs text-muted-foreground">{post.read} read</span>
              </div>
              <h3 className="font-semibold font-heading leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Read more <ArrowRight className="w-3 h-3" /></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
