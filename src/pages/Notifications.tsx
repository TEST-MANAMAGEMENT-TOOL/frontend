import { useState } from "react";
import { BellDot, Check, Filter, X, MoreHorizontal, Settings, CheckCircle } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  time?: string;
  status: "unread" | "read";
  type?: "info" | "alert" | "success" | "warning";
}

const notificationsData: Notification[] = [
  {
    id: "1",
    title: "New Bug Report",
    message: "A new bug report has been submitted for the dashboard module.",
    date: "Today",
    time: "10:24 AM",
    status: "unread",
    type: "alert"
  },
  {
    id: "2",
    title: "Project Update",
    message: "The project 'Dashboard' has been updated to version 2.3.",
    date: "Yesterday",
    time: "3:45 PM",
    status: "read",
    type: "info"
  },
  {
    id: "3",
    title: "User Feedback",
    message: "You have received feedback from a user regarding the new interface.",
    date: "Mon",
    time: "11:20 AM",
    status: "unread",
    type: "info"
  },
  {
    id: "4",
    title: "System Alert",
    message: "Maintenance scheduled for this weekend. Expected downtime: 2 hours.",
    date: "Sun",
    time: "4:30 PM",
    status: "read",
    type: "warning"
  },
  {
    id: "5",
    title: "Task Completed",
    message: "Your task 'Implement dark mode' has been completed successfully.",
    date: "Sun",
    time: "2:15 PM",
    status: "read",
    type: "success"
  },
];

export const Notifications = () => {
  const [notifications, setNotifications] = useState(notificationsData);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showSettings, setShowSettings] = useState(false);

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => n.status === "unread") 
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? {...n, status: "read"} : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, status: "read"})));
  };

  const getNotificationIcon = (type: Notification["type"] = "info") => {
    const iconConfig = {
      info: { icon: BellDot, color: "text-primary" },
      alert: { icon: BellDot, color: "text-destructive" },
      success: { icon: CheckCircle, color: "text-success" },
      warning: { icon: BellDot, color: "text-warning" },
    };
    
    const { icon: Icon, color } = iconConfig[type];
    return <Icon className={`h-5 w-5 ${color}`} />;
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 border-b bg-card text-card-foreground border-border shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Notifications
          </h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setFilter(filter === "all" ? "unread" : "all")}
              className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Filter notifications"
            >
              <Filter className="h-5 w-5 text-muted-foreground" />
            </button>
            <button 
              onClick={markAllAsRead}
              className="text-sm font-medium text-primary hover:text-primary/95 transition-colors"
            >
              Mark all as read
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Notification settings"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="flex mt-4 border-b border-border">
          <button
            className={`pb-2 px-4 font-medium text-sm transition-colors ${filter === "all" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`pb-2 px-4 font-medium text-sm transition-colors ${filter === "unread" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>
      </header>

      {/* Notification List */}
      <main className="flex-1 overflow-y-auto px-2 py-2">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <BellDot className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start justify-between p-4 rounded-lg cursor-pointer transition-all border
                  ${notification.status === "unread" 
                    ? "bg-primary/5 hover:bg-primary/10 border-border border-l-4 border-l-primary" 
                    : "bg-card text-card-foreground border-border hover:bg-accent/20"}`}
                onClick={() => markAsRead(notification.id)}
              >
                {/* Icon */}
                <div className="mr-3 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-medium text-foreground">
                        {notification.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-xs font-medium text-muted-foreground">
                          {notification.date}
                        </span>
                        {notification.time && (
                          <span className="block text-xs text-muted-foreground/80">
                            {notification.time}
                          </span>
                        )}
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent hover:text-accent-foreground transition-opacity">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="ml-3 flex items-center">
                  {notification.status === "unread" && (
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute right-4 top-16 bg-card text-card-foreground rounded-lg shadow-lg border border-border p-4 w-64 z-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">Notification Settings</h3>
            <button onClick={() => setShowSettings(false)}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Push notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sound alerts</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};