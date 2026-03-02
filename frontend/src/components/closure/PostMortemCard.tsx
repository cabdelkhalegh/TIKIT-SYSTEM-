'use client';

// T115: PostMortemCard — 5 text areas (wentWell, improvements, lessons, actionItems, risks)
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PostMortemCardProps {
  onSave: (data: {
    wentWell: string[];
    improvements: string[];
    lessons: string[];
    actionItems: string[];
    riskNotes?: string;
  }) => void;
  isSaving: boolean;
  isCompleted: boolean;
  initialData?: any;
}

const TEXT_FIELDS = [
  { key: 'wentWell', label: 'What Went Well', placeholder: 'Enter items separated by newlines...' },
  { key: 'improvements', label: 'Areas for Improvement', placeholder: 'Enter improvements...' },
  { key: 'lessons', label: 'Lessons Learned', placeholder: 'Enter lessons...' },
  { key: 'actionItems', label: 'Action Items', placeholder: 'Enter action items...' },
] as const;

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function PostMortemCard({ onSave, isSaving, isCompleted, initialData }: PostMortemCardProps) {
  const [fields, setFields] = useState<Record<string, string>>({
    wentWell: (initialData?.wentWell || []).join('\n'),
    improvements: (initialData?.improvements || []).join('\n'),
    lessons: (initialData?.lessons || []).join('\n'),
    actionItems: (initialData?.actionItems || []).join('\n'),
  });
  const [riskNotes, setRiskNotes] = useState(initialData?.riskNotes || '');

  const hasContent = Object.values(fields).some((v) => v.trim().length > 0);

  const handleSave = () => {
    onSave({
      wentWell: parseLines(fields.wentWell),
      improvements: parseLines(fields.improvements),
      lessons: parseLines(fields.lessons),
      actionItems: parseLines(fields.actionItems),
      riskNotes: riskNotes || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Post-Mortem Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {TEXT_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <Label className="text-sm">{label}</Label>
            <Textarea
              value={fields[key]}
              onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="mt-1"
              rows={3}
              disabled={isCompleted}
            />
          </div>
        ))}

        <div>
          <Label className="text-sm">Risk Notes (optional)</Label>
          <Textarea
            value={riskNotes}
            onChange={(e) => setRiskNotes(e.target.value)}
            placeholder="Any risk observations..."
            className="mt-1"
            rows={2}
            disabled={isCompleted}
          />
        </div>

        {!isCompleted && (
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!hasContent || isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Save Post-Mortem
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
