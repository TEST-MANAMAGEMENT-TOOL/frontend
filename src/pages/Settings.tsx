import React, { useState } from "react";
import { useSettingsStore } from "@/store/settings-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Bell,
  Shield,
  Palette,
  Database,
  Globe,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Settings = () => {
  const { settings, setSettings } = useSettingsStore();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [expandedSections, setExpandedSections] = useState({
    notifications: true,
    display: true,
    data: true,
    system: true,
    advanced: false
  });

  const handleSettingChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setSettings({ [field]: value });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof expandedSections]
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveStatus("idle");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage or API
      localStorage.setItem("appSettings", JSON.stringify(settings));
      
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    console.log("Exporting data...");
  };

  const handleImportData = () => {
    console.log("Importing data...");
  };

  const storageUsed = 2.5;
  const storageTotal = 100;
  const storagePercentage = (storageUsed / storageTotal) * 100;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your application preferences and configuration
          </p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          className="gap-2"
          disabled={saving}
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saveStatus === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : saveStatus === "error" ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : saveStatus === "success" ? "Saved!" : saveStatus === "error" ? "Error" : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-1">
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection("notifications")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              {expandedSections.notifications ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          {expandedSections.notifications && (
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    handleSettingChange("emailNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Browser push notifications
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    handleSettingChange("pushNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Bug Report Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify on new bug reports
                  </p>
                </div>
                <Switch
                  checked={settings.bugReportAlerts}
                  onCheckedChange={(checked) =>
                    handleSettingChange("bugReportAlerts", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>QA Report Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify on QA report updates
                  </p>
                </div>
                <Switch
                  checked={settings.qaReportAlerts}
                  onCheckedChange={(checked) =>
                    handleSettingChange("qaReportAlerts", checked)
                  }
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection("display")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Display
              </CardTitle>
              {expandedSections.display ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
            <CardDescription>
              Customize the appearance and language
            </CardDescription>
          </CardHeader>
          {expandedSections.display && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-select">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => handleSettingChange("theme", value)}
                >
                  <SelectTrigger id="theme-select">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language-select">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => handleSettingChange("language", value)}
                >
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone-select">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => handleSettingChange("timezone", value)}
                >
                  <SelectTrigger id="timezone-select">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC+3">
                      East Africa Time (UTC+3)
                    </SelectItem>
                    <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                    <SelectItem value="UTC-5">EST (UTC-5)</SelectItem>
                    <SelectItem value="UTC+8">CST (UTC+8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection("data")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
              {expandedSections.data ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
            <CardDescription>
              Manage your data backup and export settings
            </CardDescription>
          </CardHeader>
          {expandedSections.data && (
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup data
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) =>
                    handleSettingChange("autoBackup", checked)
                  }
                />
              </div>

              {settings.autoBackup && (
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value) =>
                      handleSettingChange("backupFrequency", value)
                    }
                  >
                    <SelectTrigger id="backup-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="export-format">Export Format</Label>
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value) =>
                    handleSettingChange("exportFormat", value)
                  }
                >
                  <SelectTrigger id="export-format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="flex-1 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImportData}
                  className="flex-1 gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection("system")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System
              </CardTitle>
              {expandedSections.system ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
            <CardDescription>
              Advanced system configuration
            </CardDescription>
          </CardHeader>
          {expandedSections.system && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    handleSettingChange("sessionTimeout", parseInt(e.target.value))
                  }
                  min={5}
                  max={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                <Input
                  id="max-file-size"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) =>
                    handleSettingChange("maxFileSize", parseInt(e.target.value))
                  }
                  min={1}
                  max={100}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>System Information</Label>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Version:</span>
                    <Badge variant="secondary">v1.0.0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>2024-01-15</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Storage Used:</span>
                      <span>{storageUsed} MB / {storageTotal} MB</span>
                    </div>
                    <Progress value={storagePercentage} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card className="mt-6">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection("advanced")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Advanced Settings
            </CardTitle>
            {expandedSections.advanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
          <CardDescription>
            Configure advanced system preferences
          </CardDescription>
        </CardHeader>
        {expandedSections.advanced && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Clear Cache
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove temporary files to free up space</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Reset Preferences
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Restore all settings to default values</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" className="w-full justify-start gap-2">
                <Database className="w-4 h-4" />
                View Logs
              </Button>

              <Button variant="outline" className="w-full justify-start gap-2">
                <Shield className="w-4 h-4" />
                System Diagnostics
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Settings;