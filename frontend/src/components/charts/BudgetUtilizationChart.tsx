'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface BudgetData {
  name: string;
  value: number;
  color: string;
}

interface BudgetUtilizationChartProps {
  allocated: number;
  spent: number;
  title?: string;
}

export default function BudgetUtilizationChart({ 
  allocated, 
  spent,
  title = 'Budget Utilization'
}: BudgetUtilizationChartProps) {
  const remaining = allocated - spent;
  const spentPercentage = allocated > 0 ? ((spent / allocated) * 100).toFixed(1) : '0';
  const remainingPercentage = allocated > 0 ? ((remaining / allocated) * 100).toFixed(1) : '0';

  const data: BudgetData[] = [
    {
      name: 'Spent',
      value: spent,
      color: '#7c3aed', // purple-600
    },
    {
      name: 'Remaining',
      value: remaining > 0 ? remaining : 0,
      color: '#e5e7eb', // gray-200
    },
  ];

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = payload[0].name === 'Spent' ? spentPercentage : remainingPercentage;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(payload[0].value)}</p>
          <p className="text-xs text-gray-500">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry: any) => {
    const percentage = entry.name === 'Spent' ? spentPercentage : remainingPercentage;
    return `${percentage}%`;
  };

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const amount = formatCurrency(entry.payload.value);
              return `${value}: ${amount}`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
