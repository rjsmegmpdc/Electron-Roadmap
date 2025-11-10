#!/usr/bin/env node

/**
 * Automated Test Runner for Secure Token Management System
 * 
 * This script runs all test suites and generates comprehensive reports
 * suitable for CI/CD integration.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  const line = '='.repeat(60);
  log(`\n${line}`, colors.cyan);
  log(message, colors.cyan + colors.bright);
  log(line, colors.cyan);
}

function logSubHeader(message) {
  log(`\n--- ${message} ---`, colors.yellow + colors.bright);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}: ${command} ${args.join(' ')}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTestSuite(name, command, args, options = {}) {
  logSubHeader(`Running ${name} Tests`);
  
  const startTime = Date.now();
  let success = false;
  
  try {
    await runCommand(command, args, options);
    const duration = Date.now() - startTime;
    log(`✅ ${name} tests completed successfully in ${duration}ms`, colors.green);
    success = true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ ${name} tests failed after ${duration}ms`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    success = false;
  }

  return { name, success, duration: Date.now() - startTime };
}

async function checkPrerequisites() {
  logSubHeader('Checking Prerequisites');
  
  // Check if Node.js is installed
  try {
    await runCommand('node', ['--version'], { stdio: 'pipe' });
    log('✅ Node.js is installed', colors.green);
  } catch (error) {
    log('❌ Node.js is not installed or not in PATH', colors.red);
    process.exit(1);
  }

  // Check if npm/dependencies are installed
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    log('❌ Dependencies not installed. Run "npm install" first.', colors.red);
    process.exit(1);
  }
  log('✅ Dependencies are installed', colors.green);

  // Check if Jest is available
  try {
    await runCommand('npx', ['jest', '--version'], { stdio: 'pipe' });
    log('✅ Jest is available', colors.green);
  } catch (error) {
    log('❌ Jest is not available', colors.red);
    process.exit(1);
  }
}

async function buildProject() {
  logSubHeader('Building Project');
  
  try {
    // Ensure TypeScript compilation works
    await runCommand('npx', ['tsc', '--noEmit'], { stdio: 'pipe' });
    log('✅ TypeScript compilation successful', colors.green);
  } catch (error) {
    log('❌ TypeScript compilation failed', colors.red);
    throw error;
  }
}

function generateReport(results, totalDuration) {
  logSubHeader('Test Results Summary');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  log(`\nTest Suite Results:`, colors.bright);
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? colors.green : colors.red;
    log(`  ${status} ${result.name} (${result.duration}ms)`, color);
  });
  
  log(`\nSummary:`, colors.bright);
  log(`  Total Test Suites: ${totalTests}`);
  log(`  Passed: ${passedTests}`, passedTests > 0 ? colors.green : colors.reset);
  log(`  Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.reset);
  log(`  Total Duration: ${totalDuration}ms`);
  
  const successRate = (passedTests / totalTests) * 100;
  log(`  Success Rate: ${successRate.toFixed(1)}%`, successRate === 100 ? colors.green : colors.yellow);
  
  return { totalTests, passedTests, failedTests, successRate, totalDuration };
}

function generateJUnitReport(results, outputPath) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
${results.map(result => `
  <testsuite name="${result.name}" tests="1" failures="${result.success ? 0 : 1}" time="${result.duration / 1000}">
    <testcase name="${result.name} Test Suite" time="${result.duration / 1000}">
      ${result.success ? '' : '<failure message="Test suite failed">Test suite execution failed</failure>'}
    </testcase>
  </testsuite>`).join('')}
</testsuites>`;

  fs.writeFileSync(outputPath, xml);
  log(`JUnit report generated: ${outputPath}`, colors.blue);
}

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  const isCI = process.env.CI === 'true' || args.includes('--ci');
  const generateReports = args.includes('--reports') || isCI;
  const runPerformance = args.includes('--performance') || args.includes('--all');

  logHeader('🔐 Secure Token Management System - Test Runner');
  
  if (isCI) {
    log('Running in CI mode', colors.blue);
  }

  try {
    // Prerequisites check
    await checkPrerequisites();
    
    // Build project
    await buildProject();
    
    // Test suites configuration
    const testSuites = [
      {
        name: 'Unit Tests (Security)',
        command: 'npx',
        args: ['jest', 'tests/security', '--verbose', '--coverage', '--coverageDirectory=coverage/security']
      },
      {
        name: 'Integration Tests',
        command: 'npx',
        args: ['jest', 'tests/integration', '--verbose', '--runInBand']
      }
    ];

    // Add performance tests if requested
    if (runPerformance) {
      testSuites.push({
        name: 'Performance Tests',
        command: 'npx',
        args: ['jest', 'tests/performance', '--verbose', '--runInBand', '--testTimeout=60000']
      });
    }

    // Run all test suites
    logHeader('🧪 Running Test Suites');
    const results = [];
    
    for (const suite of testSuites) {
      const result = await runTestSuite(suite.name, suite.command, suite.args);
      results.push(result);
    }

    const totalDuration = Date.now() - startTime;
    const summary = generateReport(results, totalDuration);

    // Generate reports if requested
    if (generateReports) {
      logSubHeader('Generating Reports');
      
      const reportsDir = path.join(process.cwd(), 'test-reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      // JUnit XML report
      generateJUnitReport(results, path.join(reportsDir, 'junit.xml'));
      
      // JSON report
      const jsonReport = {
        timestamp: new Date().toISOString(),
        summary,
        results,
        environment: {
          node_version: process.version,
          platform: process.platform,
          ci: isCI
        }
      };
      
      fs.writeFileSync(
        path.join(reportsDir, 'test-results.json'),
        JSON.stringify(jsonReport, null, 2)
      );
      log(`JSON report generated: ${path.join(reportsDir, 'test-results.json')}`, colors.blue);
    }

    // Exit with appropriate code
    const allPassed = summary.failedTests === 0;
    
    if (allPassed) {
      logHeader('🎉 All Tests Passed!');
      log('The secure token management system is working correctly.', colors.green + colors.bright);
      process.exit(0);
    } else {
      logHeader('❌ Some Tests Failed');
      log(`${summary.failedTests} out of ${summary.totalTests} test suites failed.`, colors.red + colors.bright);
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Test runner failed: ${error.message}`, colors.red + colors.bright);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n🛑 Test run interrupted by user', colors.yellow);
  process.exit(130);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught exception: ${error.message}`, colors.red);
  console.error(error.stack);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, colors.red);
  console.error(error.stack);
  process.exit(1);
});