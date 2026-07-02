import { Search, Bell, User, X, Settings, LogOut, Rocket, Menu, CheckCircle, AlertCircle, Info, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/user-store";
import { isDemoUser } from "@/utils/auth-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onMenuClick?: () => void;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "warning" | "info";
  read: boolean;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Test Suite Completed",
      description: "Your automated tests for Project Alpha finished successfully.",
      time: "2 min ago",
      type: "success",
      read: false,
    },
    {
      id: "2",
      title: "New Bug Assigned",
      description: "Critical issue in login flow assigned to you.",
      time: "15 min ago",
      type: "warning",
      read: false,
    },
    {
      id: "3",
      title: "Weekly Report Ready",
      description: "Your test coverage report is now available.",
      time: "1 hour ago",
      type: "info",
      read: true,
    },
  ]);

  const navigate = useNavigate();
  const { currentUser, logout } = useUserStore();
  const isDemo = isDemoUser(currentUser?.email);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getUserDisplayInfo = () => {
    if (currentUser) {
      const name = currentUser.firstName && currentUser.lastName
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : currentUser.email?.split('@')[0] || 'User';
      return {
        name,
        initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      };
    }
    return { name: 'User', initials: 'U' };
  };

  const { name, initials } = getUserDisplayInfo();

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "info": default: return <Info className="h-4 w-4 text-sky-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Logo + Menu */}
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl hover:bg-accent/70 transition-all duration-200"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div 
            className="flex items-center gap-3 cursor-pointer group transition-all duration-300"
            onClick={() => navigate("/")}
          >
            <div className="relative p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Rocket className="h-5 w-5 text-primary" />
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                TestManagement
              </span>
              <div className="h-px w-full bg-gradient-to-r from-primary/50 to-transparent mt-1" />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl hover:bg-accent/70 transition-all"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Search Bar */}
          <div className={cn(
            "absolute inset-x-0 top-16 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 transition-all duration-300 md:relative md:inset-auto md:top-auto md:bg-transparent md:backdrop-blur-none md:border-0 md:p-0 md:flex",
            searchOpen ? "flex animate-in slide-in-from-top" : "hidden md:flex"
          )}>
            <div className={cn(
              "relative group w-full md:w-80 lg:w-96 transition-all duration-200",
              searchFocused && "ring-2 ring-primary/20 ring-offset-2 rounded-xl"
            )}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
              <Input
                type="search"
                placeholder="Search tests, bugs, projects..."
                className="h-11 pl-10 pr-10 bg-muted/50 border-0 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-sm font-medium transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
                {searchOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-accent/70"
                    onClick={() => setSearchOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle className="rounded-xl hover:bg-accent/70 transition-all" />

          {/* Notifications - HIDDEN */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative rounded-xl hover:bg-accent/70 transition-all duration-200",
                  unreadCount > 0 && "animate-pulse"
                )}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold animate-bounce"
                    variant="destructive"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden rounded-2xl shadow-2xl border-border/50">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent">
                <DropdownMenuLabel className="text-base font-bold p-0">
                  Notifications
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-medium hover:bg-accent/70"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {notifications.map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        className={cn(
                          "flex gap-3 p-4 cursor-pointer transition-all hover:bg-accent/50",
                          !notif.read && "bg-primary/5"
                        )}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className={cn(
                          "p-2 rounded-full",
                          notif.type === "success" && "bg-emerald-500/10",
                          notif.type === "warning" && "bg-amber-500/10",
                          notif.type === "info" && "bg-sky-500/10"
                        )}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold leading-none">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.description}</p>
                          <p className="text-xs text-muted-foreground/70">{notif.time}</p>
                        </div>
                        {!notif.read && (
                          <div className="h-2 w-2 rounded-full bg-primary self-start mt-1.5" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="m-0" />
              <DropdownMenuItem 
                className="justify-center py-3 text-sm font-semibold text-primary hover:bg-accent/50 rounded-b-2xl"
                onClick={() => navigate("/notifications")}
              >
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="group relative h-10 rounded-xl p-1.5 hover:bg-accent/70 transition-all duration-200 hover:ring-2 hover:ring-primary/10"
              >
                <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  <AvatarImage src={currentUser?.avatar} alt={name} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2 rounded-2xl shadow-2xl border-border/50" align="end" forceMount>
              <div className="p-3 pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-40">{currentUser?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator className="mx-2" />
              <DropdownMenuItem 
                className="mx-2 my-1 rounded-lg font-medium"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              {/* <DropdownMenuItem 
                className="mx-2 my-1 rounded-lg font-medium"
                onClick={() => navigate('/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem> */}
              <DropdownMenuSeparator className="mx-2" />
              <DropdownMenuItem 
                className="mx-2 my-1 rounded-lg font-medium text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};