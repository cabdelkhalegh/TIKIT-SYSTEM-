'use client';

// T114: CXSurveyCard — 5 star-rating fields + testimonial
import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CXSurveyCardProps {
  onSave: (data: {
    overallScore: number;
    communicationScore: number;
    qualityScore: number;
    timelinessScore: number;
    valueScore: number;
    testimonial?: string;
  }) => void;
  isSaving: boolean;
  isCompleted: boolean;
  initialData?: any;
}

const SCORE_FIELDS = [
  { key: 'overallScore', label: 'Overall Experience' },
  { key: 'communicationScore', label: 'Communication' },
  { key: 'qualityScore', label: 'Content Quality' },
  { key: 'timelinessScore', label: 'Timeliness' },
  { key: 'valueScore', label: 'Value for Money' },
] as const;

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="focus:outline-none disabled:cursor-not-allowed"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function CXSurveyCard({ onSave, isSaving, isCompleted, initialData }: CXSurveyCardProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    overallScore: initialData?.overallScore || 0,
    communicationScore: initialData?.communicationScore || 0,
    qualityScore: initialData?.qualityScore || 0,
    timelinessScore: initialData?.timelinessScore || 0,
    valueScore: initialData?.valueScore || 0,
  });
  const [testimonial, setTestimonial] = useState(initialData?.testimonial || '');

  const allRated = Object.values(scores).every((v) => v >= 1);

  const handleSave = () => {
    onSave({
      overallScore: scores.overallScore,
      communicationScore: scores.communicationScore,
      qualityScore: scores.qualityScore,
      timelinessScore: scores.timelinessScore,
      valueScore: scores.valueScore,
      testimonial: testimonial || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Client Experience Survey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {SCORE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label className="text-sm">{label}</Label>
            <StarRating
              value={scores[key]}
              onChange={(v) => setScores((prev) => ({ ...prev, [key]: v }))}
              disabled={isCompleted}
            />
          </div>
        ))}

        <div>
          <Label className="text-sm">Testimonial (optional)</Label>
          <Textarea
            value={testimonial}
            onChange={(e) => setTestimonial(e.target.value)}
            placeholder="Client testimonial or feedback..."
            className="mt-1"
            rows={3}
            disabled={isCompleted}
          />
        </div>

        {!isCompleted && (
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!allRated || isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Save CX Survey
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
