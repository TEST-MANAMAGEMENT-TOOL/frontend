import React from 'react';
import { BugBash } from '@/types/bug-bash';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  bugBash: BugBash;
  functionalCounts?: { bugs: number; features: number; improvements: number };
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ bugBash, functionalCounts }) => {
  const { functional = [], performance = [], security = [] } = bugBash;

  // Functional metrics - use provided counts if available, otherwise calculate from bugBash
  const bugs = functionalCounts?.bugs ?? functional.filter(issue => issue.type === 'bug').length;
  const features = functionalCounts?.features ?? functional.filter(issue => issue.type === 'feature').length;
  const improvements = functionalCounts?.improvements ?? functional.filter(issue => issue.type === 'improvement').length;
  
  // Performance metrics (get latest test)
  const latestPerformance = performance.length > 0 
    ? performance[performance.length - 1] 
    : null;

  const cards = [
    {
      title: 'Functional',
      icon: '📝',
      color: 'bg-blue-500',
      metrics: [
        { label: 'Total Bugs', value: bugs },
        { label: 'Features', value: improvements }
      ]
    },
    {
      title: 'Security',
      icon: '🔒',
      color: 'bg-red-500',
      metrics: [
        { 
          label: 'Vulnerabilities', 
          value: security.length,
          severity: security.length > 0 ? 'high' : 'none'
        }
      ]
    },
    {
      title: 'Performance',
      icon: '⚡',
      color: 'bg-amber-500',
      metrics: latestPerformance ? [
        { label: 'TPS', value: latestPerformance.tps?.toFixed(1) || 'N/A' },
        { 
          label: 'Error Rate', 
          value: latestPerformance.errorRate ? `${latestPerformance.errorRate.toFixed(1)}%` : 'N/A',
          severity: latestPerformance.errorRate > 5 ? 'high' : 'none'
        },
        { 
          label: 'Avg. Response', 
          value: latestPerformance.avgResponseTime ? `${latestPerformance.avgResponseTime}ms` : 'N/A'
        }
      ] : [
        { label: 'No tests run', value: '' }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={cn(
            "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border",
            "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
          )}
        >
          <div className={cn("absolute top-0 left-0 w-1 h-full", card.color)} />
          
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl",
                card.color
              )}>
                {card.icon}
              </div>
              <CardTitle className="text-lg font-semibold">
                {card.title}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2">
              {card.metrics.map((metric, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    metric.severity === 'high' ? 'text-red-500' : 'text-foreground'
                  )}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;