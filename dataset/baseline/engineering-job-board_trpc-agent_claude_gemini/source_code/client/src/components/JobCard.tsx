import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, MapPin, Building, Calendar, Code } from 'lucide-react';
import type { JobListing } from '../../../server/src/schema';

interface JobCardProps {
  job: JobListing;
  onClick?: () => void;
  isExpanded?: boolean;
}

const disciplineIcons: Record<string, string> = {
  'Software': '💻',
  'Electrical': '⚡',
  'Mechanical': '⚙️',
  'Civil': '🏗️',
  'Chemical': '🧪',
  'Aerospace': '🚀',
  'Biomedical': '🧬',
  'Industrial': '🏭',
  'Environmental': '🌱',
  'Materials': '🔬',
  'Nuclear': '☢️',
  'Other': '🔧'
};

const disciplineColors: Record<string, string> = {
  'Software': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Electrical': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Mechanical': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Civil': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Chemical': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Aerospace': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Biomedical': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Industrial': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Environmental': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Materials': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Nuclear': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Other': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

export function JobCard({ job, onClick, isExpanded = false }: JobCardProps) {
  const disciplineIcon = disciplineIcons[job.engineering_discipline] || '🔧';
  const disciplineColor = disciplineColors[job.engineering_discipline] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card 
      className="terminal-border hover:neon-glow transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-mono text-slate-100 mb-2 flex items-center gap-2">
              <span className="text-green-400">&gt;</span>
              {job.title}
              <Code className="w-4 h-4 text-slate-500" />
            </CardTitle>
            
            <div className="flex items-center gap-4 text-sm text-slate-400 font-mono mb-3">
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                {job.company_name}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(job.created_at)}
              </div>
            </div>

            <Badge variant="secondary" className={`${disciplineColor} font-mono`}>
              {disciplineIcon} {job.engineering_discipline}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-slate-300 font-mono text-sm leading-relaxed">
              {isExpanded 
                ? job.description 
                : `${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}`
              }
            </p>
            {job.description.length > 200 && !isExpanded && (
              <button className="text-blue-400 hover:text-blue-300 text-xs font-mono mt-2">
                [EXPAND] Show more details
              </button>
            )}
          </div>

          <Separator className="bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-mono">
              // Job ID: #{job.id.toString().padStart(4, '0')}
            </div>
            <Button 
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                window.open(job.application_url, '_blank');
              }}
              className="bg-green-600 hover:bg-green-700 text-black font-mono text-sm"
              size="sm"
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              APPLY_NOW()
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
