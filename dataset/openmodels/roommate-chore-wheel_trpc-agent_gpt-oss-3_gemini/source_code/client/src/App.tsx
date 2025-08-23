import './App.css';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { Participant, Chore, Assignment, CreateParticipantInput, CreateChoreInput } from '../../server/src/schema';

function App() {
  // State for participants, chores, assignments
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [chores, setChores] = React.useState<Chore[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [newParticipant, setNewParticipant] = React.useState<CreateParticipantInput>({ name: '' });
  const [newChore, setNewChore] = React.useState<CreateChoreInput>({ name: '', description: null });
  const [generating, setGenerating] = React.useState(false);

  // Load participants
  const loadParticipants = React.useCallback(async () => {
    try {
      const data = await trpc.getParticipants.query();
      setParticipants(data);
    } catch (e) {
      console.error('Error loading participants', e);
    }
  }, []);

  // Load chores
  const loadChores = React.useCallback(async () => {
    try {
      const data = await trpc.getChores.query();
      setChores(data);
    } catch (e) {
      console.error('Error loading chores', e);
    }
  }, []);

  // Load assignments
  const loadAssignments = React.useCallback(async () => {
    try {
      const data = await trpc.getAssignments.query();
      setAssignments(data);
    } catch (e) {
      console.error('Error loading assignments', e);
    }
  }, []);

  React.useEffect(() => {
    loadParticipants();
    loadChores();
    loadAssignments();
  }, [loadParticipants, loadChores, loadAssignments]);

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const created = await trpc.createParticipant.mutate(newParticipant);
      setParticipants(prev => [...prev, created]);
      setNewParticipant({ name: '' });
    } catch (e) {
      console.error('Error creating participant', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const created = await trpc.createChore.mutate(newChore);
      setChores(prev => [...prev, created]);
      setNewChore({ name: '', description: null });
    } catch (e) {
      console.error('Error creating chore', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAssignments = async () => {
    setGenerating(true);
    try {
      // Use today as week start for demo purposes
      await trpc.generateAssignments.mutate({ week_start: new Date() });
      await loadAssignments();
    } catch (e) {
      console.error('Error generating assignments', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkCompleted = async (assignmentId: number) => {
    try {
      await trpc.markAssignmentCompleted.mutate({ assignment_id: assignmentId });
      // Refresh assignments after marking
      await loadAssignments();
    } catch (e) {
      console.error('Error marking completed', e);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Weekly Chore Manager</h1>

      {/* Participants Section */}
      <section className="border rounded-lg p-4">
        <h2 className="text-2xl font-semibold mb-2">Participants</h2>
        <form onSubmit={handleAddParticipant} className="flex gap-2 items-end mb-4">
          <Input
            placeholder="Name"
            value={newParticipant.name}
            onChange={e => setNewParticipant({ name: e.target.value })}
            required
          />
          <Button type="submit" disabled={isLoading}>Add</Button>
        </form>
        {participants.length === 0 ? (
          <p className="text-gray-500">No participants yet.</p>
        ) : (
          <ul className="list-disc list-inside">
            {participants.map(p => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Chores Section */}
      <section className="border rounded-lg p-4">
        <h2 className="text-2xl font-semibold mb-2">Chores</h2>
        <form onSubmit={handleAddChore} className="flex flex-col gap-2 mb-4">
          <Input
            placeholder="Chore name"
            value={newChore.name}
            onChange={e => setNewChore(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            placeholder="Description (optional)"
            value={newChore.description || ''}
            onChange={e => setNewChore(prev => ({ ...prev, description: e.target.value || null }))}
          />
          <Button type="submit" disabled={isLoading}>Add Chore</Button>
        </form>
        {chores.length === 0 ? (
          <p className="text-gray-500">No chores defined.</p>
        ) : (
          <ul className="list-disc list-inside">
            {chores.map(c => (
              <li key={c.id} className="flex justify-between">
                <span>{c.name}</span>
                {c.description && <span className="text-sm text-gray-600">{c.description}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Generate Assignments */}
      <section className="text-center">
        <Button onClick={handleGenerateAssignments} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Weekly Assignments'}
        </Button>
      </section>

      {/* Assignments List */}
      <section className="border rounded-lg p-4">
        <h2 className="text-2xl font-semibold mb-2">Current Week Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments generated yet.</p>
        ) : (
          <table className="w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Chore</th>
                <th className="p-2 text-left">Participant</th>
                <th className="p-2 text-left">Completed</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{chores.find(c => c.id === a.chore_id)?.name || '—'}</td>
                  <td className="p-2">{participants.find(p => p.id === a.participant_id)?.name || '—'}</td>
                  <td className="p-2">{a.completed ? '✅' : '❌'}</td>
                  <td className="p-2">
                    {!a.completed && (
                      <Button size="sm" onClick={() => handleMarkCompleted(a.id)}>
                        Mark Completed
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
