import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import KPIEntryForm from '../../../../components/KPIEntryForm';
import MetricsCard from '../../../../components/MetricsCard';
import { Campaign, Client, ContentItem, CampaignKPI } from '../../../../types';

export default async function CampaignKPIsPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get campaign details
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .single<Campaign>();

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  // Get client info
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', campaign.client_id)
    .single<Client>();

  // Get content items
  const { data: contentItems } = await supabase
    .from('content_items')
    .select('*')
    .eq('campaign_id', params.id)
    .order('created_at', { ascending: false });

  // Get campaign KPI rollup
  const { data: campaignKPI } = await supabase
    .from('campaign_kpis')
    .select('*')
    .eq('campaign_id', params.id)
    .order('created_at', { ascending: false})
    .limit(1)
    .single<CampaignKPI>();

  // Get KPIs for each content item
  const contentItemsWithKPIs = await Promise.all(
    (contentItems || []).map(async (item) => {
      const { data: kpis } = await supabase
        .from('kpis')
        .select('*')
        .eq('content_item_id', item.id)
        .order('snapshot_date', { ascending: false });
      
      return {
        ...item,
        kpis: kpis || [],
        hasKPIs: (kpis || []).length > 0,
        latestKPI: kpis?.[0] || null
      };
    })
  );

  // Calculate cost per engagement if we have data
  const costPerEngagement = campaignKPI && campaignKPI.total_interactions > 0
    ? campaign.budget_amount / campaignKPI.total_interactions
    : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/campaigns/${params.id}`}
              className="text-blue-600 hover:underline mb-2 inline-block"
            >
              ← Back to Campaign
            </Link>
            <h1 className="text-3xl font-bold">{campaign.name} - KPIs</h1>
            <p className="text-gray-600 mt-1">
              Client: {client?.company_name || 'Unknown'} | Budget: ${campaign.budget_amount?.toLocaleString() || '0'} {campaign.budget_currency}
            </p>
          </div>

          {/* Campaign-Level Metrics */}
          {campaignKPI ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Campaign Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricsCard
                  title="Total Reach"
                  value={campaignKPI.total_reach || 0}
                  icon="👥"
                  color="blue"
                />
                <MetricsCard
                  title="Total Interactions"
                  value={campaignKPI.total_interactions || 0}
                  icon="❤️"
                  color="green"
                  subtitle={`Likes, Comments, Shares, Saves`}
                />
                <MetricsCard
                  title="Avg Engagement Rate"
                  value={campaignKPI.avg_engagement_rate || 0}
                  format="percentage"
                  icon="📊"
                  color="purple"
                />
                <MetricsCard
                  title="Cost per Engagement"
                  value={costPerEngagement}
                  format="currency"
                  icon="💰"
                  color="blue"
                  subtitle="Budget / Total Interactions"
                />
              </div>
            </div>
          ) : (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-800 mb-2">No Campaign KPIs Yet</h3>
              <p className="text-yellow-700 text-sm">
                Campaign-level metrics will appear once you add KPI data for content items below.
              </p>
            </div>
          )}

          {/* Content Items with KPIs */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Content Items KPIs</h2>
            
            {contentItemsWithKPIs && contentItemsWithKPIs.length > 0 ? (
              <div className="space-y-4">
                {contentItemsWithKPIs.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Platform: {item.platform} | Format: {item.format || 'Not specified'}
                        </p>
                        
                        {item.hasKPIs && item.latestKPI && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Views:</span>
                              <div className="font-semibold">{item.latestKPI.views?.toLocaleString() || '-'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Likes:</span>
                              <div className="font-semibold">{item.latestKPI.likes?.toLocaleString() || '-'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Comments:</span>
                              <div className="font-semibold">{item.latestKPI.comments?.toLocaleString() || '-'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Shares:</span>
                              <div className="font-semibold">{item.latestKPI.shares?.toLocaleString() || '-'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Saves:</span>
                              <div className="font-semibold">{item.latestKPI.saves?.toLocaleString() || '-'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Reach:</span>
                              <div className="font-semibold">{item.latestKPI.reach?.toLocaleString() || '-'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Engagement:</span>
                              <div className="font-semibold">
                                {item.latestKPI.engagement_rate ? `${item.latestKPI.engagement_rate.toFixed(2)}%` : '-'}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!item.hasKPIs && (
                          <p className="mt-3 text-sm text-gray-500 italic">No KPI data yet</p>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        {item.hasKPIs ? (
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full mb-2">
                              {item.kpis.length} KPI snapshot{item.kpis.length !== 1 ? 's' : ''}
                            </span>
                            <div className="text-xs text-gray-500">
                              Latest: {new Date(item.latestKPI.snapshot_date).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            No KPIs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No content items in this campaign yet.</p>
                <Link
                  href={`/campaigns/${params.id}`}
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Go to campaign to add content items
                </Link>
              </div>
            )}
          </div>

          {/* Add KPI Form */}
          {contentItems && contentItems.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Add New KPI Data</h2>
              <KPIEntryForm
                campaignId={params.id}
                contentItems={contentItems}
                onSuccess={() => {
                  // Refresh the page to show new data
                  window.location.reload();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
