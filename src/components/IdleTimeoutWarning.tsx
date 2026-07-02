import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle } from 'lucide-react';

interface IdleTimeoutWarningProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onLogout: () => void;
  warningDuration?: number; // Duration of warning in seconds
}

export const IdleTimeoutWarning = ({
  isOpen,
  onExtendSession,
  onLogout,
  warningDuration = 30 // 30 seconds warning
}: IdleTimeoutWarningProps) => {
  const [timeLeft, setTimeLeft] = useState(warningDuration);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(warningDuration);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, warningDuration, onLogout]);

  const progressValue = ((warningDuration - timeLeft) / warningDuration) * 100;

  const handleExtendSession = () => {
    onExtendSession();
    setTimeLeft(warningDuration);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire due to inactivity. You will be automatically logged out in{' '}
            <span className="font-semibold text-foreground">{timeLeft} seconds</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Time remaining: {timeLeft}s</span>
          </div>
          
          <Progress 
            value={progressValue} 
            className="h-2"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            Logout Now
          </Button>
          <Button
            onClick={handleExtendSession}
            className="w-full sm:w-auto"
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};