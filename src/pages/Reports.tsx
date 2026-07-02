import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar,
  AreaChart, Area, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Calendar, Download, Filter, TrendingUp, Users, Bug, CheckCircle, XCircle, 
  BarChart3, Target, Activity, Zap, ChevronDown, ChevronUp, Eye, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [projectFilter, setProjectFilter] = useState('all');
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState('overview');

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Simulate data loading
  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  // Mock data for charts
  const testExecutionData = [
    { date: 'Jan 1', passed: 45, failed: 5 },
    { date: 'Jan 2', passed: 52, failed: 8 },
    { date: 'Jan 3', passed: 48, failed: 12 },
    { date: 'Jan 4', passed: 60, failed: 10 },
    { date: 'Jan 5', passed: 55, failed: 5 },
    { date: 'Jan 6', passed: 65, failed: 8 },
    { date: 'Jan 7', passed: 70, failed: 6 },
  ];

  const bugSeverityData = [
    { name: 'Critical', value: 12, color: '#ef4444' },
    { name: 'High', value: 25, color: '#f97316' },
    { name: 'Medium', value: 38, color: '#eab308' },
    { name: 'Low', value: 45, color: '#22c55e' },
  ];

  const testCoverageData = [
    { module: 'Authentication', coverage: 95, tests: 45, trend: 'up' },
    { module: 'Payments', coverage: 82, tests: 38, trend: 'up' },
    { module: 'Dashboard', coverage: 88, tests: 52, trend: 'down' },
    { module: 'Notifications', coverage: 75, tests: 28, trend: 'up' },
    { module: 'Settings', coverage: 90, tests: 40, trend: 'stable' },
  ];

  const teamPerformanceData = [
    { name: 'Team A', bugs: 12, tests: 150, coverage: 92, velocity: 85 },
    { name: 'Team B', bugs: 8, tests: 180, coverage: 88, velocity: 92 },
    { name: 'Team C', bugs: 15, tests: 120, coverage: 85, velocity: 78 },
    { name: 'Team D', bugs: 5, tests: 200, coverage: 95, velocity: 96 },
  ];

  const testTypeData = [
    { type: 'Unit', value: 45, color: '#3b82f6' },
    { type: 'Integration', value: 30, color: '#8b5cf6' },
    { type: 'E2E', value: 15, color: '#ec4899' },
    { type: 'Performance', value: 10, color: '#f59e0b' },
  ];

  const COLORS_LIGHT = ["#16a34a", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];
  const COLORS_DARK = ["#22c55e", "#f87171", "#f97316", "#60a5fa", "#a78bfa", "#f472b6"];
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

  const gridStroke = isDark ? "#374151" : "#e5e7eb";
  const axisStroke = isDark ? "#9ca3af" : "#6b7280";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your testing performance and metrics
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="dashboard">Dashboard</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Tabs */}
      <Tabs value={activeMetric} onValueChange={setActiveMetric} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="coverage" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Coverage
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quality
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </span>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2.1%
              </span>
              <span className="text-xs text-muted-foreground ml-2">from last week</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
            <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Bug className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-red-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5
              </span>
              <span className="text-xs text-muted-foreground ml-2">from last week</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">4 teams active</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Execution Trend */}
        <Card className="lg:col-span-2 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test Execution Trend</CardTitle>
              <CardDescription>Daily test execution performance over time</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={testExecutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="date" stroke={axisStroke} fontSize={12} />
                <YAxis stroke={axisStroke} fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1f2937' : '#fff', 
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="passed" stroke="#16a34a" fillOpacity={1} fill="url(#colorPassed)" name="Passed" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" name="Failed" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-3">
            <div className="text-xs text-muted-foreground">Updated 5 minutes ago</div>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Passed: 395
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                Failed: 54
              </Badge>
            </div>
          </CardFooter>
        </Card>

        {/* Bug Severity Distribution */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Bug Severity Distribution</CardTitle>
            <CardDescription>Current open bugs by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bugSeverityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {bugSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#1f2937' : '#fff'} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} bugs`, 'Count']}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#fff', 
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {bugSeverityData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Coverage by Module */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Test Coverage</CardTitle>
            <CardDescription>Coverage percentage by module</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={testCoverageData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridStroke} />
                <XAxis type="number" domain={[0, 100]} stroke={axisStroke} fontSize={12} />
                <YAxis 
                  dataKey="module" 
                  type="category" 
                  stroke={axisStroke} 
                  fontSize={12} 
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Coverage']}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1f2937' : '#fff', 
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Bar 
                  dataKey="coverage" 
                  radius={[0, 4, 4, 0]} 
                  fill="#3b82f6"
                  name="Coverage %"
                >
                  {testCoverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.trend === 'up' ? '#16a34a' : entry.trend === 'down' ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-3">
              {testCoverageData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{item.module}</span>
                    <span className="text-sm font-medium">{item.coverage}%</span>
                  </div>
                  <Progress value={item.coverage} className="h-2" />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">{item.tests} tests</span>
                    <div className="flex items-center">
                      {item.trend === 'up' ? (
                        <ChevronUp className="h-3 w-3 text-green-500" />
                      ) : item.trend === 'down' ? (
                        <ChevronDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <span className="text-xs text-muted-foreground">→</span>
                      )}
                      <span className={`text-xs ml-1 ${
                        item.trend === 'up' ? 'text-green-500' : 
                        item.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        {item.trend === 'up' ? 'Improved' : item.trend === 'down' ? 'Declined' : 'No change'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="lg:col-span-2 transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Team Performance Metrics</CardTitle>
            <CardDescription>Comparison across testing teams</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="coverage" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="coverage">Coverage</TabsTrigger>
                  <TabsTrigger value="bugs">Bugs</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                  <TabsTrigger value="velocity">Velocity</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="coverage">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
                    <YAxis stroke={axisStroke} fontSize={12} domain={[80, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#fff', 
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="coverage" fill="#16a34a" name="Coverage %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="bugs">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
                    <YAxis stroke={axisStroke} fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#fff', 
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="bugs" fill="#ef4444" name="Bugs" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="tests">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
                    <YAxis stroke={axisStroke} fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#fff', 
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="tests" fill="#3b82f6" name="Tests" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="velocity">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teamPerformanceData}>
                    <PolarGrid stroke={gridStroke} />
                    <PolarAngleAxis dataKey="name" stroke={axisStroke} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={axisStroke} />
                    <Radar name="Velocity" dataKey="velocity" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#fff', 
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Test Type Distribution */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Test Type Distribution</CardTitle>
          <CardDescription>Breakdown of tests by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={testTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {testTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} tests`, 'Count']}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#fff', 
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center">
              {testTypeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.value}%</div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round((item.value / 100) * 1247)} tests
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;