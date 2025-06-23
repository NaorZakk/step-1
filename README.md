# Package Updater

A command-line tool that analyzes and updates npm packages in your project, providing detailed error analysis and suggestions for failed updates.

## Features

- Automatically updates packages to their latest versions
- Provides detailed error analysis for failed updates
- Suggests solutions for common package installation issues
- Shows clear summary of successful and failed updates

## Installation

Before installing, make sure you're using the npm official registry:

```bash
# Check current registry
npm config get registry

# Set to npm official registry if needed
npm config set registry https://registry.npmjs.org/

# Install globally
npm install -g .

# Or run directly with npx
npx package-updater

# Restore your original registry if needed
npm config set registry <your-registry-url>
```

## Usage

Navigate to your Node.js project directory and run:

```bash
package-updater
```

The tool will:
1. Analyze your package.json
2. Attempt to update each package to its latest version
3. Provide a detailed report of:
   - Successfully updated packages
   - Failed updates with error analysis
   - Suggestions for resolving issues

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
  Error: Peer dependency conflict detected
  Suggestion: Check the package.json for conflicting peer dependencies and update them accordingly

  Package: typescript (4.5.4)
  Error: Version conflict with existing dependencies
  Suggestion: Review your package.json and update related dependencies to compatible versions
```

## Future Enhancements

- Automatic code fixing capabilities
- Interactive update mode
- Dependency tree analysis
- Custom update strategies
- Automated testing for updates

## Troubleshooting

### Registry Issues

If you encounter npm registry errors (404 Not Found), it might be because you're using a custom registry. Try:

1. Temporarily switch to the npm official registry:
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

2. Install the package
3. Switch back to your original registry if needed

### Other Common Issues

- If you get permission errors during global installation, try using `sudo npm install -g .` (on Unix-based systems)
- Make sure you have Node.js version 14 or higher installed
- If TypeScript compilation fails, try removing the `dist` directory and rebuilding

## Contributing

Feel free to submit issues and enhancement requests!
