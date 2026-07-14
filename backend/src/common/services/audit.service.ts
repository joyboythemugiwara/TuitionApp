import { Service } from "@/common/decorators";
import { auditLogs, NewAuditLog, auditEntityEnum } from "@/database/schemas/tenant/audit-logs";
import { getTenantDb, getTenantSchemaName } from "@/database/client";

export type AuditEntity = typeof auditEntityEnum.enumValues[number];

export interface AuditLogOptions {
  tenantId: string;
  actorId: string;
  action: string;
  entity: AuditEntity;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
}

@Service()
export class AuditService {
  /**
   * Seamlessly inserts an audit log into the current database transaction.
   * By passing the `tx` object, the audit log shares the exact same commit/rollback lifecycle
   * as the data being modified.
   */
  async logWithinTransaction(tx: any, options: AuditLogOptions) {
    const payload: NewAuditLog = {
      actorId: options.actorId,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      oldValue: options.oldValue || null,
      newValue: options.newValue || null,
      ipAddress: options.ipAddress || null,
    };

    await tx.insert(auditLogs).values(payload);
  }

  /**
   * Inserts an audit log independently (outside of a transaction).
   */
  async logIndependently(options: AuditLogOptions) {
    const tenantDb = getTenantDb(getTenantSchemaName(options.tenantId));
    
    const payload: NewAuditLog = {
      actorId: options.actorId,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      oldValue: options.oldValue || null,
      newValue: options.newValue || null,
      ipAddress: options.ipAddress || null,
    };

    await tenantDb.insert(auditLogs).values(payload);
  }
}
