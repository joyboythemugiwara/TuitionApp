export interface PhoneInput {
  number: string;
  label: "student" | "father" | "mother" | "guardian";
  receiveNotifications: boolean;
  isPrimary: boolean;
}

export interface CreateStudentRequest {
  batchId: string;
  name: string;
  photoUrl?: string;
  schoolName?: string;
  board?: string;
  monthlyFee?: number;
  feeStartDate: string;
  phones: PhoneInput[];
}

export interface UpdateStudentRequest {
  batchId?: string;
  name?: string;
  photoUrl?: string;
  schoolName?: string;
  board?: string;
  monthlyFee?: number;
  status?: "active" | "inactive";
  phones?: PhoneInput[];
}

export interface StudentResponse {
  id: string;
  batchId: string;
  batchName?: string | null;
  name: string;
  photoUrl: string | null;
  schoolName: string | null;
  board: string | null;
  monthlyFee: string | null;
  feeStartDate: string;
  status: string;
  phones: {
    id: string;
    number: string;
    label: string;
    receiveNotifications: boolean;
    isPrimary: boolean;
  }[];
  createdAt: string;
}

export interface BulkCreateStudentRequest {
  students: CreateStudentRequest[];
}

export interface BulkUpdateStudentRequest {
  studentIds: string[];
  updates: {
    batchId?: string | null;
    status?: "active" | "inactive";
  };
}
