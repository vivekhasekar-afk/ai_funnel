// =============================================================================
// AI FUNNEL PLATFORM - ESLINT CONFIGURATION
// =============================================================================
// Production-ready ESLint config for React + JavaScript + Vite
// Includes: React, Hooks, A11y, Security, Performance, Best Practices
// =============================================================================

module.exports = {
  // -----------------------------------------------------------------------------
  // ENVIRONMENT
  // -----------------------------------------------------------------------------
  env: {
    browser: true, // Browser global variables
    es2021: true, // ES2021 globals and syntax
    node: true, // Node.js global variables
    jest: true, // Jest testing globals
  },

  // -----------------------------------------------------------------------------
  // PARSER & PARSER OPTIONS
  // -----------------------------------------------------------------------------
  parserOptions: {
    ecmaVersion: 'latest', // Latest ECMAScript version
    sourceType: 'module', // ES modules
    ecmaFeatures: {
      jsx: true, // Enable JSX parsing
      impliedStrict: true,
    },
  },

  // -----------------------------------------------------------------------------
  // EXTENDS - Shareable Configs
  // -----------------------------------------------------------------------------
  extends: [
    'eslint:recommended', // ESLint base rules
    'plugin:react/recommended', // React recommended rules
    'plugin:react/jsx-runtime', // React 17+ JSX runtime
    'plugin:react-hooks/recommended', // React Hooks rules
    'plugin:jsx-a11y/recommended', // Accessibility rules
    'plugin:import/recommended', // Import/export rules
    'prettier', // Disable ESLint rules that conflict with Prettier (MUST BE LAST)
  ],

  // -----------------------------------------------------------------------------
  // PLUGINS
  // -----------------------------------------------------------------------------
  plugins: [
    'react', // React-specific linting
    'react-hooks', // React Hooks linting
    'react-refresh', // React Fast Refresh
    'jsx-a11y', // Accessibility linting
    'import', // Import/export linting
    'security', // Security linting
  ],

  // -----------------------------------------------------------------------------
  // SETTINGS
  // -----------------------------------------------------------------------------
  settings: {
    react: {
      version: 'detect', // Auto-detect React version
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.json'],
        paths: ['src'],
      },
      alias: {
        map: [
          ['@', './src'],
          ['@components', './src/components'],
          ['@features', './src/features'],
          ['@lib', './src/lib'],
          ['@hooks', './src/lib/hooks'],
          ['@utils', './src/lib/utils'],
          ['@api', './src/lib/api'],
          ['@store', './src/store'],
          ['@config', './src/config'],
          ['@assets', './src/assets'],
          ['@styles', './src/styles'],
        ],
        extensions: ['.js', '.jsx', '.json'],
      },
    },
  },

  // -----------------------------------------------------------------------------
  // CUSTOM RULES
  // -----------------------------------------------------------------------------
  rules: {
    // -------------------------------------------------------------------------
    // REACT RULES
    // -------------------------------------------------------------------------
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
    'react/prop-types': 'warn', // Warn on missing prop types (consider using PropTypes or remove)
    'react/jsx-no-target-blank': 'error', // Prevent security vulnerabilities with target="_blank"
    'react/jsx-key': 'error', // Require key prop in lists
    'react/no-array-index-key': 'warn', // Warn against using array index as key
    'react/no-children-prop': 'error', // Prevent passing children as props
    'react/no-danger': 'warn', // Warn on dangerouslySetInnerHTML
    'react/no-deprecated': 'error', // Disallow deprecated React APIs
    'react/no-unescaped-entities': 'warn', // Warn on unescaped entities
    'react/self-closing-comp': 'error', // Require self-closing tags when no children
    'react/jsx-boolean-value': ['error', 'never'], // Omit boolean attribute values
    'react/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never' },
    ],
    'react/jsx-fragments': ['error', 'syntax'], // Use <> instead of <Fragment>
    'react/jsx-no-useless-fragment': 'error', // Prevent unnecessary fragments
    'react/jsx-pascal-case': 'error', // Enforce PascalCase for components
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],

    // -------------------------------------------------------------------------
    // REACT HOOKS RULES
    // -------------------------------------------------------------------------
    'react-hooks/rules-of-hooks': 'error', // Enforce Rules of Hooks
    'react-hooks/exhaustive-deps': 'warn', // Check effect dependencies

    // -------------------------------------------------------------------------
    // REACT REFRESH (Vite HMR)
    // -------------------------------------------------------------------------
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // -------------------------------------------------------------------------
    // ACCESSIBILITY (A11Y) RULES
    // -------------------------------------------------------------------------
    'jsx-a11y/alt-text': 'error', // Require alt text on images
    'jsx-a11y/anchor-is-valid': 'warn', // Validate anchor elements
    'jsx-a11y/click-events-have-key-events': 'warn', // Require keyboard handlers
    'jsx-a11y/no-static-element-interactions': 'warn', // Prevent static elements with handlers
    'jsx-a11y/label-has-associated-control': 'warn', // Form labels must be associated

    // -------------------------------------------------------------------------
    // IMPORT/EXPORT RULES
    // -------------------------------------------------------------------------
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Node.js built-in modules
          'external', // npm packages
          'internal', // Internal modules (using path aliases)
          'parent', // Parent directory imports
          'sibling', // Same directory imports
          'index', // Index file imports
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'error', // Disallow unresolved imports
    'import/no-duplicates': 'error', // Disallow duplicate imports
    'import/no-cycle': 'warn', // Warn on circular dependencies
    'import/no-self-import': 'error', // Disallow self imports
    'import/no-useless-path-segments': 'error', // Prevent unnecessary path segments
    'import/newline-after-import': 'error', // Require newline after imports
    'import/no-anonymous-default-export': 'warn', // Warn on anonymous default exports

    // -------------------------------------------------------------------------
    // SECURITY RULES
    // -------------------------------------------------------------------------
    'security/detect-object-injection': 'off', // Too many false positives
    'no-eval': 'error', // Disallow eval()
    'no-implied-eval': 'error', // Disallow implied eval
    'no-new-func': 'error', // Disallow Function constructor
    'no-script-url': 'error', // Disallow javascript: URLs

    // -------------------------------------------------------------------------
    // BEST PRACTICES
    // -------------------------------------------------------------------------
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Warn on console.log
    'no-debugger': 'warn', // Warn on debugger statements
    'no-alert': 'warn', // Warn on alert/confirm/prompt
    'no-var': 'error', // Require let/const instead of var
    'prefer-const': 'error', // Prefer const over let when possible
    'prefer-arrow-callback': 'error', // Prefer arrow functions as callbacks
    'prefer-template': 'error', // Prefer template literals over concatenation
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_', // Ignore unused vars starting with _
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    eqeqeq: ['error', 'always', { null: 'ignore' }], // Require === and !==
    curly: ['error', 'all'], // Require curly braces for all control statements
    'no-multi-spaces': 'error', // Disallow multiple spaces
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }], // Max 1 empty line
    'no-trailing-spaces': 'error', // Disallow trailing whitespace
    'comma-dangle': ['error', 'es5'], // Require trailing commas (ES5 style)
    quotes: ['error', 'single', { avoidEscape: true }], // Enforce single quotes
    semi: ['error', 'always'], // Require semicolons
    'object-shorthand': ['error', 'always'], // Require object shorthand syntax
    'arrow-body-style': ['error', 'as-needed'], // Require arrow function body braces as needed

    // -------------------------------------------------------------------------
    // CODE QUALITY
    // -------------------------------------------------------------------------
    complexity: ['warn', 15], // Warn on high cyclomatic complexity
    'max-depth': ['warn', 4], // Warn on deep nesting
    'max-lines': ['warn', { max: 500, skipBlankLines: true }], // Warn on long files
    'max-lines-per-function': [
      'warn',
      { max: 150, skipBlankLines: true, skipComments: true },
    ],
    'max-params': ['warn', 4], // Warn on too many function parameters
    'no-nested-ternary': 'warn', // Warn on nested ternaries
    'no-return-await': 'error', // Disallow unnecessary return await
    'require-await': 'error', // Disallow async functions with no await

    // -------------------------------------------------------------------------
    // MODERN JAVASCRIPT
    // -------------------------------------------------------------------------
    'prefer-destructuring': [
      'error',
      {
        array: false,
        object: true,
      },
    ],
    'prefer-rest-params': 'error', // Prefer rest parameters over arguments
    'prefer-spread': 'error', // Prefer spread over apply()
    'no-useless-concat': 'error', // Disallow unnecessary string concatenation
    'no-useless-return': 'error', // Disallow unnecessary return statements
  },

  // -----------------------------------------------------------------------------
  // OVERRIDES FOR SPECIFIC FILES
  // -----------------------------------------------------------------------------
  overrides: [
    // Configuration files
    {
      files: ['*.config.js', '*.config.cjs'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },

    // Test files
    {
      files: ['**/__tests__/**/*', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off',
      },
    },

    // Mock/fixture files
    {
      files: ['**/mocks/**/*', '**/fixtures/**/*'],
      rules: {
        'no-console': 'off',
        'import/no-anonymous-default-export': 'off',
      },
    },

    // Build scripts
    {
      files: ['scripts/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
  ],

  // -----------------------------------------------------------------------------
  // IGNORE PATTERNS
  // -----------------------------------------------------------------------------
  ignorePatterns: [
    'dist',
    'build',
    'node_modules',
    'coverage',
    '*.min.js',
    '*.bundle.js',
    'public/libs',
    '.vite',
  ],
};
