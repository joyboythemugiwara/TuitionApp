import os
import glob
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "withTenantTx" not in content and ("tenantDb" in content or "getTenantDb" in content):
        # Import withTenantTx
        content = content.replace('import { getTenantDb, getTenantSchemaName }', 'import { getTenantDb, getTenantSchemaName, withTenantTx }')
        
        # Replace return await tenantDb.transaction(async (tx) => {
        content = re.sub(
            r'return await tenantDb\.transaction\(async \(tx\) => \{',
            r'return await withTenantTx(tenantId, async (tx) => {',
            content
        )
        # Replace await tenantDb.transaction(async (tx) => {
        content = re.sub(
            r'await tenantDb\.transaction\(async \(tx\) => \{',
            r'await withTenantTx(tenantId, async (tx) => {',
            content
        )
        
        # We need to handle single queries that use tenantDb.select outside of a transaction!
        # Like in announcements.repository.ts:
        # const [announcement] = await tenantDb.select().from(announcements).where(eq(announcements.id, id)).limit(1);
        # return announcement;
        
    with open(filepath, 'w') as f:
        f.write(content)

for filepath in glob.glob('src/modules/**/*.repository.ts', recursive=True):
    fix_file(filepath)
