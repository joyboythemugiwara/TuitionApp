import { create } from 'zustand';

export interface Batch {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  schedule: string | null;
  status: 'active' | 'archived';
  createdAt: string;
}

interface BatchState {
  batches: Batch[];
  loading: boolean;
  error: string | null;
  setBatches: (batches: Batch[]) => void;
  addBatch: (batch: Batch) => void;
  updateBatch: (id: string, batch: Partial<Batch>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBatchStore = create<BatchState>()((set) => ({
  batches: [],
  loading: false,
  error: null,
  setBatches: (batches) => set({ batches, error: null }),
  addBatch: (batch) =>
    set((state) => ({ batches: [...state.batches, batch] })),
  updateBatch: (id, updatedFields) =>
    set((state) => ({
      batches: state.batches.map((b) => (b.id === id ? { ...b, ...updatedFields } : b)),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
