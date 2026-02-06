'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface CampaignPerformanceChartProps {
  data: DataPoint[];
  title?: string;
  dataKey?: string;
}

export default function CampaignPerformanceChart({ 
  data, 
  title = 'Campaign Performance',
  dataKey = 'value'
}: CampaignPerformanceChartProps) {
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{payload[0].payload.date}</p>
          <p className="text-sm text-purple-600">
            {payload[0].payload.label || 'Value'}: {formatNumber(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip content={customTooltip} />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke="#7c3aed" 
            strokeWidth={2}
            dot={{ fill: '#7c3aed', r: 4 }}
            activeDot={{ r: 6, fill: '#6d28d9' }}
            name={data[0]?.label || 'Performance'}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
