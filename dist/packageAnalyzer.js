"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageAnalyzer = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const errorAnalyzer_1 = require("./errorAnalyzer");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class PackageAnalyzer {
    errorAnalyzer;
    constructor() {
        this.errorAnalyzer = new errorAnalyzer_1.ErrorAnalyzer();
    }
    async analyzeDependency(packageName, currentVersion) {
        try {
            // Get the latest version
            const { stdout: latestVersion } = await execAsync(`npm view ${packageName} version`);
            const trimmedVersion = latestVersion.trim();
            // Attempt to install the latest version
            await execAsync(`npm install ${packageName}@latest`);
            return {
                package: packageName,
                oldVersion: currentVersion,
                newVersion: trimmedVersion,
                status: 'success'
            };
        }
        catch (error) {
            const errorAnalysis = await this.analyzeError(error.message, packageName, currentVersion);
            return {
                package: packageName,
                oldVersion: currentVersion,
                newVersion: 'failed',
                status: 'error',
                error: errorAnalysis
            };
        }
    }
    async analyzeError(errorMessage, packageName, version) {
        try {
            // Use LangChain's ErrorAnalyzer for all errors
            const analysis = await this.errorAnalyzer.analyzeError(packageName, version, errorMessage);
            return {
                name: packageName,
                version: version,
                error: analysis.error,
                suggestion: analysis.suggestion
            };
        }
        catch (error) {
            console.error("Error during analysis:", error);
            return {
                name: packageName,
                version: version,
                error: "Failed to analyze error",
                suggestion: "Please check npm logs and try again"
            };
        }
    }
    async analyzeAllPackages(packageJson) {
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const results = [];
        for (const [name, version] of Object.entries(dependencies)) {
            const result = await this.analyzeDependency(name, version);
            results.push(result);
        }
        const successful = results.filter(r => r.status === 'success');
        const failed = results.filter(r => r.status === 'error').map(r => r.error);
        return {
            successful,
            failed,
            summary: {
                total: results.length,
                succeeded: successful.length,
                failed: failed.length
            }
        };
    }
}
exports.PackageAnalyzer = PackageAnalyzer;
