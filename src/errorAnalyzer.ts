import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import dotenv from 'dotenv';

dotenv.config();

const errorAnalysisPrompt = PromptTemplate.fromTemplate(`
Analyze the following npm package installation error and provide a detailed suggestion for fixing it:

Package Name: {packageName}
Current Version: {version}
Error Message: {errorMessage}

Consider:
1. Common npm issues
2. Version compatibility
3. System requirements
4. Dependencies conflicts

Format your response exactly as follows:
Error: [A clear, concise description of the error]
Suggestion: [Step-by-step solution to resolve the issue]
`);

export class ErrorAnalyzer {
  private model: OpenAI;
  private chain: RunnableSequence;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.model = new OpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.chain = RunnableSequence.from([
      errorAnalysisPrompt,
      this.model,
      new StringOutputParser(),
    ]);
  }

  async analyzeError(packageName: string, version: string, errorMessage: string): Promise<{error: string, suggestion: string}> {
    try {
      const response = await this.chain.invoke({
        packageName,
        version,
        errorMessage,
      });

      // Parse the response
      const errorMatch = response.match(/Error: (.*?)(?=\nSuggestion:|$)/s);
      const suggestionMatch = response.match(/Suggestion: (.*?)$/s);

      if (!errorMatch || !suggestionMatch) {
        throw new Error('Failed to parse LLM response');
      }

      return {
        error: errorMatch[1].trim(),
        suggestion: suggestionMatch[1].trim()
      };
    } catch (error) {
      console.error("Error analyzing with LLM:", error);
      return {
        error: "Error analysis failed",
        suggestion: "Please check npm logs for more details or retry the installation"
      };
    }
  }
}
