import os

files = {
    'src/modules/fees/fees.repository.ts': [
        ('return await tenantDb\n      .select()\n      .from(students)\n      .where(eq(students.status, "active"));',
         'return await withTenantTx(tenantId, async (tx) => {\n      return await tx\n        .select()\n        .from(students)\n        .where(eq(students.status, "active"));\n    });'),
        ('const [record] = await tenantDb.select().from(feeRecords).where(eq(feeRecords.id, id)).limit(1);',
         'return await withTenantTx(tenantId, async (tx) => {\n      const [record] = await tx.select().from(feeRecords).where(eq(feeRecords.id, id)).limit(1);\n      return record;\n    });'),
        ('return record;', '') # Need to remove the return record below it
    ],
    'src/modules/announcements/announcements.repository.ts': [
        ('const [announcement] = await tenantDb\n      .select()\n      .from(announcements)\n      .where(eq(announcements.id, id))\n      .limit(1);\n    return announcement;',
         'return await withTenantTx(tenantId, async (tx) => {\n      const [announcement] = await tx\n        .select()\n        .from(announcements)\n        .where(eq(announcements.id, id))\n        .limit(1);\n      return announcement;\n    });'),
        ('let query = tenantDb.select().from(announcements).$dynamic();\n    \n    if (status) {\n      query = query.where(eq(announcements.status, status));\n    }\n    \n    // Sort by created at desc by default\n    // We could add standard orderBy, but skipping for brevity\n    return await query;',
         'return await withTenantTx(tenantId, async (tx) => {\n      let query = tx.select().from(announcements).$dynamic();\n      if (status) {\n        query = query.where(eq(announcements.status, status));\n      }\n      return await query;\n    });')
    ]
}

for filepath, replacements in files.items():
    with open(filepath, 'r') as f:
        content = f.read()
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
        else:
            print(f"Could not find '{old}' in {filepath}")
    with open(filepath, 'w') as f:
        f.write(content)
