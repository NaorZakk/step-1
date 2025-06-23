#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = require("path");
const packageAnalyzer_1 = require("./packageAnalyzer");
async function main() {
    try {
        // Get package.json path
        const packageJsonPath = (0, path_1.resolve)(process.cwd(), 'package.json');
        // Read and parse package.json
        const packageJsonContent = await (0, promises_1.readFile)(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        console.log('📦 Starting package analysis...\n');
        const analyzer = new packageAnalyzer_1.PackageAnalyzer();
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
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
main();
