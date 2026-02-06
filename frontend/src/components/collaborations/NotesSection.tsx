'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { Note } from '@/types/collaboration.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface NotesSectionProps {
  notes: Note[];
  onAddNote?: (content: string) => Promise<void>;
  canAddNote?: boolean;
}

export default function NotesSection({
  notes,
  onAddNote,
  canAddNote = false,
}: NotesSectionProps) {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!onAddNote || !newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      {canAddNote && (
        <Card className="p-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Add Note</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
              rows={3}
              placeholder="Write a note..."
            />
            <Button
              onClick={handleAddNote}
              disabled={isSubmitting || !newNote.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {sortedNotes.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Notes</h3>
            <p className="text-gray-600">No notes have been added to this collaboration yet.</p>
          </Card>
        ) : (
          sortedNotes.map((note) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-700">
                      {note.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{note.author}</div>
                    <div className="text-xs text-gray-500">{formatDate(note.createdAt)}</div>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
