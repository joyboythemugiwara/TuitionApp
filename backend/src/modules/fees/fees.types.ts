export interface GenerateFeesRequest {
  month: string; // YYYY-MM-01 format
  batchId?: string;
  studentId?: string;
}

export interface MarkPaymentRequest {
  feeRecordId: string;
  amount: number;
  mode: "online" | "cash";
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  transactionId?: string;
}

export interface FeeRecordResponse {
  id: string;
  studentId: string;
  studentName?: string;
  studentPhone?: string;
  month: string;
  amount: string;
  amountPaid: string;
  dueDate: string;
  status: string;
  waiverReason: string | null;
  paymentLinkUrl: string | null;
  createdAt: string;
}

export interface PaymentResponse {
  id: string;
  feeRecordId: string;
  amount: string;
  mode: string;
  paidAt: string;
}

export interface GeneratePaymentLinkResponse {
  paymentLinkUrl: string;
  paymentLinkId: string;
}
