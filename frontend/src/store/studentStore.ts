import { create } from 'zustand';

export interface Student {
  id: string;
  tenantId: string;
  name: string;
  schoolName: string | null;
  board: string | null;
  status: 'active' | 'inactive';
  batchId: string | null;
  phoneNumbers?: { number: string; label: string; isPrimary: boolean }[];
}

interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStudentStore = create<StudentState>()((set) => ({
  students: [],
  loading: false,
  error: null,
  setStudents: (students) => set({ students, error: null }),
  addStudent: (student) =>
    set((state) => ({ students: [...state.students, student] })),
  updateStudent: (id, updatedFields) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
