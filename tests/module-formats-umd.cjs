#!/usr/bin/env node

/**
 * Standalone test script for UMD module format
 * Tests all three UMD loading mechanisms:
 * 1. CommonJS (require)
 * 2. AMD (define)
 * 3. Global variable (browser script tag)
 * Tests both regular and minimized versions
 * Can be run directly: node tests/module-formats-umd.cjs
 */

const fsExtra = require('fs-extra');
const path = require('path');
const vm = require('vm');

const umdPath = path.resolve(__dirname, '../dist/umd/index.js');
const umdMinPath = path.resolve(__dirname, '../dist/umd/index.min.js');

async function testUMD() {
  console.log('Testing UMD module format...\n');

  let allTestsPassed = true;

  // Test regular UMD bundle
  console.log('=== Testing Regular UMD Bundle ===\n');
  const regularResults = await testUMDBundle(umdPath, 'Regular');
  allTestsPassed = allTestsPassed && regularResults;

  // Test minimized UMD bundle
  console.log('\n=== Testing Minimized UMD Bundle ===\n');
  const minResults = await testUMDBundle(umdMinPath, 'Minimized');
  allTestsPassed = allTestsPassed && minResults;

  if (allTestsPassed) {
    console.log('\n✅ All UMD tests passed!');
  } else {
    console.log('\n❌ Some UMD tests failed!');
    process.exit(1);
  }
}

async function testUMDBundle(bundlePath, bundleName) {
  // Read UMD bundle asynchronously
  const umdCode = await fsExtra.readFile(bundlePath, 'utf8');

  let allTestsPassed = true;

  // Test 1: CommonJS require (Node.js)
  console.log(`${bundleName} - 1. Testing CommonJS (require)...`);
  try {
    const { poll, pollType, strategyType } = require(bundlePath);
    if (validateExports(poll, pollType, strategyType)) {
      console.log('   ✓ CommonJS require successful');
    } else {
      console.log('   ❌ CommonJS validation failed');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ❌ CommonJS require failed:', error.message);
    allTestsPassed = false;
  }

  // Test 2: AMD (RequireJS)
  console.log(`\n${bundleName} - 2. Testing AMD (define)...`);
  try {
    let amdExports = null;
    let amdFactoryCalled = false;

    // Mock AMD environment
    const defineFn = function (deps, factory) {
      if (typeof deps === 'function') {
        // define(function() { ... })
        factory = deps;
        deps = [];
      }
      amdFactoryCalled = true;
      // Mock dependencies: ['exports', 'rxjs']
      const mockExports = {};
      const mockRxjs = require('rxjs');
      factory(mockExports, mockRxjs);
      amdExports = mockExports;
    };
    defineFn.amd = true;

    const amdContext = {
      define: defineFn,
      // Provide necessary globals for UMD detection
      exports: undefined,
      module: undefined,
      // Provide browser-like globals
      globalThis: {},
      global: {},
      self: {},
      this: {},
      // Provide rxjs as global (as it would be in browser)
      rxjs: require('rxjs'),
      // Provide console for any console.log calls
      console: console,
    };

    // Execute UMD bundle in AMD context
    const amdScript = new vm.Script(umdCode);
    amdScript.runInNewContext(amdContext, {
      filename: bundlePath,
    });

    if (amdFactoryCalled && amdExports) {
      const { poll, pollType, strategyType } = amdExports;
      if (validateExports(poll, pollType, strategyType)) {
        console.log('   ✓ AMD define successful');
      } else {
        console.log('   ❌ AMD validation failed');
        allTestsPassed = false;
      }
    } else {
      console.log('   ❌ AMD factory not called');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ❌ AMD test failed:', error.message);
    allTestsPassed = false;
  }

  // Test 3: Global variable (Browser script tag)
  console.log(`\n${bundleName} - 3. Testing Global variable (browser)...`);
  try {
    // Create a single global object that will be used by all fallbacks
    const globalObj = {};
    // Set rxjs on the global object (as it would be in browser via script tag)
    globalObj.rxjs = require('rxjs');

    // Create a context with standard JavaScript globals
    const globalContext = vm.createContext({
      // Ensure CommonJS and AMD are NOT available
      exports: undefined,
      module: undefined,
      define: undefined,
      // Provide browser-like globals - all pointing to the same object
      globalThis: globalObj,
      global: globalObj,
      self: globalObj,
      this: globalObj,
      // Provide console for any console.log calls
      console: console,
    });

    // Execute UMD bundle in global context
    const globalScript = new vm.Script(umdCode);
    globalScript.runInContext(globalContext);

    // Check if rxjsPoll was set on global object
    const rxjsPoll = globalObj.rxjsPoll;

    if (rxjsPoll) {
      const { poll, pollType, strategyType } = rxjsPoll;
      if (validateExports(poll, pollType, strategyType)) {
        console.log('   ✓ Global variable (rxjsPoll) successful');
      } else {
        console.log('   ❌ Global variable validation failed');
        allTestsPassed = false;
      }
    } else {
      console.log('   ❌ Global variable rxjsPoll not found');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Global variable test failed:', error.message);
    if (error.stack) {
      console.log('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    allTestsPassed = false;
  }

  return allTestsPassed;
}

function validateExports(poll, pollType, strategyType) {
  // Test exports exist
  if (typeof poll !== 'function') {
    console.error('   ❌ poll is not a function');
    return false;
  }

  if (typeof pollType !== 'object' || pollType === null) {
    console.error('   ❌ pollType is not an object');
    return false;
  }

  if (typeof strategyType !== 'object' || strategyType === null) {
    console.error('   ❌ strategyType is not an object');
    return false;
  }

  // Test pollType values
  if (pollType.REPEAT !== 'repeat' || pollType.INTERVAL !== 'interval') {
    console.error('   ❌ pollType has incorrect values');
    return false;
  }

  // Test strategyType values
  const expectedStrategies = ['constant', 'linear', 'exponential', 'random', 'dynamic'];
  const actualStrategies = Object.values(strategyType);
  if (!expectedStrategies.every((s) => actualStrategies.includes(s))) {
    console.error('   ❌ strategyType has incorrect values');
    return false;
  }

  return true;
}

// Run async test function
testUMD().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
