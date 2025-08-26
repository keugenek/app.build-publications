import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { JobListing } from '../../../server/src/schema';

export function JobCard({ job }: { job: JobListing }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <CardDescription>{job.company_name} • {job.location}</CardDescription>
          </div>
          <Badge variant="secondary">{job.discipline}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-3">{job.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Posted: {new Date(job.created_at).toLocaleDateString()}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">View Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{job.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Company</h3>
                  <p>{job.company_name}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p>{job.location}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Discipline</h3>
                  <Badge>{job.discipline}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Posted</h3>
                    <p>{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Updated</h3>
                    <p>{new Date(job.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
