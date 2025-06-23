#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { PackageAnalyzer } from './packageAnalyzer';

async function main() {
  try {
    // Get package.json path
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    
    // Read and parse package.json
    const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    console.log('📦 Starting package analysis...\n');

    const analyzer = new PackageAnalyzer();
    const analysis = await analyzer.analyzeAllPackages(packageJson);

    // Print results
    console.log('\n📊 Analysis Results:');
    console.log('-------------------');
    console.log(`Total packages analyzed: ${analysis.summary.total}`);
    console.log(`Successfully updated: ${analysis.summary.succeeded}`);
    console.log(`Failed updates: ${analysis.summary.failed}\n`);

    if (analysis.successful.length > 0) {
      console.log('✅ Successfully updated packages:');
      analysis.successful.forEach(result => {
        console.log(`  ${result.package}: ${result.oldVersion} → ${result.newVersion}`);
      });
      console.log();
    }

    if (analysis.failed.length > 0) {
      console.log('❌ Failed updates:');
      analysis.failed.forEach(error => {
        console.log(`\n  Package: ${error.name} (${error.version})`);
        console.log(`  Error: ${error.error}`);
        console.log(`  Suggestion: ${error.suggestion}`);
      });
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
