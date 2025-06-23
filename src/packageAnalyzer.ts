import { exec } from 'child_process';
import { promisify } from 'util';
import { PackageError, UpdateResult, PackageAnalysis } from './types';
import { ErrorAnalyzer } from './errorAnalyzer';

const execAsync = promisify(exec);

export class PackageAnalyzer {
  private errorAnalyzer: ErrorAnalyzer;

  constructor() {
    this.errorAnalyzer = new ErrorAnalyzer();
  }

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

  private async analyzeError(errorMessage: string, packageName: string, version: string): Promise<PackageError> {
    try {
      // Use LangChain's ErrorAnalyzer for all errors
      const analysis = await this.errorAnalyzer.analyzeError(packageName, version, errorMessage);
      return {
        name: packageName,
        version: version,
        error: analysis.error,
        suggestion: analysis.suggestion
      };
    } catch (error) {
      console.error("Error during analysis:", error);
      return {
        name: packageName,
        version: version,
        error: "Failed to analyze error",
        suggestion: "Please check npm logs and try again"
      };
    }
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
