import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { JobListing } from '../../../server/src/schema';

interface JobListingCardProps {
  job: JobListing;
}

export function JobListingCard({ job }: JobListingCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-900 mb-1">
              {job.job_title}
            </CardTitle>
            <CardDescription className="text-lg font-medium text-indigo-600">
              🏢 {job.company_name}
            </CardDescription>
          </div>
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
            {job.engineering_discipline}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-gray-600 mt-2">
          <span className="flex items-center gap-1">
            📍 {job.location}
          </span>
          <span className="flex items-center gap-1">
            📅 Posted {job.created_at.toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Job Description</h4>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {job.job_description}
            </p>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Last updated: {job.updated_at.toLocaleDateString()}
            </span>
            <Button 
              asChild
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <a 
                href={job.application_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                🚀 Apply Now
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
