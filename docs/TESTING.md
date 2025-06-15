# Testing Guide

## Overview

This application uses Jest and React Testing Library for comprehensive testing with 80%+ code coverage. Our testing strategy focuses on critical user-facing functionality and ensures reliability across all major features.

## Test Architecture

### Testing Stack
- **Jest**: Test runner and assertion library with built-in mocking
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **Custom Electron mocks**: Comprehensive Electron API mocking using Jest

### Test Structure
```
tests/
├── unit/                    # Unit tests for individual components/functions
│   ├── markdown/           # Priority 1: Markdown serialization tests
│   ├── windowManagement/   # Priority 2: Window lifecycle tests
│   ├── userSettings/       # Priority 3: Settings persistence tests
│   ├── components/         # Component-specific tests
│   └── utils/             # Utility function tests
├── integration/            # Integration tests for complete workflows
├── e2e/                   # End-to-end user journey tests
├── fixtures/              # Test data and sample content
└── utils/                 # Test helpers and utilities
```

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Coverage Requirements
- **Overall target**: 80%+ coverage
- **Critical paths**: 100% coverage required
  - Markdown serialization (`src/components/TiptapEditor.tsx`)
  - Database operations (`src/database/database.ts`)

## Test Categories

### Priority 1: Markdown Save/Load Cycle Tests
**Location**: `tests/unit/markdown/` and `tests/integration/markdownSaveLoad.test.js`

**Critical functionality**: Ensures user content is preserved exactly as entered through save/load cycles.

**Key test scenarios**:
- Bullet list formatting preservation
- Numbered list sequence maintenance (1, 2, 3 not all 1s)
- Nested todo indentation and checkbox rendering
- Complete format preservation for all markdown elements
- Edge case handling (empty lines, special characters)
- JSON format support with legacy markdown fallback

```javascript
// Example test structure
describe('Markdown Save/Load Cycle', () => {
  it('preserves bullet list formatting without line breaks', () => {
    const input = '• First bullet\n• Second bullet\n• Third bullet';
    // Test implementation with detailed assertions
  });
});
```

### Priority 2: Window Management Tests
**Location**: `tests/unit/windowManagement/` and `tests/integration/windowLifecycle.test.js`

**Critical functionality**: Ensures windows are created, managed, and destroyed properly.

**Key test scenarios**:
- System tray persistence when all windows are closed
- Window creation from system tray
- Always-on-top setting application
- Window position and resize handling
- Window focus and recreation after destruction
- Cascading window positioning

### Priority 3: User Settings Tests
**Location**: `tests/unit/userSettings/` and `tests/integration/settingsPersistence.test.js`

**Critical functionality**: Verifies user preferences are saved and applied correctly.

**Key test scenarios**:
- Settings persistence across app restarts
- Theme changes propagating to all windows
- Always-on-top toggle coordination
- Settings validation and error handling
- Window position restoration

### E2E Tests
**Location**: `tests/e2e/`

**Purpose**: Test complete user journeys from start to finish.

**Key scenarios**:
- Full note creation workflow
- Multi-window management
- Tag system integration
- Keyboard shortcuts
- Error handling scenarios

## Writing Tests

### Naming Conventions
- **Describe what the test verifies**, not how it works
- Use active voice: "preserves formatting" not "formatting is preserved"
- Be specific about expected behavior
- Include the "why" in comments for complex tests

### Test Structure
```javascript
/**
 * Test Suite: [Component/Feature Name]
 * 
 * [Brief description of what this test suite covers and why it's important]
 */
describe('[Feature Name]', () => {
  /**
   * [Explanation of what this specific test verifies and why it matters]
   */
  it('describes the expected behavior clearly', () => {
    // Arrange: Set up test data and mocks
    // Act: Perform the action being tested
    // Assert: Verify the expected outcome
  });
});
```

### Best Practices

#### 1. Comprehensive Mocking
```javascript
// Mock electron APIs consistently
global.window.electronAPI = {
  notes: {
    save: jest.fn(),
    getAll: jest.fn(),
    // ... other methods
  },
};
```

#### 2. Test Data Management
```javascript
// Use test helpers for consistent data
import { createMockNote } from '../utils/testHelpers';

const testNote = createMockNote({
  content: 'Test content',
  color: 'yellow',
});
```

#### 3. Async Testing
```javascript
// Always use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Expected content')).toBeInTheDocument();
});
```

#### 4. User Interaction Simulation
```javascript
// Use userEvent for realistic interactions
const user = userEvent.setup();
await user.type(screen.getByRole('textbox'), 'Test input');
await user.click(screen.getByRole('button'));
```

## Test Utilities

### Helper Functions
**Location**: `tests/utils/testHelpers.js`

