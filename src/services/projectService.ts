import { api } from '../lib/api';
import { Project as ProjectType, ProjectFormData } from '@/types/project';

// Alias the Project type to avoid conflicts
export type Project = ProjectType;

export const fetchProjects = async (): Promise<Project[]> => {
  try {
    console.log('[ProjectService] Fetching projects...');
    const response = await api.get<{ details: any[] }>('/projects');
    const list = Array.isArray(response.data?.details) ? response.data.details : [];
    
    return list.map(project => ({
      id: Number(project.id), // Ensure ID is a number
      projectName: project.name || project.projectName,
      description: project.description || '',
      status: project.status || 'active',
      teamSize: project.teamSize || 0,
      startDate: project.startDate || new Date().toISOString().split('T')[0],
      endDate: project.endDate || '',
      progress: project.progress || 0,
      created_at: project.created_at,
      updated_at: project.updated_at
    }));
  } catch (error: unknown) {
    console.error('[ProjectService] Error fetching projects:', error);
    throw error;
  }
};

// Alias for fetchProjects to maintain backward compatibility
export const getAllProjects = fetchProjects;

export const fetchProject = async (id: number): Promise<Project> => {
  try {
    console.log(`[ProjectService] Fetching project ${id}...`);
    const response = await api.get<Project>(`/projects/${id}`);
    
    return {
      ...response.data,
      id: Number(response.data.id) // Ensure ID is a number
    };
  } catch (error: unknown) {
    console.error(`[ProjectService] Error fetching project ${id}:`, error);
    throw error;
  }
};

export const createProject = async (data: ProjectFormData): Promise<Project> => {
  try {
    console.log('[ProjectService] Creating project:', data);
    const response = await api.post<any>('/projects', data);
    const payload: any = response.data || {};

    return {
      id: Number(payload.id),
      projectName: payload.name || payload.projectName || payload.project_name || '',
      description: payload.description || '',
      status: payload.status || 'active',
      teamSize: payload.teamSize ?? payload.team_size ?? 0,
      startDate: payload.startDate || payload.start_date || new Date().toISOString().split('T')[0],
      endDate: payload.endDate || payload.end_date || '',
      progress: payload.progress ?? 0,
      created_at: payload.created_at,
      updated_at: payload.updated_at
    };
  } catch (error: unknown) {
    console.error('[ProjectService] Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (id: number, data: Partial<Project>): Promise<Project> => {
  try {
    console.log(`[ProjectService] Updating project ${id}:`, data);
    const response = await api.put<Project>(`/projects/${id}`, data);
    
    return {
      ...response.data,
      id: Number(response.data.id) // Ensure ID is a number
    };
  } catch (error: unknown) {
    console.error(`[ProjectService] Error updating project ${id}:`, error);
    throw error;
  }
};

export const deleteProject = async (id: number): Promise<void> => {
  try {
    console.log(`[ProjectService] Deleting project ${id}...`);
    await api.delete(`/projects/${id}`);
  } catch (error: unknown) {
    console.error(`[ProjectService] Error deleting project ${id}:`, error);
    throw error;
  }
};