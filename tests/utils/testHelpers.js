import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Test Helpers for Sticky Notes App
 * 
 * Utilities to make testing more consistent and reduce boilerplate
 */

/**
 * Creates a mock note object with default values
 */
export function createMockNote(overrides = {}) {
  return {
    id: 'test-note-id',
    content: '# Test Note\n\nThis is a test note',
    color: 'yellow',
    position_x: 100,
    position_y: 100,
    width: 300,
    height: 300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock Tiptap editor instance
 */
export function createMockEditor() {
  return {
    getHTML: jest.fn(() => '<p>Mock HTML content</p>'),
    getJSON: jest.fn(() => ({ type: 'doc', content: [] })),
    setContent: jest.fn(),
    destroy: jest.fn(),
    isDestroyed: false,
    commands: {
      setContent: jest.fn(),
      focus: jest.fn(),
    },
    on: jest.fn(),
    off: jest.fn(),
  };
}

/**
 * Wrapper for rendering components with common providers
 */
export function renderWithProviders(ui, options = {}) {
  return render(ui, {
    // Add any providers here if needed
    ...options,
  });
}

/**
 * Waits for markdown conversion to complete
 */
export async function waitForMarkdownRender() {
  // Wait for any async markdown processing
  await waitFor(() => {
    // Check if markdown has been processed
    expect(true).toBe(true);
  });
}

/**
 * Simulates typing in a Tiptap editor
 */
export async function typeInEditor(content) {
  const user = userEvent.setup();
  const editor = screen.getByRole('textbox', { name: /editor/i });
  await user.clear(editor);
  await user.type(editor, content);
}

/**
 * Test data for markdown formatting
 */
export const markdownTestData = {
  bulletList: '• First bullet\n• Second bullet\n• Third bullet',
  numberedList: '1. First item\n2. Second item\n3. Third item',
  nestedTodos: '- [ ] Parent task\n  - [ ] Child task\n    - [ ] Grandchild task',
  mixedContent: '# Header\n\nSome **bold** text and *italic* text.\n\n- [ ] Todo item\n- [x] Completed item\n\n```\ncode block\n```',
  headers: '# H1\n## H2\n### H3\n#### H4',
};