"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageAnalyzer = void 0;
const manager_1 = require("./workflow/manager");
class PackageAnalyzer {
    workflowManager;
    constructor(buildCommand = 'npm run build') {
        this.workflowManager = new manager_1.UpdateWorkflowManager({
            maxFixAttempts: 3,
            buildCommand,
            projectRoot: process.cwd()
        });
    }
    workflowStateToUpdateResult(state) {
        if (state.status === 'completed') {
            return {
                package: state.packageName,
                oldVersion: state.currentVersion,
                newVersion: state.targetVersion,
                status: 'success'
            };
        }
        else {
            const error = {
                name: state.packageName,
                version: state.currentVersion,
                error: state.installError || state.buildError || 'Unknown error occurred',
                suggestion: state.fixedFiles.length > 0
                    ? `Build failed after fixing files: ${state.fixedFiles.join(', ')}`
                    : 'Unable to fix build issues automatically'
            };
            return {
                package: state.packageName,
                oldVersion: state.currentVersion,
                newVersion: 'failed',
                status: 'error',
                error
            };
        }
    }
    async analyzeDependency(packageName, currentVersion) {
        const state = await this.workflowManager.runWorkflow(packageName, currentVersion);
        return this.workflowStateToUpdateResult(state);
    }
    async analyzeAllPackages(packageJson) {
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const packages = Object.entries(dependencies).map(([name, version]) => ({
            name,
            version: version
        }));
        const states = await this.workflowManager.runBatch(packages);
        const results = states.map(state => this.workflowStateToUpdateResult(state));
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
