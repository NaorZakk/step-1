import { UpdateWorkflowManager } from './workflow/manager';
import { PackageError, UpdateResult, PackageAnalysis } from './types';
import { WorkflowState } from './workflow/types';

export class PackageAnalyzer {
  private workflowManager: UpdateWorkflowManager;

  constructor(buildCommand: string = 'npm run build') {
    this.workflowManager = new UpdateWorkflowManager({
      maxFixAttempts: 3,
      buildCommand,
      projectRoot: process.cwd()
    });
  }

  private workflowStateToUpdateResult(state: WorkflowState): UpdateResult {
    if (state.status === 'completed') {
      return {
        package: state.packageName,
        oldVersion: state.currentVersion,
        newVersion: state.targetVersion,
        status: 'success'
      };
    } else {
      const error: PackageError = {
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

  async analyzeDependency(packageName: string, currentVersion: string): Promise<UpdateResult> {
    const state = await this.workflowManager.runWorkflow(packageName, currentVersion);
    return this.workflowStateToUpdateResult(state);
  }

  async analyzeAllPackages(packageJson: any): Promise<PackageAnalysis> {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const packages = Object.entries(dependencies).map(([name, version]) => ({
      name,
      version: version as string
    }));

    const states = await this.workflowManager.runBatch(packages);
    const results = states.map(state => this.workflowStateToUpdateResult(state));

    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'error').map(r => r.error!) as PackageError[];

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
