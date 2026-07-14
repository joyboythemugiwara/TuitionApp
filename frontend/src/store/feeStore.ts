import { create } from 'zustand';

export interface FeeRecord {
  id: string;
  tenantId: string;
  studentId: string;
  month: number;
  year: number;
  amount: number;
  amountPaid: number;
  dueDate: string;
  feeStatus: 'pending' | 'paid' | 'overdue';
  createdAt: string;
}

interface FeeState {
  fees: FeeRecord[];
  loading: boolean;
  error: string | null;
  setFees: (fees: FeeRecord[]) => void;
  updateFeeStatus: (id: string, amountPaid: number, status: FeeRecord['feeStatus']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFeeStore = create<FeeState>()((set) => ({
  fees: [],
  loading: false,
  error: null,
  setFees: (fees) => set({ fees, error: null }),
  updateFeeStatus: (id, amountPaid, feeStatus) =>
    set((state) => ({
      fees: state.fees.map((f) =>
        f.id === id ? { ...f, amountPaid, feeStatus } : f
      ),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
