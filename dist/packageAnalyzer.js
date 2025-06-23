"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageAnalyzer = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class PackageAnalyzer {
    static COMMON_ERRORS = {
        PEER_DEPENDENCY: 'peer dependency',
        VERSION_CONFLICT: 'version conflict',
        INCOMPATIBLE: 'incompatible',
        DEPRECATED: 'deprecated'
    };
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
            const errorAnalysis = this.analyzeError(error.message, packageName, currentVersion);
            return {
                package: packageName,
                oldVersion: currentVersion,
                newVersion: 'failed',
                status: 'error',
                error: errorAnalysis
            };
        }
    }
    analyzeError(errorMessage, packageName, version) {
        const error = {
            name: packageName,
            version: version,
            error: '',
            suggestion: ''
        };
        if (errorMessage.toLowerCase().includes(PackageAnalyzer.COMMON_ERRORS.PEER_DEPENDENCY)) {
            error.error = 'Peer dependency conflict detected';
            error.suggestion = 'Check the package.json for conflicting peer dependencies and update them accordingly';
        }
        else if (errorMessage.toLowerCase().includes(PackageAnalyzer.COMMON_ERRORS.VERSION_CONFLICT)) {
            error.error = 'Version conflict with existing dependencies';
            error.suggestion = 'Review your package.json and update related dependencies to compatible versions';
        }
        else if (errorMessage.toLowerCase().includes(PackageAnalyzer.COMMON_ERRORS.INCOMPATIBLE)) {
            error.error = 'Package is incompatible with current project setup';
            error.suggestion = 'Consider updating your Node.js version or check if this package supports your current environment';
        }
        else if (errorMessage.toLowerCase().includes(PackageAnalyzer.COMMON_ERRORS.DEPRECATED)) {
            error.error = 'Package version is deprecated';
            error.suggestion = 'Consider using an alternative package or check the package documentation for recommended replacements';
        }
        else {
            error.error = 'Unknown error occurred during installation';
            error.suggestion = 'Check npm logs for detailed error information and verify network connectivity';
        }
        return error;
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
