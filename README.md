# Package Updater

A command-line tool that analyzes, updates, and fixes npm packages in your project using AI-powered workflows.

## Features

- **Intelligent Package Management**:
  - Automatically updates packages to their latest versions
  - Handles dependency conflicts
  - Validates builds after updates

- **AI-Powered Code Fixing**:
  - Automatically detects build failures
  - Analyzes errors using LangChain
  - Suggests and implements code fixes
  - Validates fixes with multiple attempts

- **Smart Workflow System**:
  - Step-by-step package update process
  - Automatic build verification
  - Code fixing with validation
  - Maximum attempt limits for stability

## Installation

⚠️ **Security Note**: Never commit your `.env` file or API keys to version control. The `.env` file is automatically ignored via `.gitignore`.

1. Set up your OpenAI API key in .env:
   ```bash
   # Copy the example .env file
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build and install globally:
   ```bash
   npm run build
   npm install -g .
   ```

## Usage

Navigate to your Node.js project directory and run:

```bash
package-updater
```

The tool will:
1. Analyze your package.json
2. Update each package to its latest version
3. Run the project's build command
4. If build fails:
   - Analyze the error using AI
   - Attempt to fix the code
   - Validate the fixes
   - Retry if needed

## Example Output

```
📦 Starting package analysis...

📊 Analysis Results:
-------------------
Total packages analyzed: 5
Successfully updated: 3
Failed updates: 2

✅ Successfully updated packages:
  express: 4.17.1 → 4.18.2
  lodash: 4.17.20 → 4.17.21
  moment: 2.29.1 → 2.29.4

❌ Failed updates:
  Package: react (17.0.2)
  Error: Build failed after update
  Files Fixed: src/components/App.jsx
  Suggestion: Check the updated code in fixed files

  Package: typescript (4.5.4)
  Error: Incompatible types after update
  Files Fixed: src/types/index.ts, src/utils/helpers.ts
  Suggestion: Review type changes in fixed files
```

## Configuration

You can customize the behavior through environment variables:

```env
OPENAI_API_KEY=your-api-key
MAX_FIX_ATTEMPTS=3
BUILD_COMMAND=npm run build
```

## How It Works

1. **Package Installation**:
   - Detects outdated packages
   - Updates to latest versions
   - Handles dependency resolution

2. **Build Verification**:
   - Runs project build command
   - Captures build errors
   - Initiates fix workflow if needed

3. **Code Fixing**:
   - Analyzes build errors with AI
   - Generates targeted fixes
   - Validates changes
   - Retries with different approaches

## Future Enhancements

- Interactive fix approval mode
- Custom fix strategies
- Extended error analysis
- Project-specific fix rules
- Integration with more build tools
- Support for monorepos

## Security Best Practices

1. **Environment Variables**:
   - Always use .env for sensitive information
   - Never commit .env files to git
   - Use .env.example as a template
   - Keep API keys secure and rotate them regularly

2. **Git Safety**:
   - Verify .gitignore is properly configured
   - Check commits for sensitive information
   - Use git-secrets or similar tools
   - Force push with caution

## Troubleshooting

### Common Issues

- If you get permission errors during global installation, try using `sudo npm install -g .`
- Make sure you have Node.js version 14 or higher installed
- Verify that your OpenAI API key is correctly set in .env
- Check that your project has a valid build command

### Build Failures

If the automatic fixing doesn't resolve build issues:
1. Check the generated fixes in the modified files
2. Review the build error messages
3. Adjust the MAX_FIX_ATTEMPTS if needed
4. Consider manual intervention for complex issues

## Contributing

Feel free to submit issues and enhancement requests!
