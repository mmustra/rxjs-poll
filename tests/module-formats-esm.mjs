#!/usr/bin/env node

/**
 * Standalone test script for ESM module format
 * Can be run directly: node tests/module-formats-esm.mjs
 */

import { poll, pollType, strategyType } from '../dist/esm/index.js';

function testESM() {
  console.log('Testing ESM module format...\n');

  // Test exports exist
  if (typeof poll !== 'function') {
    console.error('❌ poll is not a function');
    process.exit(1);
  }

  if (typeof pollType !== 'object' || pollType === null) {
    console.error('❌ pollType is not an object');
    process.exit(1);
  }

  if (typeof strategyType !== 'object' || strategyType === null) {
    console.error('❌ strategyType is not an object');
    process.exit(1);
  }

  // Test pollType values
  if (pollType.REPEAT !== 'repeat' || pollType.INTERVAL !== 'interval') {
    console.error('❌ pollType has incorrect values');
    process.exit(1);
  }

  // Test strategyType values
  const expectedStrategies = ['constant', 'linear', 'exponential', 'random', 'dynamic'];
  const actualStrategies = Object.values(strategyType);
  if (!expectedStrategies.every((s) => actualStrategies.includes(s))) {
    console.error('❌ strategyType has incorrect values');
    process.exit(1);
  }

  console.log('✓ ESM import successful');
  console.log('  - poll: function');
  console.log('  - pollType:', pollType);
  console.log('  - strategyType:', strategyType);
  console.log('\n✅ All ESM tests passed!');
}

testESM();
