export function run(){ return { ok: true, checkedAt: new Date(0).toISOString() }; }
if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(run()));
