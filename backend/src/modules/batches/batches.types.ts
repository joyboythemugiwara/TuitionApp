export interface CreateBatchRequest {
  name: string;
  schedule?: string;
  defaultFee: number;
  teacherIds?: string[];
}

export interface UpdateBatchRequest {
  name?: string;
  schedule?: string;
  defaultFee?: number;
  archived?: boolean;
}

export interface BatchResponse {
  id: string;
  name: string;
  schedule: string | null;
  defaultFee: string;
  archived: boolean;
  createdAt: string;
}

export interface BatchWithTeachersResponse extends BatchResponse {
  teachers: {
    userId: string;
    name: string;
    assignedAt: string;
  }[];
}

export interface AssignTeachersRequest {
  teacherIds: string[];
}
