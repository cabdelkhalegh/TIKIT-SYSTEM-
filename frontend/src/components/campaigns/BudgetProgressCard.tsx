import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetProgressCardProps {
  totalBudget: number;
  allocatedBudget: number;
  spentBudget: number;
}

export default function BudgetProgressCard({
  totalBudget,
  allocatedBudget,
  spentBudget,
}: BudgetProgressCardProps) {
  const remainingBudget = totalBudget - spentBudget;
  const spentPercentage = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;
  const allocatedPercentage = totalBudget > 0 ? (allocatedBudget / totalBudget) * 100 : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget Overview</h3>
        <DollarSign className="h-5 w-5 text-purple-600" />
      </div>

      <div className="space-y-4">
        {/* Total Budget */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Total Budget</span>
            <span className="font-semibold text-gray-900">{formatCurrency(totalBudget)}</span>
          </div>
        </div>

        {/* Spent Budget */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Spent</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(spentBudget)} ({spentPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(spentPercentage)}`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Allocated Budget */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Allocated</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(allocatedBudget)} ({allocatedPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(allocatedPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Remaining</span>
            <div className="flex items-center gap-2">
              {remainingBudget < totalBudget * 0.1 && remainingBudget > 0 && (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="font-bold text-lg text-gray-900">
                {formatCurrency(remainingBudget)}
              </span>
            </div>
          </div>
        </div>

        {/* Budget Health Indicator */}
        {spentPercentage >= 90 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              Budget is nearly exhausted. Consider reallocating resources or increasing the budget.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