```javascript
// Create mock note with default values
createMockNote(overrides = {})

// Create mock Tiptap editor instance
createMockEditor()

// Render components with providers
renderWithProviders(ui, options = {})

// Wait for markdown processing
waitForMarkdownRender()

// Simulate editor typing
typeInEditor(content)
```

### Test Fixtures
**Location**: `tests/fixtures/markdownSamples.js`

Comprehensive markdown samples for testing edge cases:
- Bullet lists with various formatting
- Numbered lists with sequence preservation
- Nested todos with indentation
- Mixed content scenarios
- Problematic edge cases

## Mock Strategy

### Electron API Mocking
```javascript
// Custom Electron mock setup using Jest's built-in capabilities
// No external libraries needed
jest.mock('electron', () => ({
  BrowserWindow: jest.fn(() => mockWindow),
  app: { whenReady: jest.fn(), on: jest.fn() },
  ipcMain: { handle: jest.fn(), on: jest.fn() },
  // ... other electron modules
}));
```

### Component Mocking
```javascript
// Mock style imports
jest.mock('../src/utils/styles', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
  editorStyles: { tiptap: 'mock-class' },
}));
```

## Debugging Tests

### Common Issues

#### 1. Async Test Failures
```javascript
// ❌ Bad: Not waiting for async operations
expect(mockFunction).toHaveBeenCalled();

// ✅ Good: Wait for async completion
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled();
});
```

#### 2. Mock State Leakage
```javascript
// Always reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### 3. Timing Issues
```javascript
// Use fake timers for time-dependent tests
jest.useFakeTimers();
jest.advanceTimersByTime(30000);
jest.useRealTimers();
```

### Debugging Tools
```javascript
// Debug component state
screen.debug(); // Prints current DOM

// Check what queries are available
screen.getByRole(''); // Logs available roles

// Log all mock calls
console.log(mockFunction.mock.calls);
```

## CI/CD Integration

### GitHub Actions Configuration
```yaml
# Run tests on all PRs and pushes
- name: Run tests
  run: npm run test:ci

# Enforce coverage requirements
- name: Check coverage
  run: npm run test:coverage
  env:
    COVERAGE_THRESHOLD: 80
```

### Coverage Reporting
- **Branches**: 80% minimum
- **Functions**: 80% minimum  
- **Lines**: 80% minimum
- **Statements**: 80% minimum
- **Critical paths**: 100% required

## Performance Testing

### Bundle Size Testing
```javascript
// Monitor bundle size impact
it('maintains reasonable bundle size', () => {
  const bundleSize = getBundleSize();
  expect(bundleSize).toBeLessThan(220); // KB
});
```

### Memory Leak Testing
```javascript
// Test for memory leaks in long-running tests
it('cleans up resources properly', () => {
  // Create and destroy components multiple times
  // Verify no memory leaks
});
```

## Test Organization

### File Naming
- `*.test.js` for unit tests
- `*.integration.test.js` for integration tests
- `*.e2e.test.js` for end-to-end tests

### Test Grouping
```javascript
describe('Component Name', () => {
  describe('Basic Functionality', () => {
    // Core feature tests
  });
  
  describe('Edge Cases', () => {
    // Error conditions and edge cases
  });
  
  describe('User Interactions', () => {
    // User event simulations
  });
});
```

## Known Limitations

### What We Don't Test
- **Electron native APIs**: Mocked for security and performance
- **File system operations**: Mocked to avoid side effects
- **Network requests**: Mocked for reliability
- **System-level integrations**: Tested manually

### Testing Gaps
- **Visual regression testing**: Not implemented (could be added)
- **Performance benchmarks**: Limited coverage
- **Cross-platform differences**: Tested manually

## Future Improvements

### Planned Enhancements
1. **Visual regression testing** with tools like Percy or Chromatic
2. **Performance benchmarking** for large note collections
3. **Cross-platform automated testing** with CI matrix
4. **Accessibility testing** with @testing-library/jest-dom
5. **Integration with Electron's testing tools**

### Metrics and Monitoring
- Track test execution time
- Monitor flaky test patterns
- Measure coverage trends
- Analyze failure rates

## Quick Reference

### Essential Commands
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:ci           # CI mode
```

### Key Test Files
- `markdownSerialization.test.js` - Critical content preservation
- `windowLifecycle.test.js` - Window management
- `settingsPersistence.test.js` - User preferences
- `fullNoteCreation.test.js` - Complete user journey

### Coverage Targets
- **Overall**: 80%+ required
- **Critical paths**: 100% required
- **New features**: 90%+ recommended

This testing strategy ensures robust, reliable software that preserves user data and provides a consistent experience across all features.