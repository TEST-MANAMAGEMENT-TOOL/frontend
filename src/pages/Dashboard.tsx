import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Bug, 
  Users,
  TrendingUp,
  Calendar,
  Filter
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import { useEffect, useState } from "react";

// 🔽 Added (kept small and local): Filter UI pieces from shadcn
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Mock Data for Multiple Projects
const projectData = {
  "Auth Module": {
    metrics: {
      total: "1,247",
      passed: "1,089",
      failed: "98",
      bugs: "24",
    },
    testCaseStatusData: [
      { name: "Passed", value: 1089, color: "#16a34a" },
      { name: "Failed", value: 98, color: "#ef4444" },
      { name: "Skipped", value: 35, color: "#f59e0b" },
      { name: "Blocked", value: 25, color: "#3b82f6" }
    ],
    bugSeverityData: [
      { name: "Critical", value: 3 },
      { name: "High", value: 8 },
      { name: "Medium", value: 7 },
      { name: "Low", value: 6 }
    ],
    executionTrend: [
      { date: "Mon", passed: 50, failed: 5 },
      { date: "Tue", passed: 65, failed: 7 },
      { date: "Wed", passed: 80, failed: 10 },
      { date: "Thu", passed: 70, failed: 6 },
      { date: "Fri", passed: 90, failed: 8 }
    ],
    planProgressData: [
      { plan: "Auth Module", progress: 80 },
      { plan: "Payments", progress: 65 },
    ],
    activities: [
      { id: 1, type: "test_execution", message: "Test Plan 'Authentication' completed", time: "2 hours ago", status: "success" },
      { id: 2, type: "bug_report", message: "Critical bug in login flow", time: "4 hours ago", status: "critical" },
    ]
  },
  "Payments": {
    metrics: {
      total: "985",
      passed: "820",
      failed: "165",
      bugs: "31",
    },
    testCaseStatusData: [
      { name: "Passed", value: 820, color: "#16a34a" },
      { name: "Failed", value: 165, color: "#ef4444" },
      { name: "Skipped", value: 45, color: "#f59e0b" },
      { name: "Blocked", value: 35, color: "#3b82f6" }
    ],
    bugSeverityData: [
      { name: "Critical", value: 5 },
      { name: "High", value: 10 },
      { name: "Medium", value: 9 },
      { name: "Low", value: 7 }
    ],
    executionTrend: [
      { date: "Mon", passed: 40, failed: 8 },
      { date: "Tue", passed: 55, failed: 12 },
      { date: "Wed", passed: 70, failed: 14 },
      { date: "Thu", passed: 65, failed: 9 },
      { date: "Fri", passed: 80, failed: 10 }
    ],
    planProgressData: [
      { plan: "Gateway", progress: 75 },
      { plan: "Refunds", progress: 50 },
    ],
    activities: [
      { id: 1, type: "test_case", message: "10 new test cases added for refunds", time: "1 day ago", status: "info" },
      { id: 2, type: "bug_bash", message: "Bug Bash scheduled for gateway", time: "2 days ago", status: "warning" },
    ]
  }
};

