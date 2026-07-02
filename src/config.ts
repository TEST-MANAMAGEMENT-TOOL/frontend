// Backend API base URL
export const backend_url = import.meta.env.PROD 
  ? "https://kiwamitestcloud.com/dashboardapis/api"  // Production - use the dashboard APIs path
  : "/api"  // Development - use Vite proxy