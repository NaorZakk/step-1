export interface PackageError {
  name: string;
  version: string;
  error: string;
  suggestion: string;
}

export interface UpdateResult {
  package: string;
  oldVersion: string;
  newVersion: string;
  status: 'success' | 'error';
  error?: PackageError;
}

export interface PackageAnalysis {
  successful: UpdateResult[];
  failed: PackageError[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}
