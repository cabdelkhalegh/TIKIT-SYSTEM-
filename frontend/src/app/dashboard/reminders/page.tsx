'use client';

// T128: Reminders page — campaign-linked reminder list, create/edit reminder dialog
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, Plus, Calendar, Trash2, Check, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  isSent: boolean;
  campaignId: string | null;
  campaign?: { campaignId: string; campaignName: string; displayId: string } | null;
  createdAt: string;
}

export default function RemindersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/reminders');
      return res.data;
    },
  });

  const reminders: Reminder[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string; dueDate: string }) => {
      const res = await apiClient.post('/api/v1/reminders', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder created');
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setDueDate('');
    },
    onError: () => toast.error('Failed to create reminder'),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/api/v1/reminders/${id}`, { isSent: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder marked as done');
    },
    onError: () => toast.error('Failed to update reminder'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/v1/reminders/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder deleted');
    },
    onError: () => toast.error('Failed to delete reminder'),
  });

  const handleCreate = () => {
    if (!title || !dueDate) return;
    createMutation.mutate({ title, description: description || undefined, dueDate });
  };

  const upcoming = reminders.filter((r) => !r.isSent);
  const completed = reminders.filter((r) => r.isSent);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Reminders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your task reminders and deadlines
            </p>
          </div>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Reminder title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional details..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!title || !dueDate || createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Create Reminder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Upcoming ({upcoming.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming reminders</p>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{r.title}</p>
                          {r.description && (
                            <p className="text-xs text-gray-500 truncate">{r.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(r.dueDate).toLocaleString()}
                            </span>
                            {r.campaign && (
                              <Badge variant="outline" className="text-xs">
                                {r.campaign.displayId || r.campaign.campaignName}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => completeMutation.mutate(r.id)}
                            title="Mark as done"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(r.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed */}
            {completed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-500">
                    Completed ({completed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {completed.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-400 line-through">{r.title}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(r.dueDate).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(r.id)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
