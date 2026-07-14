import { ConflictError, NotFoundError, BadRequestError, ForbiddenError, UnauthorizedError } from "./http.error";

// Auth
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("Invalid email or password", "INVALID_CREDENTIALS");
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super("Token has expired", "TOKEN_EXPIRED");
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super("Invalid token", "INVALID_TOKEN");
  }
}

// Tenant
export class TenantNotFoundError extends NotFoundError {
  constructor() {
    super("Tenant not found", "TENANT_NOT_FOUND");
  }
}

export class TenantSlugTakenError extends ConflictError {
  constructor() {
    super("Tenant slug already taken", "TENANT_SLUG_TAKEN");
  }
}

export class TenantSuspendedError extends ForbiddenError {
  constructor() {
    super("Tenant account is suspended", "TENANT_SUSPENDED");
  }
}

// User
export class UserNotFoundError extends NotFoundError {
  constructor() {
    super("User not found", "USER_NOT_FOUND");
  }
}

export class EmailAlreadyExistsError extends ConflictError {
  constructor() {
    super("Email already exists", "EMAIL_ALREADY_EXISTS");
  }
}

// Student
export class StudentNotFoundError extends NotFoundError {
  constructor() {
    super("Student not found", "STUDENT_NOT_FOUND");
  }
}

// Batch
export class BatchNotFoundError extends NotFoundError {
  constructor() {
    super("Batch not found", "BATCH_NOT_FOUND");
  }
}

export class BatchArchivedError extends BadRequestError {
  constructor() {
    super("Batch is archived", "BATCH_ARCHIVED");
  }
}

// Fee
export class FeeRecordNotFoundError extends NotFoundError {
  constructor() {
    super("Fee record not found", "FEE_RECORD_NOT_FOUND");
  }
}

export class FeeAlreadyPaidError extends BadRequestError {
  constructor() {
    super("Fee is already paid", "FEE_ALREADY_PAID");
  }
}

export class FeeAlreadyWaivedError extends BadRequestError {
  constructor() {
    super("Fee is already waived", "FEE_ALREADY_WAIVED");
  }
}

export class InvalidPaymentAmountError extends BadRequestError {
  constructor() {
    super("Payment amount exceeds balance", "INVALID_PAYMENT_AMOUNT");
  }
}

// Announcement
export class AnnouncementNotFoundError extends NotFoundError {
  constructor() {
    super("Announcement not found", "ANNOUNCEMENT_NOT_FOUND");
  }
}

export class AnnouncementAlreadySentError extends BadRequestError {
  constructor() {
    super("Announcement has already been sent", "ANNOUNCEMENT_ALREADY_SENT");
  }
}