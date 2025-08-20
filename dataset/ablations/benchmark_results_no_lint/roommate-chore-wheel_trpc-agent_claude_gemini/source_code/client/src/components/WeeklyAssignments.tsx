import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ChoreAssignmentView } from '../../../server/src/schema';

interface WeeklyAssignmentsProps {
  assignments: ChoreAssignmentView[];
  onMarkComplete: (assignmentId: number) => void;
  isLoading: boolean;
}

export function WeeklyAssignments({ assignments, onMarkComplete, isLoading }: WeeklyAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <p className="text-gray-500 text-lg mb-2">No assignments for this week</p>
        <p className="text-gray-400 text-sm">Generate weekly assignments to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {assignments.map((assignment: ChoreAssignmentView) => (
        <Card 
          key={assignment.assignment_id} 
          className={`border-2 transition-all ${
            assignment.is_completed 
              ? 'border-green-300 bg-green-50' 
              : 'border-yellow-300 bg-yellow-50'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">
                  {assignment.is_completed ? '✅' : '⏳'}
                </span>
                {assignment.chore_name}
              </CardTitle>
              <Badge 
                variant={assignment.is_completed ? 'default' : 'secondary'}
                className={assignment.is_completed 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }
              >
                {assignment.is_completed ? 'Complete' : 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.chore_description && (
              <p className="text-gray-600 text-sm">{assignment.chore_description}</p>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Assigned to:</span>
              <Badge variant="outline" className="bg-white">
                {assignment.assigned_person || '👤 Anyone'}
              </Badge>
            </div>

            <div className="text-xs text-gray-500">
              Week starting: {assignment.week_start.toLocaleDateString()}
            </div>

            {assignment.is_completed ? (
              <div className="flex items-center gap-2 text-green-600">
                <span className="text-sm">✨ Completed</span>
                {assignment.completed_at && (
                  <span className="text-xs">
                    on {assignment.completed_at.toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <Button
                onClick={() => onMarkComplete(assignment.assignment_id)}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isLoading ? 'Marking Complete...' : '✅ Mark Complete'}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
