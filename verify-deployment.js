#!/usr/bin/env node

/**
 * Comprehensive Netlify Deployment Verification Script
 * Verifies all aspects of the Searchmatic MVP deployment configuration
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  projectRoot: __dirname,
  distDir: join(__dirname, 'dist'),
  requiredEnvVars: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_OPENAI_API_KEY'
  ],
  criticalFiles: [
    'package.json',
    'netlify.toml',
    'vite.config.ts',
    'src/main.tsx',
    'src/App.tsx'
  ],
  performanceBudgets: {
    totalJSSize: 500 * 1024, // 500KB
    totalCSSSize: 50 * 1024,  // 50KB
    mainChunkSize: 250 * 1024 // 250KB
  }
};

// Utility functions
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  section: (msg) => console.log(`\n🔍 ${msg}\n${'='.repeat(50)}`)
};

const execAsync = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: config.projectRoot }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

// Verification functions
async function verifyEnvironmentVariables() {
  log.section('Environment Variables');
  
  try {
    const envContent = await fs.readFile(join(config.projectRoot, '.env.local'), 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      if (line.includes('=')) {
        const [key, value] = line.split('=');
        envVars[key.trim()] = value.trim();
      }
    });
    
    let allPresent = true;
    
    for (const varName of config.requiredEnvVars) {
      if (envVars[varName]) {
        if (varName.includes('KEY')) {
          log.success(`${varName}: ✓ (${envVars[varName].substring(0, 20)}...)`);
        } else {
          log.success(`${varName}: ✓ ${envVars[varName]}`);
        }
      } else {
        log.error(`${varName}: Missing!`);
        allPresent = false;
      }
    }
    
    return allPresent;
  } catch (error) {
    log.error(`Failed to read .env.local: ${error.message}`);
    return false;
  }
}

async function verifyBuildProcess() {
  log.section('Build Process');
  
  try {
    log.info('Running production build...');
    const { stdout } = await execAsync('npm run build');
    
    if (stdout.includes('built in')) {
      log.success('Build completed successfully');
      
      // Extract build stats
      const lines = stdout.split('\n');
      const buildStats = lines.filter(line => 
        line.includes('kB') && (line.includes('.js') || line.includes('.css'))
      );
      
      log.info('Build output:');
      buildStats.forEach(line => console.log(`  ${line.trim()}`));
      
      return true;
    } else {
      log.error('Build output doesn\'t contain success indicator');
      return false;
    }
  } catch (error) {
    log.error(`Build failed: ${error.stderr || error.stdout || error.error.message}`);
    return false;
  }
}

async function verifyDistDirectory() {
  log.section('Distribution Directory');
  
  try {
    const distExists = await fs.access(config.distDir).then(() => true).catch(() => false);
    
    if (!distExists) {
      log.error('dist directory does not exist');
      return false;
    }
    
    const distFiles = await fs.readdir(config.distDir, { recursive: true });
    
    // Check for required files
    const requiredDistFiles = ['index.html', '_redirects'];
    const hasAssets = distFiles.some(file => file.includes('assets/'));
    
    let allPresent = true;
    
    requiredDistFiles.forEach(file => {
      if (distFiles.includes(file)) {
        log.success(`${file}: ✓`);
      } else {
        log.error(`${file}: Missing!`);
        allPresent = false;
      }
    });
    
    if (hasAssets) {
      log.success('Assets directory: ✓');
    } else {
      log.error('Assets directory: Missing!');
      allPresent = false;
    }
    
    return allPresent;
  } catch (error) {
    log.error(`Failed to verify dist directory: ${error.message}`);
    return false;
  }
}

async function verifyNetlifyConfiguration() {
  log.section('Netlify Configuration');
  
  try {
    const netlifyConfig = await fs.readFile(join(config.projectRoot, 'netlify.toml'), 'utf8');
    
    // Check for required configurations
    const checks = [
      { pattern: /command = "npm run build"/, name: 'Build command' },
      { pattern: /publish = "dist"/, name: 'Publish directory' },
      { pattern: /from = "\/\*"/, name: 'SPA redirects' },
      { pattern: /X-Frame-Options/, name: 'Security headers' },
      { pattern: /Cache-Control/, name: 'Caching headers' },
      { pattern: /NODE_VERSION = "20"/, name: 'Node version' }
    ];
    
    let allPresent = true;
    
    checks.forEach(check => {
      if (check.pattern.test(netlifyConfig)) {
        log.success(`${check.name}: ✓`);
      } else {
        log.error(`${check.name}: Missing or incorrect!`);
        allPresent = false;
      }
    });
    
    return allPresent;
  } catch (error) {
    log.error(`Failed to read netlify.toml: ${error.message}`);
    return false;
  }
}

async function verifyPerformanceBudgets() {
  log.section('Performance Budgets');
  
  try {
    const assetsDir = join(config.distDir, 'assets');
    const assetFiles = await fs.readdir(assetsDir);
    
    let totalJSSize = 0;
    let totalCSSSize = 0;
    let mainChunkSize = 0;
    
    for (const file of assetFiles) {
      if (!file.endsWith('.map')) {
        const filePath = join(assetsDir, file);
        const stats = await fs.stat(filePath);
        
        if (file.endsWith('.js')) {
          totalJSSize += stats.size;
          if (file.includes('index-')) {
            mainChunkSize = stats.size;
          }
        } else if (file.endsWith('.css')) {
          totalCSSSize += stats.size;
        }
      }
    }
    
    // Check budgets
    const checks = [
      {
        name: 'Total JS Size',
        actual: totalJSSize,
        budget: config.performanceBudgets.totalJSSize,
        format: 'KB'
      },
      {
        name: 'Total CSS Size',
        actual: totalCSSSize,
        budget: config.performanceBudgets.totalCSSSize,
        format: 'KB'
      },
      {
        name: 'Main Chunk Size',
        actual: mainChunkSize,
        budget: config.performanceBudgets.mainChunkSize,
        format: 'KB'
      }
    ];
    
    let allWithinBudget = true;
    
    checks.forEach(check => {
      const actualKB = (check.actual / 1024).toFixed(2);
      const budgetKB = (check.budget / 1024).toFixed(2);
      
      if (check.actual <= check.budget) {
        log.success(`${check.name}: ${actualKB}KB (budget: ${budgetKB}KB) ✓`);
      } else {
        log.warning(`${check.name}: ${actualKB}KB (budget: ${budgetKB}KB) - Over budget!`);
        allWithinBudget = false;
      }
    });
    
    return allWithinBudget;
  } catch (error) {
    log.error(`Failed to check performance budgets: ${error.message}`);
    return false;
  }
}

async function verifyDependencies() {
  log.section('Dependencies');
  
  try {
    const { stdout } = await execAsync('npm ls --depth=0 --production');
    
    if (stdout.includes('npm ERR!')) {
      log.warning('Some dependency issues detected');
      return false;
    } else {
      log.success('All production dependencies are properly installed');
      return true;
    }
  } catch (error) {
    // npm ls returns non-zero exit code for warnings, check if it's just warnings
    if (error.stdout && !error.stdout.includes('npm ERR!')) {
      log.success('Dependencies installed (with minor warnings)');
      return true;
    } else {
      log.error(`Dependency check failed: ${error.stderr || error.stdout}`);
      return false;
    }
  }
}

async function verifyTypeScript() {
  log.section('TypeScript Compilation');
  
  try {
    await execAsync('npm run type-check');
    log.success('TypeScript compilation successful');
    return true;
  } catch (error) {
    log.error(`TypeScript errors found: ${error.stderr || error.stdout}`);
    return false;
  }
}

async function verifyLinting() {
  log.section('Code Linting');
  
  try {
    await execAsync('npm run lint');
    log.success('No linting errors found');
    return true;
  } catch (error) {
    log.error(`Linting errors found: ${error.stderr || error.stdout}`);
    return false;
  }
}

async function generateDeploymentReport() {
  log.section('Deployment Report');
  
  const results = {
    environmentVariables: await verifyEnvironmentVariables(),
    buildProcess: await verifyBuildProcess(),
    distDirectory: await verifyDistDirectory(),
    netlifyConfiguration: await verifyNetlifyConfiguration(),
    performanceBudgets: await verifyPerformanceBudgets(),
    dependencies: await verifyDependencies(),
    typeScript: await verifyTypeScript(),
    linting: await verifyLinting()
  };
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const score = ((passedChecks / totalChecks) * 100).toFixed(1);
  
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Overall Score: ${score}% (${passedChecks}/${totalChecks} checks passed)`);
  
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    const name = check.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${name}`);
  });
  
  if (score >= 90) {
    log.success('\n🚀 DEPLOYMENT READY! Your application is ready for production deployment.');
  } else if (score >= 80) {
    log.warning('\n⚠️  DEPLOYMENT WITH CAUTION: Some issues detected but deployment should work.');
  } else {
    log.error('\n🛑 DEPLOYMENT NOT RECOMMENDED: Critical issues must be fixed first.');
  }
  
  console.log('\n📋 NEXT STEPS FOR NETLIFY DEPLOYMENT:');
  console.log('1. Set environment variables in Netlify dashboard:');
  config.requiredEnvVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('2. Deploy using: git push origin main');
  console.log('3. Monitor build logs in Netlify dashboard');
  console.log('4. Test all routes after deployment');
  
  return results;
}

// Main execution
async function main() {
  console.log('🔍 SEARCHMATIC MVP DEPLOYMENT VERIFICATION');
  console.log('='.repeat(50));
  console.log('Verifying deployment readiness for Netlify...\n');
  
  try {
    const results = await generateDeploymentReport();
    
    // Save detailed report
    const reportPath = join(config.projectRoot, 'deployment-verification-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      config: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    }, null, 2));
    
    log.info(`\nDetailed report saved to: deployment-verification-report.json`);
    
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as verifyDeployment };