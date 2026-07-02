import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  variant = 'default',
  className = '' 
}: MetricCardProps) => {
  const getCardClass = () => {
    switch (variant) {
      case 'primary':
        return 'metric-card-primary';
      case 'success':
        return 'metric-card-success';
      case 'warning':
        return 'metric-card-warning';
      case 'destructive':
        return 'metric-card-destructive';
      default:
        return 'metric-card';
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary';
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'destructive':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={`${getCardClass()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-card-foreground">{value}</p>
          {change && (
            <p className={`text-xs ${getChangeColor()}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-md ${getIconColor()}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};