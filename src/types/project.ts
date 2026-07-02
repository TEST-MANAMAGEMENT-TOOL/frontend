export type ProjectStatus = 'active' | 'completed' | 'on-hold';

export interface Project {
  id?: number;
  projectName: string;
  description: string;
  startDate: string;
  endDate: string;
  status?: ProjectStatus;
  teamSize?: number;
  progress?: number;
  created_at?: string;
  updated_at?: string | null;
  createdBy?: string;
  updatedBy?: string;
}

export interface ProjectFormData {
  projectName: string;
  description: string;
  startDate: string;
  endDate: string;
}
