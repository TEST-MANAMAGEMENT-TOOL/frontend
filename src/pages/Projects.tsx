import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Users, Calendar, Target, X } from "lucide-react";
import { Project as ProjectType, ProjectStatus, ProjectFormData } from "@/types/project";
import { fetchProjects, createProject, updateProject, deleteProject } from "@/services/projectService";
import { toast } from "@/components/ui/use-toast";
import { formatDateToYMD, parseYMDDate, isYMDDateFormat } from '@/utils/dateUtils';

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectType[]>([]);

  const [newProject, setNewProject] = useState<ProjectFormData>({
    projectName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      console.log('Loading projects...');
      const data = await fetchProjects();
      console.log('Projects loaded:', data);
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error in loadProjects:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load projects",
        variant: "destructive"
      });
      setProjects([]); // Ensure we always have an array
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    try {
      if (!project) return false;

      const search = typeof searchTerm === 'string' ? searchTerm.toLowerCase() : '';

      const projectName = project.projectName ? String(project.projectName).toLowerCase() : '';
      const projectDescription = project.description ? String(project.description).toLowerCase() : '';

      const matchesSearch = search === '' ||
        projectName.includes(search) ||
        projectDescription.includes(search);

      const matchesStatus = filterStatus === 'all' ||
        (project.status && project.status === filterStatus);

      return matchesSearch && matchesStatus;
    } catch (error) {
      console.error('Error filtering projects:', error);
      return false;
    }
  });

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setNewProject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateProject = async () => {
    if (!newProject.projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive"
      });
      return;
    }

    if (newProject.projectName.trim().length > 40) {
      toast({
        title: "Error",
        description: "Project name cannot exceed 40 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Format dates before submission
      const projectToCreate = {
        ...newProject,
        startDate: formatDateToYMD(newProject.startDate || new Date().toISOString()),
        endDate: formatDateToYMD(newProject.endDate || new Date().toISOString())
      };

      // Directly pass projectToCreate since it already has the correct structure
      const createdProject = await createProject(projectToCreate);

      // Refresh the projects list from the server to ensure consistent data
      await loadProjects();

      // Reset the form
      setIsDialogOpen(false);
      setNewProject({
        projectName: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });

      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject || editingProject.id == null) return;

    if (!editingProject.projectName?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive"
      });
      return;
    }

    if (editingProject.projectName.trim().length > 40) {
      toast({
        title: "Error",
        description: "Project name cannot exceed 40 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const updatedProject = await updateProject(Number(editingProject.id), editingProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setIsEditDialogOpen(false);
      setEditingProject(null);
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      setIsLoading(true);
      await deleteProject(Number(id));

      // Refresh the projects list
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);

      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (project: ProjectType) => {
    setEditingProject({
      ...project,
      startDate: formatDateToYMD(project.startDate || ''),
      endDate: formatDateToYMD(project.endDate || '')
    });
    setIsEditDialogOpen(true);
  };

  // Rest of your component JSX remains the same, just update the event handlers to use the new functions
  // ...

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage and track all your projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Fill in the details for the new project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label>Project Name</Label>
                  <span className="text-xs text-muted-foreground">
                    {newProject.projectName.length}/40 characters
                  </span>
                </div>
                <Input
                  placeholder="Enter project name"
                  value={newProject.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  maxLength={40}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter project description"
                  value={newProject.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formatDateToYMD(newProject.startDate) || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formatDateToYMD(newProject.endDate) || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the details for the project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label>Project Name</Label>
                  <span className="text-xs text-muted-foreground">
                    {(editingProject?.projectName ?? '').length}/40 characters
                  </span>
                </div>
                <Input
                  placeholder="Enter project name"
                  value={editingProject?.projectName ?? ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, projectName: e.target.value } : prev)}
                  maxLength={40}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter project description"
                  value={editingProject?.description ?? ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, description: e.target.value } : prev)}
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={editingProject?.startDate ? formatDateToYMD(editingProject.startDate) : ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, startDate: e.target.value } : prev)}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={editingProject?.endDate ? formatDateToYMD(editingProject.endDate) : ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, endDate: e.target.value } : prev)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject}>
                Update Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-[180px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredProjects.map((project, index) => (
          <Card
            key={`project-${project.id}-${project.projectName?.replace(/\s+/g, '-').toLowerCase()}-${index}`}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader className="min-w-0">
              <div className="flex justify-between items-start gap-2 w-full min-w-0">
                <CardTitle className="text-xl font-bold truncate flex-1 min-w-0" title={project.projectName}>
                  {project.projectName}
                </CardTitle>
                <Badge className={`${getStatusColor(project.status || '')} shrink-0`}>
                  {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Unknown'}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]" title={project.description}>
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{project.teamSize ?? 0} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{project.startDate}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewDetails(project)}
                >
                  View Details
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(project)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => project.id !== undefined && handleDeleteProject(Number(project.id))}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success/15 text-success border border-success/20';
    case 'completed': return 'bg-primary/15 text-primary border border-primary/20';
    case 'on-hold': return 'bg-warning/15 text-warning border border-warning/20';
    default: return 'bg-muted text-muted-foreground border border-border';
  }
};

const handleViewDetails = (project: ProjectType) => {
  alert(`Project Details:\nName: ${project.projectName}\nDescription: ${project.description}\nStatus: ${project.status}\nTeam Size: ${project.teamSize}\nProgress: ${project.progress}%`);
};

const handleTrackProject = (project: ProjectType) => {
  alert(`Tracking project: ${project.projectName}\nThis would open a detailed tracking view for the project.`);
};

export default Projects;
