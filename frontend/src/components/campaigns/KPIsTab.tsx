'use client';

// T084: KPIsTab — summary cards, per-influencer table, manual entry, schedule status, auto-capture
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye, MousePointerClick, Heart, BarChart3, Plus, Clock, Check, X,
  Loader2, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { kpiService } from '@/services/kpi.service';
import type { KPISummary, KPIScheduleEntry } from '@/services/kpi.service';
import { toast } from 'sonner';

interface KPIsTabProps {
  campaignId: string;
  campaign: any;
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function ScheduleStatusIcon({ schedule }: { schedule: KPIScheduleEntry }) {
  if (schedule.capturedAt) {
    return <Check className="h-4 w-4 text-green-600" />;
  }
  if (schedule.isFailed) {
    return <X className="h-4 w-4 text-red-500" />;
  }
  return <Clock className="h-4 w-4 text-amber-500" />;
}

function ScheduleBadge({ schedule }: { schedule: KPIScheduleEntry }) {
  if (schedule.capturedAt) {
    return <Badge className="bg-green-100 text-green-800 text-xs">Captured</Badge>;
  }
  if (schedule.isFailed) {
    return <Badge className="bg-red-100 text-red-800 text-xs">Failed</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-800 text-xs">Pending</Badge>;
}

export default function KPIsTab({ campaignId, campaign }: KPIsTabProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    campaignInfluencerId: '',
    reach: '',
    impressions: '',
    engagement: '',
    clicks: '',
    captureDay: '',
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['campaign-kpi-summary', campaignId],
    queryFn: () => kpiService.getKPISummary(campaignId),
    staleTime: 15000,
  });

  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['campaign-kpi-schedules', campaignId],
    queryFn: () => kpiService.getKPISchedules(campaignId),
    staleTime: 15000,
  });

  const { data: kpisData } = useQuery({
    queryKey: ['campaign-kpis', campaignId],
    queryFn: () => kpiService.getKPIs(campaignId),
    staleTime: 15000,
  });

  const summary: KPISummary['summary'] | null = summaryData?.data?.summary || null;
  const byInfluencer = summaryData?.data?.byInfluencer || [];
  const byCaptureDay = summaryData?.data?.byCaptureDay || null;
  const schedules: KPIScheduleEntry[] = schedulesData?.data?.schedules || [];
  const scheduleStats = schedulesData?.data?.stats || { total: 0, completed: 0, pending: 0, failed: 0 };

  // Build influencer options from KPI data or schedules
  const influencerOptions: { id: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const inf of byInfluencer) {
    if (!seen.has(inf.campaignInfluencerId)) {
      seen.add(inf.campaignInfluencerId);
      influencerOptions.push({
        id: inf.campaignInfluencerId,
        label: inf.handle || inf.displayId || inf.campaignInfluencerId,
      });
    }
  }
  for (const s of schedules) {
    if (!seen.has(s.campaignInfluencerId)) {
      seen.add(s.campaignInfluencerId);
      influencerOptions.push({
        id: s.campaignInfluencerId,
        label: s.influencer?.handle || s.influencer?.displayId || s.campaignInfluencerId,
      });
    }
  }

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addKPIMutation = useMutation({
    mutationFn: () =>
      kpiService.addKPI(campaignId, {
        campaignInfluencerId: formData.campaignInfluencerId,
        reach: formData.reach ? parseInt(formData.reach, 10) : undefined,
        impressions: formData.impressions ? parseInt(formData.impressions, 10) : undefined,
        engagement: formData.engagement ? parseInt(formData.engagement, 10) : undefined,
        clicks: formData.clicks ? parseInt(formData.clicks, 10) : undefined,
        captureDay: formData.captureDay ? parseInt(formData.captureDay, 10) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-kpi-summary', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-kpis', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-kpi-schedules', campaignId] });
      toast.success('KPI entry added');
      setShowAddDialog(false);
      setFormData({ campaignInfluencerId: '', reach: '', impressions: '', engagement: '', clicks: '', captureDay: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add KPI entry');
    },
  });

  const autoCaptureMutation = useMutation({
    mutationFn: () => kpiService.triggerAutoCapture(campaignId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-kpi-summary', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-kpis', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-kpi-schedules', campaignId] });
      const result = data.data;
      toast.success(`Auto-capture complete: ${result.captured || 0} captured, ${result.failed || 0} failed`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Auto-capture failed');
    },
  });

  // ─── Summary cards ────────────────────────────────────────────────────────

  const summaryCards = [
    { label: 'Total Reach', value: summary?.totalReach, icon: Eye, color: 'text-blue-600' },
    { label: 'Total Impressions', value: summary?.totalImpressions, icon: BarChart3, color: 'text-purple-600' },
    { label: 'Total Engagement', value: summary?.totalEngagement, icon: Heart, color: 'text-pink-600' },
    { label: 'Total Clicks', value: summary?.totalClicks, icon: MousePointerClick, color: 'text-green-600' },
  ];

  // ─── Group schedules by influencer ────────────────────────────────────────

  const schedulesByInfluencer = new Map<string, { handle: string; schedules: Record<number, KPIScheduleEntry> }>();
  for (const s of schedules) {
    const key = s.campaignInfluencerId;
    if (!schedulesByInfluencer.has(key)) {
      schedulesByInfluencer.set(key, {
        handle: s.influencer?.handle || s.influencer?.displayId || key,
        schedules: {},
      });
    }
    schedulesByInfluencer.get(key)!.schedules[s.captureDay] = s;
  }

  // ─── Build per-influencer KPI table data ──────────────────────────────────

  // Build KPI lookup: campaignInfluencerId → captureDay → KPI values
  const kpisByInfluencer = new Map<string, Record<number, { reach: number | null; impressions: number | null; engagement: number | null; clicks: number | null }>>();
  if (kpisData?.data?.kpis) {
    for (const k of kpisData.data.kpis) {
      if (!k.campaignInfluencerId || !k.captureDay) continue;
      if (!kpisByInfluencer.has(k.campaignInfluencerId)) {
        kpisByInfluencer.set(k.campaignInfluencerId, {});
      }
      const existing = kpisByInfluencer.get(k.campaignInfluencerId)![k.captureDay];
      if (!existing) {
        kpisByInfluencer.get(k.campaignInfluencerId)![k.captureDay] = {
          reach: k.reach, impressions: k.impressions, engagement: k.engagement, clicks: k.clicks,
        };
      }
    }
  }

  // Merge influencer list from byInfluencer + schedulesByInfluencer
  const allInfluencerIds = new Set([
    ...byInfluencer.map((i) => i.campaignInfluencerId),
    ...schedulesByInfluencer.keys(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">KPI Tracking</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => autoCaptureMutation.mutate()}
            disabled={autoCaptureMutation.isPending || scheduleStats.pending === 0}
          >
            {autoCaptureMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-1.5" />
            )}
            Auto-Capture ({scheduleStats.pending} due)
          </Button>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add KPI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add KPI Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Influencer</Label>
                  <Select
                    value={formData.campaignInfluencerId}
                    onValueChange={(v) => setFormData((p) => ({ ...p, campaignInfluencerId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select influencer" />
                    </SelectTrigger>
                    <SelectContent>
                      {influencerOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capture Day</Label>
                  <Select
                    value={formData.captureDay}
                    onValueChange={(v) => setFormData((p) => ({ ...p, captureDay: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Day 1</SelectItem>
                      <SelectItem value="3">Day 3</SelectItem>
                      <SelectItem value="7">Day 7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Reach</Label>
                    <Input
                      type="number"
                      value={formData.reach}
                      onChange={(e) => setFormData((p) => ({ ...p, reach: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Impressions</Label>
                    <Input
                      type="number"
                      value={formData.impressions}
                      onChange={(e) => setFormData((p) => ({ ...p, impressions: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Engagement</Label>
                    <Input
                      type="number"
                      value={formData.engagement}
                      onChange={(e) => setFormData((p) => ({ ...p, engagement: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Clicks</Label>
                    <Input
                      type="number"
                      value={formData.clicks}
                      onChange={(e) => setFormData((p) => ({ ...p, clicks: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => addKPIMutation.mutate()}
                  disabled={!formData.campaignInfluencerId || addKPIMutation.isPending}
                >
                  {addKPIMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : null}
                  Save KPI Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {summaryCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold">{formatNumber(value ?? 0)}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${color} opacity-30`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Per-Influencer KPI Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-Influencer KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          {allInfluencerIds.size === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No KPI data yet. KPI schedules are created when influencers go live.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead className="text-center">Day 1</TableHead>
                  <TableHead className="text-center">Day 3</TableHead>
                  <TableHead className="text-center">Day 7</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(allInfluencerIds).map((ciId) => {
                  const infData = byInfluencer.find((i) => i.campaignInfluencerId === ciId);
                  const schedData = schedulesByInfluencer.get(ciId);
                  const kpiData = kpisByInfluencer.get(ciId) || {};
                  const handle = infData?.handle || schedData?.handle || ciId.slice(0, 8);

                  return (
                    <TableRow key={ciId}>
                      <TableCell className="font-medium">{handle}</TableCell>
                      {[1, 3, 7].map((day) => {
                        const schedule = schedData?.schedules[day];
                        const dayKpi = kpiData[day];

                        return (
                          <TableCell key={day} className="text-center">
                            {dayKpi ? (
                              <div className="space-y-0.5">
                                <div className="text-xs text-gray-500">
                                  R: {formatNumber(dayKpi.reach)} | I: {formatNumber(dayKpi.impressions)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  E: {formatNumber(dayKpi.engagement)} | C: {formatNumber(dayKpi.clicks)}
                                </div>
                                <Badge className="bg-green-100 text-green-800 text-[10px]">Captured</Badge>
                              </div>
                            ) : schedule ? (
                              <div className="flex flex-col items-center gap-1">
                                <ScheduleStatusIcon schedule={schedule} />
                                <ScheduleBadge schedule={schedule} />
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Schedule Status Overview */}
      {scheduleStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capture Schedule Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-gray-300" />
                <span>Total: {scheduleStats.total}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-green-600" />
                <span>Captured: {scheduleStats.completed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>Pending: {scheduleStats.pending}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <X className="h-3 w-3 text-red-500" />
                <span>Failed: {scheduleStats.failed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