export const Dashboard = () => {
  const navigate = useNavigate();

  const [selectedProject, setSelectedProject] = useState("Auth Module");
  const project = projectData[selectedProject];

  const suitesMap: Record<string, string[]> = {
    "Auth Module": ["Smoke", "Regression", "E2E"],
    "Payments": ["Gateway", "Refunds", "Reconciliation"],
  };
  const [selectedSuite, setSelectedSuite] = useState<string | undefined>(undefined);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const COLORS_LIGHT = ["#16a34a", "#ef4444", "#f59e0b", "#3b82f6"];
  const COLORS_DARK  = ["#22c55e", "#f87171", "#f97316", "#60a5fa"];
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

  const linePassed = isDark ? "#22c55e" : "#16a34a";
  const lineFailed = isDark ? "#f87171" : "#ef4444";
  const barColor   = isDark ? "#60a5fa" : "#3b82f6";
  const gridStroke = isDark ? "#374151" : "#e5e7eb";
  const axisStroke = isDark ? "#9ca3af" : "#374151";
  const tooltipStyle = {
    backgroundColor: isDark ? "#0B1220" : "#ffffff",
    border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
    color: isDark ? "#e5e7eb" : "#111827"
  };

  const getActivityBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-success/15 text-success border border-success/20 hover:bg-success/25 dark:bg-success/20 dark:text-success dark:border-success/20">Completed</Badge>;
      case 'critical': return <Badge className="bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/25 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/20">Critical</Badge>;
      case 'warning': return <Badge className="bg-warning/15 text-warning border border-warning/20 hover:bg-warning/25 dark:bg-warning/20 dark:text-warning dark:border-warning/20">Scheduled</Badge>;
      default: return <Badge className="bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 dark:bg-primary/20 dark:text-primary dark:border-primary/20">Info</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Viewing data for <span className="font-semibold">{selectedProject}</span>
            {selectedSuite ? <span className="ml-1">/ <span className="font-medium">{selectedSuite}</span></span> : null}
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            className="sr-only border rounded-lg px-3 py-1 text-sm"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {Object.keys(projectData).map((proj) => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
          </select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select
                  value={selectedProject}
                  onValueChange={(v) => {
                    setSelectedProject(v);
                    const suites = suitesMap[v] ?? [];
                    if (!suites.includes(selectedSuite || "")) setSelectedSuite(undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose project" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(projectData).map((proj) => (
                      <SelectItem key={proj} value={proj}>{proj}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Test Suite</label>
                <Select
                  value={selectedSuite}
                  onValueChange={(v) => setSelectedSuite(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All suites" />
                  </SelectTrigger>
                  <SelectContent>
                    {(suitesMap[selectedProject] ?? []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" className="w-full">Apply Filters</Button>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={() => navigate("/test-plans")}>
            <Calendar className="w-4 h-4 mr-2" />
            New Test Plan
          </Button>
          <Button size="sm" onClick={() => navigate("/bug-reports")}>
            <Bug className="w-4 h-4 mr-2" />
            Report Bug
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Test Cases" value={project.metrics.total} change="+12% from last month" changeType="positive" icon={FileText} variant="primary" />
        <MetricCard title="Tests Passed" value={project.metrics.passed} change="87.3% success rate" changeType="positive" icon={CheckCircle} variant="success" />
        <MetricCard title="Tests Failed" value={project.metrics.failed} change="-5% from last week" changeType="negative" icon={XCircle} variant="destructive" />
        <MetricCard title="Open Bugs" value={project.metrics.bugs} change="Across all severities" changeType="neutral" icon={Bug} variant="warning" />
      </div>

      {/* Graphical View + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Charts (2 columns inside) */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Case Status */}
          <Card>
  <CardHeader><CardTitle>Test Case Status</CardTitle></CardHeader>
  <CardContent className="flex flex-col items-center">
    <div className="relative">
      <PieChart width={250} height={200}>
        <Pie data={project.testCaseStatusData} dataKey="value" outerRadius={80} label>
          {project.testCaseStatusData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </div>
    {/* Legend/Key */}
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      {project.testCaseStatusData.map((entry, index) => (
        <div key={index} className="flex items-center">
          <div 
            className="w-3 h-3 mr-2 rounded-sm" 
            style={{ backgroundColor: entry.color }}>
            </div>
          <span className="text-sm">{entry.name}</span>
        </div>
      ))}
    </div>
    </CardContent>
    </Card>
          {/* Bug Severity */}
          <Card>
            <CardHeader><CardTitle>Bug Severity Distribution</CardTitle></CardHeader>
            <CardContent>
              <PieChart width={250} height={200}>
                <Pie 
                  data={project.bugSeverityData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={60} 
                  innerRadius={30}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {project.bugSeverityData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value} bugs`, name]} />
                <Legend wrapperStyle={{ color: axisStroke, fontSize: '12px' }} />
              </PieChart>
            </CardContent>
          </Card>

          {/* Execution Trend */}
          <Card>
            <CardHeader><CardTitle>Test Execution Trend</CardTitle></CardHeader>
            <CardContent>
              <LineChart width={250} height={200} data={project.executionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke={axisStroke} 
                  tick={{ fill: axisStroke, fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis 
                  stroke={axisStroke} 
                  tick={{ fill: axisStroke, fontSize: 12 }}
                  tickMargin={8}
                />
                <Tooltip 
                  contentStyle={{
                    ...tooltipStyle,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }} 
                  formatter={(value, name) => [`${value} tests`, name === 'passed' ? 'Passed' : 'Failed']}
                />
                <Legend 
                  wrapperStyle={{ 
                    color: axisStroke, 
                    fontSize: '12px',
                    paddingTop: '10px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="passed" 
                  stroke={linePassed} 
                  strokeWidth={2}
                  dot={{ fill: linePassed, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: linePassed, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke={lineFailed} 
                  strokeWidth={2}
                  dot={{ fill: lineFailed, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: lineFailed, strokeWidth: 2 }}
                />
              </LineChart>
            </CardContent>
          </Card>

          {/* Test Plan Progress */}
          <Card>
            <CardHeader><CardTitle>Test Plan Progress</CardTitle></CardHeader>
            <CardContent>
              <BarChart width={250} height={200} data={project.planProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                <XAxis 
                  dataKey="plan" 
                  stroke={axisStroke} 
                  tick={{ fill: axisStroke, fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis 
                  stroke={axisStroke} 
                  tick={{ fill: axisStroke, fontSize: 12 }}
                  tickMargin={8}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    ...tooltipStyle,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }} 
                  formatter={(value) => [`${value}% complete`, 'Progress']}
                />
                <Legend wrapperStyle={{ color: axisStroke, fontSize: '12px' }} />
                <Bar 
                  dataKey="progress" 
                  fill={barColor}
                  radius={[4, 4, 0, 0]}
                >
                  {project.planProgressData.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={barColor}
                      opacity={0.8 + (index * 0.1)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg font-semibold">
                <Users className="w-5 h-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Frequently used testing actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: FileText, title: "Create Test Plan", desc: "Add new test scenarios", action: () => navigate("/test-plans") },
                { icon: Bug, title: "Report Bug", desc: "Submit new defect", action: () => navigate("/bug-reports") },
                { icon: Calendar, title: "Schedule Bug Bash", desc: "Organize testing session", action: () => navigate("/bug-bash") },
                { icon: Clock, title: "Run Test Suite", desc: "Execute test plans", action: () => navigate("/test-suites") },
              ].map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-start h-12 text-left text-sm hover:shadow-md transition rounded-lg"
                  onClick={action.action}
                >
                  <action.icon className="w-4 h-4 mr-3 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-semibold">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest updates for {selectedProject}{selectedSuite ? ` — ${selectedSuite}` : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border hover:bg-muted/60 transition">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                {getActivityBadge(activity.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
