import { exec } from 'child_process';
import { promisify } from 'util';
import { PackageError, UpdateResult, PackageAnalysis } from './types';

const execAsync = promisify(exec);

export class PackageAnalyzer {
  private static readonly COMMON_ERRORS = {
    PEER_DEPENDENCY: 'peer dependency',
    VERSION_CONFLICT: 'version conflict',
    INCOMPATIBLE: 'incompatible',
    DEPRECATED: 'deprecated'
  };

  async analyzeDependency(packageName: string, currentVersion: string): Promise<UpdateResult> {
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
    } catch (error: any) {
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

  private analyzeError(errorMessage: string, packageName: string, version: string): PackageError {
    const error: PackageError = {
      name: packageName,
      version: version,
      error: '',
      suggestion: ''
    };

    if (errorMessage.toLowerCase().includes(PackageAnalyzer.COMMON_ERRORS.PEER_DEPENDENCY)) {
      error.error = 'Peer dependency conflict detected';
      error.suggestion = 'Check the package.json for conflicting peer dependencies and update them accordingly';
    } else if (errorMessage.toLowerCase().includes(PackageAnalyzer.COMMON_ERRORS.VERSION_CONFLICT)) {
      error.error = 'Version conflict with existing dependencies';
      error.suggestion = 'Review your package.json and update related dependencies to compatible versions';
    } else if (errorMessage.toLowerCase().includes(PackageAnalyzer.COMMON_ERRORS.INCOMPATIBLE)) {
      error.error = 'Package is incompatible with current project setup';
      error.suggestion = 'Consider updating your Node.js version or check if this package supports your current environment';
    } else if (errorMessage.toLowerCase().includes(PackageAnalyzer.COMMON_ERRORS.DEPRECATED)) {
      error.error = 'Package version is deprecated';
      error.suggestion = 'Consider using an alternative package or check the package documentation for recommended replacements';
    } else {
      error.error = 'Unknown error occurred during installation';
      error.suggestion = 'Check npm logs for detailed error information and verify network connectivity';
    }

    return error;
  }

  async analyzeAllPackages(packageJson: any): Promise<PackageAnalysis> {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const results: UpdateResult[] = [];

    for (const [name, version] of Object.entries(dependencies)) {
      const result = await this.analyzeDependency(name, version as string);
      results.push(result);
    }

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
