import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTestPlanStore } from "@/store/test-plan-store";
import { FormTestPlanData, PdfTestPlanData } from "@/types/test-plan";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Check } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchProjects } from "@/services/projectService";
import type { Project } from "@/types/project";

interface TestPlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: string;
  onSuccess: (plan: PdfTestPlanData) => void;
}

const TestPlanForm = ({ open, onOpenChange, planId, onSuccess }: TestPlanFormProps) => {
  const { testPlans, addTestPlan, updateTestPlan } = useTestPlanStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormTestPlanData>({
    id: undefined,
    projectId: undefined,
    projectName: "",
    version: "1.0",
    status: "Draft",
    preparedBy: "",
    dateCreated: new Date().toISOString().split('T')[0],
    reviewedBy: "",
    approvalDate: "",
    introduction: "",
    objectives: "",
    inScope: "",
    outOfScope: "",
    testItems: "",
    testStrategy: "",
    testEnvironment: "",
    testApproach: "",
    entryCriteria: "",
    exitCriteria: "",
    testDeliverables: "",
    roles: [],
    schedule: [],
    risks: [],
    members: [],
    environmentalNeeds: "",
    responsibilities: "",
    trainingNeeds: "",
    assumptions: "",
    approvals: ""
  });

  const [newRole, setNewRole] = useState({ name: "", role: "", responsibilities: "" });
  const [newSchedule, setNewSchedule] = useState({ task: "", startDate: "", endDate: "", owner: "" });
  const [newRisk, setNewRisk] = useState({ risk: "", impact: "", mitigation: "" });
  const [newMember, setNewMember] = useState("");

  // State for date pickers
  const [dateCreated, setDateCreated] = useState<Date | null>(new Date());
  const [approvalDate, setApprovalDate] = useState<Date | null>(null);
  const [scheduleStartDate, setScheduleStartDate] = useState<Date | null>(null);
  const [scheduleEndDate, setScheduleEndDate] = useState<Date | null>(null);

  // Fetch projects when the form opens
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const projectsData = await fetchProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      loadProjects();
    }
  }, [open]);

  // Update form data when a project is selected
  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id?.toString() === projectId);
    if (selectedProject) {
      setFormData(prev => ({
        ...prev,
        projectId: Number(projectId),
        projectName: selectedProject.projectName || ""
      }));
    }
  };

  // Load test plan data when editing
  useEffect(() => {
    if (planId && testPlans) {
      const plan = testPlans.find(p => p.id === planId);
      if (plan) {
        // Transform TestPlan to FormTestPlanData
        const formData: FormTestPlanData = {
          ...plan,
          projectId: plan.id ? parseInt(plan.id) : undefined, // Convert string ID to number if needed
          testApproach: (plan as any).testApproach || "",
          environmentalNeeds: (plan as any).environmentalNeeds || "",
          responsibilities: (plan as any).responsibilities || "",
          trainingNeeds: (plan as any).trainingNeeds || "",
          assumptions: (plan as any).assumptions || "",
          approvals: (plan as any).approvals || "",
          // Ensure arrays are properly initialized
          roles: plan.roles || [],
          schedule: plan.schedule || [],
          risks: plan.risks || [],
          members: plan.members || []
        };
        setFormData(formData);
        
        // Set dates if they exist
        if (plan.dateCreated) {
          setDateCreated(new Date(plan.dateCreated));
        }
        if (plan.approvalDate) {
          setApprovalDate(new Date(plan.approvalDate));
        }
      }
    }
  }, [planId, testPlans]);

  // Reset form when dialog opens/closes or planId changes
  useEffect(() => {
    if (open) {
      if (!planId) {
        // Reset form for new plan
        resetForm();
      }
    }
  }, [planId, open]);

  // Reset form function
  const resetForm = () => {
    setFormData({
      id: undefined,
      projectId: undefined,
      projectName: "",
      version: "1.0",
      status: "Draft",
      preparedBy: "",
      dateCreated: new Date().toISOString().split('T')[0],
      reviewedBy: "",
      approvalDate: "",
      introduction: "",
      objectives: "",
      inScope: "",
      outOfScope: "",
      testItems: "",
      testStrategy: "",
      testEnvironment: "",
      testApproach: "",
      entryCriteria: "",
      exitCriteria: "",
      testDeliverables: "",
      roles: [],
      schedule: [],
      risks: [],
      members: [],
      environmentalNeeds: "",
      responsibilities: "",
      trainingNeeds: "",
      assumptions: "",
      approvals: ""
    });
    setDateCreated(new Date());
    setApprovalDate(null);
    setNewRole({ name: "", role: "", responsibilities: "" });
    setNewSchedule({ task: "", startDate: "", endDate: "", owner: "" });
    setNewRisk({ risk: "", impact: "", mitigation: "" });
    setNewMember("");
    setScheduleStartDate(null);
    setScheduleEndDate(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const planData = {
        ...formData,
        // Ensure dates are properly formatted
        dateCreated: formData.dateCreated || new Date().toISOString().split('T')[0],
        approvalDate: formData.approvalDate || undefined,
      };

      if (planId) {
        // Update existing test plan - pass both id and updates
        const updatedPlan = await updateTestPlan(planId, planData);
        onSuccess(updatedPlan);
      } else {
        // Create new test plan
        const newPlan = await addTestPlan(planData);
        onSuccess(newPlan);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving test plan:', error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addRole = () => {
    if (newRole.name.trim() && newRole.role.trim()) {
      setFormData(prev => ({
        ...prev,
        roles: [...(prev.roles || []), { ...newRole }]
      }));
      setNewRole({ name: "", role: "", responsibilities: "" });
    } else {
      alert("Please fill in at least Name and Role.");
    }
  };

  const removeRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      roles: (prev.roles || []).filter((_, i) => i !== index)
    }));
  };

  const addSchedule = () => {
    if (newSchedule.task.trim() && scheduleStartDate) {
      const scheduleItem = {
        ...newSchedule,
        startDate: scheduleStartDate ? scheduleStartDate.toISOString().split('T')[0] : "",
        endDate: scheduleEndDate ? scheduleEndDate.toISOString().split('T')[0] : ""
      };
      
      setFormData(prev => ({
        ...prev,
        schedule: [...(prev.schedule || []), scheduleItem]
      }));
      setNewSchedule({ task: "", startDate: "", endDate: "", owner: "" });
      setScheduleStartDate(null);
      setScheduleEndDate(null);
    } else {
      alert("Please fill in Task and Start Date.");
    }
  };

  const removeSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: (prev.schedule || []).filter((_, i) => i !== index)
    }));
  };

  const addRisk = () => {
    if (newRisk.risk.trim()) {
      setFormData(prev => ({
        ...prev,
        risks: [...prev.risks, { ...newRisk }]
      }));
      setNewRisk({ risk: "", impact: "", mitigation: "" });
    }
  };

  const removeRisk = (index: number) => {
    const updatedRisks = [...formData.risks];
    updatedRisks.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      risks: updatedRisks
    }));
  };

  const addMember = () => {
    if (newMember.trim()) {
      setFormData(prev => ({
        ...prev,
        members: [...(prev.members || []), newMember.trim()]
      }));
      setNewMember("");
    }
  };

  const removeMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      members: (prev.members || []).filter((_, i) => i !== index)
    }));
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString || dateString === "[Pending Approval]") return dateString;
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{planId ? "Edit Test Plan" : "Create New Test Plan"}</DialogTitle>
          <DialogDescription>
            Fill in all the details for your test plan. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="scope">Scope & Strategy</TabsTrigger>
            <TabsTrigger value="criteria">Criteria & Deliverables</TabsTrigger>
            <TabsTrigger value="roles">Roles & Schedule</TabsTrigger>
            <TabsTrigger value="team">Team & Risks</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Document Control */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project *</Label>
                <Select 
                  value={formData.projectId?.toString()}
                  onValueChange={handleProjectChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoading ? 'Loading projects...' : 'Select a project'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 && !isLoading && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No projects found
                      </div>
                    )}
                    {projects.map((project) => (
                      <SelectItem 
                        key={project.id?.toString() || 'unknown'}
                        value={project.id?.toString() || ''}
                      >
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.projectName && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.projectName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  placeholder="Version"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preparedBy">Prepared By *</Label>
                <Input
                  id="preparedBy"
                  name="preparedBy"
                  value={formData.preparedBy}
                  onChange={handleInputChange}
                  placeholder="Name of preparer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateCreated">Date Created</Label>
                <DatePicker
                  selected={dateCreated}
                  onChange={(date: Date | null) => setDateCreated(date || new Date())}
                  className="w-full p-2 border rounded-md"
                  dateFormat="MM/dd/yyyy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewedBy">Reviewed By</Label>
                <Input
                  id="reviewedBy"
                  name="reviewedBy"
                  value={formData.reviewedBy}
                  onChange={handleInputChange}
                  placeholder="Name of reviewer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approvalDate">Approval Date</Label>
                <DatePicker
                  selected={approvalDate}
                  onChange={(date: Date | null) => setApprovalDate(date)}
                  className="w-full p-2 border rounded-md"
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Select approval date"
                  isClearable
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scope" className="space-y-6">
            {/* Introduction */}
            <div className="space-y-2">
              <Label htmlFor="introduction">Introduction</Label>
              <Textarea
                id="introduction"
                name="introduction"
                value={formData.introduction}
                onChange={handleInputChange}
                rows={4}
                placeholder="Project introduction..."
              />
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <Label htmlFor="objectives">Objectives</Label>
              <Textarea
                id="objectives"
                name="objectives"
                value={formData.objectives}
                onChange={handleInputChange}
                rows={3}
                placeholder="Test objectives..."
              />
            </div>

            {/* Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inScope">In Scope</Label>
                <Textarea
                  id="inScope"
                  name="inScope"
                  value={formData.inScope}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="What is in scope..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outOfScope">Out of Scope</Label>
                <Textarea
                  id="outOfScope"
                  name="outOfScope"
                  value={formData.outOfScope}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="What is out of scope..."
                />
              </div>
            </div>

            {/* Test Approach */}
            <div className="space-y-2">
              <Label htmlFor="testApproach">Test Approach</Label>
              <Textarea
                id="testApproach"
                name="testApproach"
                value={formData.testApproach}
                onChange={handleInputChange}
                rows={4}
                placeholder="Test approach..."
              />
            </div>

            {/* Test Environment */}
            <div className="space-y-2">
              <Label htmlFor="environmentalNeeds">Test Environment</Label>
              <Textarea
                id="environmentalNeeds"
                name="environmentalNeeds"
                value={formData.environmentalNeeds}
                onChange={handleInputChange}
                rows={3}
                placeholder="Test environment details..."
              />
            </div>
          </TabsContent>

          <TabsContent value="criteria" className="space-y-6">
            {/* Entry & Exit Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entryCriteria">Entry Criteria</Label>
                <Textarea
                  id="entryCriteria"
                  name="entryCriteria"
                  value={formData.entryCriteria}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Entry criteria..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitCriteria">Exit Criteria</Label>
                <Textarea
                  id="exitCriteria"
                  name="exitCriteria"
                  value={formData.exitCriteria}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Exit criteria..."
                />
              </div>
            </div>

            {/* Test Deliverables */}
            <div className="space-y-2">
              <Label htmlFor="testDeliverables">Test Deliverables</Label>
              <Textarea
                id="testDeliverables"
                name="testDeliverables"
                value={formData.testDeliverables}
                onChange={handleInputChange}
                rows={3}
                placeholder="Test deliverables..."
              />
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            {/* Roles and Responsibilities */}
            <div className="space-y-4">
              <Label>Roles and Responsibilities</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Input
                    value={newRole.role}
                    onChange={(e) => setNewRole({ ...newRole, role: e.target.value })}
                    placeholder="Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsibilities</Label>
                  <Input
                    value={newRole.responsibilities}
                    onChange={(e) => setNewRole({ ...newRole, responsibilities: e.target.value })}
                    placeholder="Responsibilities"
                  />
                </div>
                <div className="col-span-3">
                  <Button onClick={addRole} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                  </Button>
                </div>
              </div>

              {formData.roles && formData.roles.length > 0 ? (
                formData.roles.map((role, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong>{role.name}</strong> - {role.role}: {role.responsibilities}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No roles added yet.
                </p>
              )}
            </div>

            {/* Schedule & Milestones */}
            <div className="space-y-4">
              <Label>Schedule & Milestones</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Task *</Label>
                  <Input
                    value={newSchedule.task}
                    onChange={(e) => setNewSchedule({ ...newSchedule, task: e.target.value })}
                    placeholder="Task"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <DatePicker
                    selected={scheduleStartDate}
                    onChange={(date: Date | null) => setScheduleStartDate(date)}
                    className="w-full p-2 border rounded-md"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <DatePicker
                    selected={scheduleEndDate}
                    onChange={(date: Date | null) => setScheduleEndDate(date)}
                    className="w-full p-2 border rounded-md"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="End date"
                    minDate={scheduleStartDate || undefined}
                    disabled={!scheduleStartDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Input
                    value={newSchedule.owner}
                    onChange={(e) => setNewSchedule({ ...newSchedule, owner: e.target.value })}
                    placeholder="Owner"
                  />
                </div>
                <div className="col-span-4">
                  <Button onClick={addSchedule} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule Item
                  </Button>
                </div>
              </div>

              {formData.schedule && formData.schedule.length > 0 ? (
                formData.schedule.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong>{item.task}</strong>: {formatDateForDisplay(item.startDate)} to {formatDateForDisplay(item.endDate)} (Owner: {item.owner})
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSchedule(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No schedule items added yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            {/* Risks and Mitigation */}
            <div className="space-y-4">
              <Label>Risks and Mitigation</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Risk *</Label>
                  <Input
                    value={newRisk.risk}
                    onChange={(e) => setNewRisk({ ...newRisk, risk: e.target.value })}
                    placeholder="Risk"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Impact *</Label>
                  <Input
                    value={newRisk.impact}
                    onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value })}
                    placeholder="Impact"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mitigation</Label>
                  <Input
                    value={newRisk.mitigation}
                    onChange={(e) => setNewRisk({ ...newRisk, mitigation: e.target.value })}
                    placeholder="Mitigation"
                  />
                </div>
                <div className="col-span-3">
                  <Button onClick={addRisk} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Risk
                  </Button>
                </div>
              </div>

              {formData.risks && formData.risks.length > 0 ? (
                formData.risks.map((risk, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong>{risk.risk}</strong> (Impact: {risk.impact}) - Mitigation: {risk.mitigation}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRisk(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No risks added yet.
                </p>
              )}
            </div>

            {/* Team Members */}
            <div className="space-y-4">
              <Label>Team Members</Label>
              <div className="flex gap-2">
                <Input
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="Team member name"
                />
                <Button onClick={addMember}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.members && formData.members.length > 0 ? (
                formData.members.map((member, index) => (
                  <div key={index} className="p-4 border rounded-lg flex justify-between items-center">
                    <span>{member}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No team members added yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {planId ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestPlanForm;