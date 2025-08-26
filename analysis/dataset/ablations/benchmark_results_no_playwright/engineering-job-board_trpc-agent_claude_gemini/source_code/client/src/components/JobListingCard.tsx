import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Building2, Clock, DollarSign, Wifi, WifiOff, Calendar, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { JobListing } from '../../../server/src/schema';

interface JobListingCardProps {
  job: JobListing;
}

export function JobListingCard({ job }: JobListingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDisciplineColor = (discipline: string) => {
    const colors = {
      'Software': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Electrical': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Mechanical': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Civil': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'Chemical': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Aerospace': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'Biomedical': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Environmental': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Industrial': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Materials': 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return colors[discipline as keyof typeof colors] || 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  return (
    <Card className="bg-slate-900/80 border-green-400/20 hover:border-green-400/40 transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-green-400 text-xl mb-2 flex items-center">
              <ChevronRight className="h-5 w-5 mr-2 text-green-400/60" />
              {job.title}
            </CardTitle>
            <CardDescription className="flex items-center space-x-4 text-green-400/70">
              <span className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                {job.company_name}
              </span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {job.location}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getDisciplineColor(job.engineering_discipline)}>
              {job.engineering_discipline}
            </Badge>
            {job.remote_friendly ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Wifi className="h-3 w-3 mr-1" />
                Remote
              </Badge>
            ) : (
              <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                <WifiOff className="h-3 w-3 mr-1" />
                On-site
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center space-x-6 mb-4 text-sm text-green-400/60">
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {job.employment_type}
          </span>
          {job.salary_range && (
            <span className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {job.salary_range}
            </span>
          )}
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(job.created_at)}
          </span>
        </div>

        <Separator className="bg-green-400/20 mb-4" />

        <div className="space-y-4">
          <div>
            <h4 className="text-green-400/80 text-sm font-semibold mb-2">
              // Job Description
            </h4>
            <p className="text-green-400/90 text-sm leading-relaxed">
              {isExpanded ? job.description : `${job.description.slice(0, 200)}${job.description.length > 200 ? '...' : ''}`}
            </p>
            {job.description.length > 200 && (
              <Button
                variant="link"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-green-400/70 hover:text-green-400 p-0 h-auto text-sm mt-2"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </Button>
            )}
          </div>

          {job.requirements && (
            <div>
              <h4 className="text-green-400/80 text-sm font-semibold mb-2">
                // Requirements
              </h4>
              <p className="text-green-400/90 text-sm leading-relaxed">
                {job.requirements}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-green-400/50">
            Job ID: #{job.id.toString().padStart(4, '0')} | Last updated: {formatDate(job.updated_at)}
          </div>
          <Button
            className="bg-green-400/20 border border-green-400/30 text-green-400 hover:bg-green-400/30 hover:text-green-300"
          >
            Apply Now
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
