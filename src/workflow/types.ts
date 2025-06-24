export interface WorkflowState {
  packageName: string;
  currentVersion: string;
  targetVersion: string;
  buildCommand: string;
  buildError?: string;
  installError?: string;
  fixAttempts: number;
  fixedFiles: string[];
  status: 'installing' | 'building' | 'fixing' | 'completed' | 'failed';
}

export type WorkflowConfig = {
  maxFixAttempts: number;
  buildCommand: string;
  projectRoot: string;
}

export interface CodeFix {
  filePath: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
}
