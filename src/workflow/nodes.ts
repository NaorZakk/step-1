import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';
import { WorkflowState, CodeFix } from './types';
import path from 'path';

const execAsync = promisify(exec);

// Initialize LLM
const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.3,
});

const analyzeErrorPrompt = PromptTemplate.fromTemplate(`
Analyze the following build error and suggest fixes:

Error Message:
{buildError}

Project Context:
- Package being updated: {packageName}
- Updated from version: {currentVersion}
- Updated to version: {targetVersion}

Format your response as a JSON object with:
1. files: Array of files that need changes
2. For each file:
   - filePath: relative path to the file
   - changes: description of required changes
   - suggestedCode: the fixed code
`);

const codeFixPrompt = PromptTemplate.fromTemplate(`
Fix the following code to work with {packageName} version {targetVersion}.

Original code:
\`\`\`
{originalCode}
\`\`\`

Error:
{buildError}

Provide only the fixed code without any explanation or markdown formatting.
`);

export async function installPackage(state: WorkflowState): Promise<WorkflowState> {
  try {
    // Get the latest version
    const { stdout: latestVersion } = await execAsync(`npm view ${state.packageName} version`);
    state.targetVersion = latestVersion.trim();

    // Install the package
    await execAsync(`npm install ${state.packageName}@${state.targetVersion}`);
    
    state.status = 'building';
    return state;
  } catch (error: any) {
    state.status = 'failed';
    state.installError = error.message;
    return state;
  }
}

export async function checkBuild(state: WorkflowState): Promise<WorkflowState> {
  if (state.status !== 'building') return state;

  try {
    await execAsync(state.buildCommand);
    state.status = 'completed';
    return state;
  } catch (error: any) {
    state.buildError = error.message;
    state.status = 'fixing';
    state.fixAttempts = 0;
    return state;
  }
}

export async function fixCode(state: WorkflowState): Promise<WorkflowState> {
  if (state.status !== 'fixing') return state;
  
  try {
    state.fixAttempts += 1;

    // Analyze the build error
    const analysis = await llm.invoke(await analyzeErrorPrompt.format({
      buildError: state.buildError,
      packageName: state.packageName,
      currentVersion: state.currentVersion,
      targetVersion: state.targetVersion
    }));

    // Parse the analysis
    const fixes = JSON.parse(analysis.content as string);

    // Apply fixes
    for (const fix of fixes.files) {
      const filePath = path.join(process.cwd(), fix.filePath);
      const originalCode = await readFile(filePath, 'utf-8');
      
      // Get fixed code
      const fixedCode = await llm.invoke(await codeFixPrompt.format({
        packageName: state.packageName,
        targetVersion: state.targetVersion,
        originalCode,
        buildError: state.buildError
      }));

      // Apply the fix
      await writeFile(filePath, fixedCode.content as string, 'utf-8');
      
      state.fixedFiles.push(fix.filePath);
    }

    // Try building again
    try {
      await execAsync(state.buildCommand);
      state.status = 'completed';
    } catch (error: any) {
      if (state.fixAttempts >= 3) {
        state.status = 'failed';
      }
    }

    return state;
  } catch (error: any) {
    if (state.fixAttempts >= 3) {
      state.status = 'failed';
    }
    return state;
  }
}
