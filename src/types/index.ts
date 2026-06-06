export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Subtask {
   id: string;
   title: string;
   completed: boolean;
}

export interface Task {
   id: string;
   user_id: string;
   title: string;
   description?: string;
   status: TaskStatus;
   priority: TaskPriority;
   category: string;
   due_date?: string;
   estimated_minutes?: number;
   subtasks: Subtask[];
   ai_generated: boolean;
   created_at: string;
   updated_at: string;
}

export interface CreateTaskInput {
   title: string;
   description?: string;
   status?: TaskStatus;
   priority?: TaskPriority;
   category?: string;
   due_date?: string;
   estimated_minutes?: number;
   subtasks?: Subtask[];
   ai_generated?: boolean;
}

/**
 *
 *
 * Partial<T> makes every field in T optional.
 * When I'm updating a task I might only change the title — I shouldn't have to send every field. So UpdateTaskInput inherits all fields from CreateTaskInput but makes them all optional, then adds id as required because I always need to know WHICH task to update.
 *
 *
 */

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
   id: string;
}

export interface TaskFilters {
   status?: TaskStatus | 'all';
   priority?: TaskPriority | 'all';
   category?: string | 'all';
   search?: string;
}

export interface AiTaskSuggestion {
   title: string;
   description: string;
   priority: TaskPriority;
   estimated_minutes: number;
   category: string;
   subtasks: Subtask[];
}

export interface AiResponse {
   tasks?: AiTaskSuggestion[];
   subtasks?: Subtask[];
   priority?: TaskPriority;
   estimated_minutes?: number;
   message?: string;
}
