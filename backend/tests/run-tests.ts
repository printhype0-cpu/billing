// using ts-node ESM loader for TypeScript execution
async function main() {
  // dynamically import test modules to satisfy ESM
  const mod1 = await import('./stores.controller.test.js');
  const mod2 = await import('./inventory.controller.test.js');
  const runStores = mod1.run;
  const runInventory = mod2.run;

  try {
    await runStores();
    await runInventory();
    console.log('All tests finished successfully');
  } catch (err: any) {
    console.error('Tests failed:');
    console.error(err && (err.stack || err.message || err));
    process.exit(1);
  }
}

main();
