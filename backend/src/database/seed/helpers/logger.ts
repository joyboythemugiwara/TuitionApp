export const seedLogger = {
  info: (msg: string) => console.log(`[SEED] 🚀 ${msg}`),
  success: (msg: string) => console.log(`[SEED] ✅ ${msg}`),
  error: (msg: string, err?: any) => {
    console.error(`[SEED] ❌ ${msg}`);
    if (err) console.error(err);
  },
  divider: () => console.log(`\n----------------------------------------\n`),
};
