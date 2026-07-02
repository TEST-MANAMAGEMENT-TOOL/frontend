import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useSettingsStore } from '@/store/settings-store';

export const SessionStatus = () => {
  const { settings } = useSettingsStore();
  const [remainingTime, setRemainingTime] = useState(0);
  
  const { getRemainingTime, isActive } = useIdleTimeout({
    timeout: settings.sessionTimeout * 60 * 1000,
    warningTime: settings.idleWarningTime * 1000,
    enabled: false // Don't create another timeout, just use for utility functions
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive()) {
        setRemainingTime(getRemainingTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getRemainingTime, isActive]);

  if (!isActive()) {
    return null;
  }

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  return (
    <Badge variant="outline" className="flex items-center gap-1 text-xs">
      <Clock className="h-3 w-3" />
      Session: {minutes}:{seconds.toString().padStart(2, '0')}
    </Badge>
  );
};