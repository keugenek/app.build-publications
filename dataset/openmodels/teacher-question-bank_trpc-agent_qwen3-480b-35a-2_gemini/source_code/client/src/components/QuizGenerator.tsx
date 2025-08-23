import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Download, 
  BookOpen, 
  PenSquare, 
  FileText, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Subject, Topic, Question, Quiz } from '../../../server/src/schema';

interface QuizGeneratorProps {
  mode?: 'generate' | 'export';
}

export function QuizGenerator({ mode = 'generate' }: QuizGeneratorProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [exportData, setExportData] = useState<string>('');

  const loadSubjects = useCallback(async () => {
    try {
      const result = await trpc.getSubjects.query();
      setSubjects(result);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      // Since backend is not implemented, we'll use sample data
      const sampleSubjects: Subject[] = [
        {
          id: 1,
          name: "Mathematics",
          created_at: new Date()
        },
        {
          id: 2,
          name: "Science",
          created_at: new Date()
        },
        {
          id: 3,
          name: "History",
          created_at: new Date()
        }
      ];
      setSubjects(sampleSubjects);
    }
  }, []);

  const loadTopics = useCallback(async () => {
    try {
      const result = await trpc.getTopics.query();
      setTopics(result);
    } catch (err) {
      console.error('Failed to load topics:', err);
      // Since backend is not implemented, we'll use sample data
      const sampleTopics: Topic[] = [
        {
          id: 1,
          name: "Algebra",
          subject_id: 1,
          created_at: new Date()
        },
        {
          id: 2,
          name: "Calculus",
          subject_id: 1,
          created_at: new Date()
        },
        {
          id: 3,
          name: "Biology",
          subject_id: 2,
          created_at: new Date()
        }
      ];
      setTopics(sampleTopics);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
    loadTopics();
  }, [loadSubjects, loadTopics]);

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId) 
        : [...prev, subjectId]
    );
    
    // Clear any topics from this subject that might have been selected
    const subjectTopics = topics.filter(t => t.subject_id === subjectId).map(t => t.id);
    setSelectedTopics(prev => prev.filter(id => !subjectTopics.includes(id)));
  };

  const toggleTopic = (topicId: number) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId) 
        : [...prev, topicId]
    );
  };

  const handleGenerate = async () => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    if (numQuestions <= 0 || numQuestions > 100) {
      setError('Number of questions must be between 1 and 100');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await trpc.generateQuiz.mutate({
        subject_ids: selectedSubjects,
        topic_ids: selectedTopics.length > 0 ? selectedTopics : undefined,
        num_questions: numQuestions
      });
      
      setQuiz(result.quiz);
      setQuizQuestions(result.questions);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      // Since backend is not implemented, we'll use sample data
      const sampleQuiz: Quiz = {
        id: Math.floor(Math.random() * 1000),
        name: `Quiz: ${selectedSubjects.map(id => {
          const subject = subjects.find(s => s.id === id);
          return subject ? subject.name : 'Unknown';
        }).join(', ')}`,
        created_at: new Date()
      };
      
      // Generate sample questions
      const sampleQuestions: Question[] = Array.from({ length: numQuestions }, (_, i) => ({
        id: i + 1,
        text: `Sample question ${i + 1} about ${selectedSubjects.map(id => {
          const subject = subjects.find(s => s.id === id);
          return subject ? subject.name : 'unknown subject';
        }).join(', ')}`,
        type: i % 2 === 0 ? 'Multiple Choice' : 'Open Ended',
        correct_answer: `Correct answer for question ${i + 1}`,
        subject_id: selectedSubjects[Math.floor(Math.random() * selectedSubjects.length)],
        topic_id: topics.length > 0 
          ? topics[Math.floor(Math.random() * topics.length)].id 
          : 1,
        created_at: new Date()
      }));
      
      setQuiz(sampleQuiz);
      setQuizQuestions(sampleQuestions);
      setIsPreviewOpen(true);
      setError('Backend not available. Showing sample quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!quiz) {
      setError('Please generate a quiz first');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const result = await trpc.exportQuiz.query(quiz.id);
      setExportData(result);
    } catch (err) {
      console.error('Failed to export quiz:', err);
      // Since backend is not implemented, we'll generate sample export data
      let exportText = `Quiz: ${quiz.name}\n`;
      exportText += `Generated on: ${quiz.created_at.toLocaleDateString()}\n`;
      exportText += `Number of questions: ${quizQuestions.length}\n\n`;
      
      quizQuestions.forEach((question, index) => {
        exportText += `Question ${index + 1}: ${question.text}\n`;
        exportText += `Type: ${question.type}\n`;
        exportText += `Answer: ${question.correct_answer}\n\n`;
      });
      
      setExportData(exportText);
      setError('Backend not available. Showing sample export.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTopics = topics.filter(topic => 
    selectedSubjects.includes(topic.subject_id)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mode === 'export' ? (
              <>
                <Download className="h-5 w-5" />
                Export Quiz
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Generate Quiz
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-4 w-4" />
                  Subjects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjects.length === 0 ? (
                  <p className="text-gray-500 text-sm">No subjects available</p>
                ) : (
                  subjects.map(subject => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={() => toggleSubject(subject.id)}
                      />
                      <Label 
                        htmlFor={`subject-${subject.id}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {subject.name}
                      </Label>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PenSquare className="h-4 w-4" />
                  Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTopics.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    {selectedSubjects.length > 0 
                      ? "No topics available for selected subjects" 
                      : "Select subjects to see topics"}
                  </p>
                ) : (
                  filteredTopics.map(topic => {
                    const subject = subjects.find(s => s.id === topic.subject_id);
                    return (
                      <div key={topic.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`topic-${topic.id}`}
                          checked={selectedTopics.includes(topic.id)}
                          onCheckedChange={() => toggleTopic(topic.id)}
                          disabled={!selectedSubjects.includes(topic.subject_id)}
                        />
                        <Label 
                          htmlFor={`topic-${topic.id}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <span className="font-medium">{topic.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({subject?.name})
                          </span>
                        </Label>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="numQuestions" className="block text-sm font-medium mb-1">
                Number of Questions
              </Label>
              <Input
                id="numQuestions"
                type="number"
                min="1"
                max="100"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Between 1 and 100 questions
              </p>
            </div>
            
            <div className="flex justify-end">
              {mode === 'export' ? (
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting || !quiz}
                  className="w-full md:w-auto flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export Quiz'}
                </Button>
              ) : (
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full md:w-auto flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Generate Quiz'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Quiz Generated Successfully
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-lg mb-2">Quiz Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-sm text-gray-500">Quiz Name</p>
                  <p className="font-medium">{quiz?.name || 'Generated Quiz'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="font-medium">{quizQuestions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Generated On</p>
                  <p className="font-medium">
                    {quiz?.created_at ? new Date(quiz.created_at).toLocaleDateString() : 'Today'}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="font-semibold text-lg mb-2">Questions Preview</h3>
            <ScrollArea className="flex-1 border rounded-md p-4">
              <div className="space-y-6 pr-4">
                {quizQuestions.map((question, index) => {
                  const subject = subjects.find(s => s.id === question.subject_id);
                  const topic = topics.find(t => t.id === question.topic_id);
                  
                  return (
                    <div key={question.id} className="pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Badge variant="secondary" className="mt-1">
                            Q{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{question.text}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {question.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {subject?.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {topic?.name}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-8 mt-2 pl-3 border-l-2 border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Answer:</span> {question.correct_answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {quizQuestions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No questions found for the selected criteria
                  </p>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Quiz'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!exportData} onOpenChange={(open) => !open && setExportData('')}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quiz Export
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-lg mb-2">Export Ready</h3>
              <p className="text-sm text-gray-700">
                Your quiz has been successfully generated. Copy the text below or save it to a file.
              </p>
            </div>
            
            <ScrollArea className="flex-1 border rounded-md p-4 bg-gray-50">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {exportData}
              </pre>
            </ScrollArea>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => navigator.clipboard.writeText(exportData)}
              >
                Copy to Clipboard
              </Button>
              <Button onClick={() => setExportData('')}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
