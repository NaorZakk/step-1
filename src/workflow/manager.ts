import { ChatOpenAI } from "@langchain/openai";
import { WorkflowState, WorkflowConfig } from "./types";
import { installPackage, checkBuild, fixCode } from "./nodes";

export class UpdateWorkflowManager {
  private config: WorkflowConfig;
  private model: ChatOpenAI;

  constructor(config: WorkflowConfig) {
    this.config = config;
    this.model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.3,
    });
  }

  async runWorkflow(packageName: string, currentVersion: string): Promise<WorkflowState> {
    let state: WorkflowState = {
      packageName,
      currentVersion,
      targetVersion: "",
      buildCommand: this.config.buildCommand,
      fixAttempts: 0,
      fixedFiles: [],
      status: "installing"
    };

    // Installation step
    state = await installPackage(state);
    if (state.status === 'failed') {
      return state;
    }

    // Build check step
    state = await checkBuild(state);
    if (state.status === 'completed') {
      return state;
    }

    // Fix code attempts
    while (state.status === 'fixing' && state.fixAttempts < this.config.maxFixAttempts) {
      state = await fixCode(state);
      if (state.status === 'completed') {
        break;
      }
      
      // If still fixing, try build again
      if (state.status === 'fixing') {
        state = await checkBuild(state);
      }
    }

    // If still fixing after max attempts, mark as failed
    if (state.status === 'fixing') {
      state.status = 'failed';
    }

    return state;
  }

  async runBatch(packages: Array<{ name: string; version: string }>): Promise<WorkflowState[]> {
    const results: WorkflowState[] = [];
    
    for (const pkg of packages) {
      const result = await this.runWorkflow(pkg.name, pkg.version);
      results.push(result);
    }

    return results;
  }
}
