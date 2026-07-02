import { 
  LayoutDashboard, 
  FileText, 
  GitBranch, 
  Calendar, 
  Bug, 
  AlertTriangle,
  BarChart3,
  Settings,
  FolderTree,
  FileSpreadsheet,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/user-store";
import { hasRouteAccess } from "@/utils/rolePermissions";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavigationItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  description?: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Projects", path: "/projects" },
  { icon: Calendar, label: "Test Plan", path: "/test-plans" },
  { icon: GitBranch, label: "RTM", path: "/rtm", description: "Requirements Traceability Matrix" },
  { icon: FileText, label: "Test Cases", path: "/test-cases" },
  { icon: AlertTriangle, label: "Bug Reports", path: "/bug-reports" },
  { icon: Bug, label: "Bug Bashes", path: "/bug-bash" },
  { icon: FolderTree, label: "Test Suites", path: "/test-suites" },
  { icon: FileSpreadsheet, label: "QA Report", path: "/qa-report" },
  { icon: BarChart3, label: "Reports & Analytics", path: "/reports" },
  { icon: Users, label: "User Management", path: "/users" },
  // { icon: Bell, label: "Notifications", path: "/notifications", badge: 3 },
  { icon: User, label: "Profile", path: "/profile" },
  // { icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [user, setUser] = useState<{name: string, role: string, email: string} | null>(null);
  const currentUser = useUserStore((state) => state.currentUser);
  
  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => {
    if (!currentUser) return true; // Show all if no user (shouldn't happen in sidebar)
    return hasRouteAccess(currentUser.email, currentUser.role, item.path);
  });

  useEffect(() => {
    // Check if user data exists in localStorage or use currentUser from store
    if (currentUser) {
      setUser({
        name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || "User",
        role: currentUser.role || "User",
        email: currentUser.email || ""
      });
    } else {
      const userData = localStorage.getItem("userData");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser({
            name: parsedUser.name || "User",
            role: parsedUser.role || "User",
            email: parsedUser.email || ""
          });
        } catch (error) {
          console.error("Error parsing user data:", error);
          setUser({ name: "User", role: "User", email: "" });
        }
      } else {
        setUser({ name: "User", role: "User", email: "" });
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    
    // Navigate to login page
    navigate("/login", { replace: true });
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-sidebar-from to-sidebar-to border-r border-border transition-all duration-300 z-50 flex flex-col ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10 overflow-hidden">
              <img 
                src="https://i.postimg.cc/59gWSxjX/image.png" 
                alt="Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground font-semibold text-sm">Kiwami TestCloud</span>
              <span className="text-xs text-muted-foreground">QA Platform</span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mx-auto">
            <img 
              src="https://i.postimg.cc/Y9GGPV6J/image.png" 
              alt="Logo" 
              className="w-5 h-5 object-cover" 
            />
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md bg-background/50 hover:bg-background/80 transition-colors border border-border/50"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar mt-2">
        {filteredNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isHovered = activeHover === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center rounded-lg px-3 py-2.5 transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-primary/10 text-primary border-r-2 border-primary font-medium' 
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              } ${collapsed ? 'justify-center' : 'justify-start'}`}
              onMouseEnter={() => setActiveHover(item.path)}
              onMouseLeave={() => setActiveHover(null)}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center bg-destructive text-destructive-foreground text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              
              {!collapsed && (
                <div className="ml-3 flex flex-col">
                  <span className="text-sm">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground/70 mt-0.5">
                      {item.description}
                    </span>
                  )}
                </div>
              )}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className={`absolute left-full ml-3 px-2 py-1.5 bg-foreground text-background text-xs rounded-md shadow-lg transition-opacity duration-200 z-50 ${
                  isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  {item.label}
                  {item.description && collapsed && (
                    <div className="absolute top-full left-2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-b-foreground border-l-transparent border-r-transparent"></div>
                  )}
                </div>
              )}
              
              {/* Active indicator for collapsed state */}
              {isActive && collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-md"></div>
              )}
              
              {/* Animated hover effect */}
              <div className={`absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                isActive ? 'opacity-100' : ''
              }`}></div>
            </NavLink>
          );
        })}
      </nav>
      
      {/* Logout Section */}
      <div className="p-3 border-t border-border/30 mt-auto">
        {!collapsed ? (
          <button 
            onClick={handleLogout}
            className="flex items-center w-full rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm ml-3">Logout</span>
          </button>
        ) : (
          <button 
            onClick={handleLogout}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200 mx-auto"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};