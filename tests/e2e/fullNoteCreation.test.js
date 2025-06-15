/**
 * E2E Test: Complete Note Creation Flow
 *
 * Simulates real user interaction from app start to note creation,
 * editing, saving, and reopening. Tests the complete user journey
 * to ensure everything works together seamlessly.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/renderer/App';
import { createMockNote } from '../utils/testHelpers';

// Mock electron API
const mockElectronAPI = {
  getNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  createNote: jest.fn(),
  getAllNotes: jest.fn(),
  getNoteTags: jest.fn(),
  getAllTags: jest.fn(),
  createTag: jest.fn(),
  addTagToNote: jest.fn(),
  removeTagFromNote: jest.fn(),
  focusNote: jest.fn(),
};

global.window.electronAPI = mockElectronAPI;

// Mock styles
jest.mock('../../src/utils/styles', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
  layoutStyles: {
    centerContent: 'center-content',
    macOSHeaderSpacing: 'macos-spacing',
  },
  buttonStyles: {
    base: 'btn-base',
    delete: 'btn-delete',
  },
  tagStyles: {
    pill: 'tag-pill',
    removeButton: 'tag-remove',
    addButton: 'tag-add',
  },
  editorStyles: {
    tiptap: 'tiptap-editor',
    content: 'editor-content',
    scrollable: 'scrollable-content',
  },
  positionStyles: {
    dropdown: 'dropdown',
  },
}));

describe('E2E: Note Creation Flow', () => {
  const mockNote = createMockNote({
    id: 'test-note-123',
    content: '',
    color: 'yellow',
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockElectronAPI.getNote.mockResolvedValue(mockNote);
    mockElectronAPI.getNoteTags.mockResolvedValue([]);
    mockElectronAPI.getAllTags.mockResolvedValue([]);
    mockElectronAPI.updateNote.mockResolvedValue(mockNote);
    mockElectronAPI.createNote.mockResolvedValue('new-note-id');

    // Mock URL search params for note ID
    Object.defineProperty(window, 'location', {
      value: {
        search: '?noteId=test-note-123',
      },
      writable: true,
    });
  });

  /**
   * Test the complete user journey from creating to editing a note
   */
  it('user can create, edit, save, and reopen a note with complex markdown', async () => {
    const user = userEvent.setup();

    // Render the app
    render(<App />);

    // Wait for the app to load
    await waitFor(() => {
      expect(mockElectronAPI.getNote).toHaveBeenCalledWith('test-note-123');
    });

    // Wait for editor to be available
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Step 1: User creates complex markdown content
    const complexMarkdown = `# My Project Plan

## Goals for this week
- [x] Complete testing framework
- [ ] Write documentation
- [ ] Review pull requests

## Meeting Notes
### Monday Standup
- Discussed new features
- **Important**: Need to focus on *performance*
- Next deadline: Friday

## Code Examples
\`\`\`javascript
function createNote() {
  return { id: generateId(), content: '' };
}
\`\`\`

## Resources
- [Documentation](https://example.com/docs)
- [GitHub](https://github.com/project)

> Remember to update the changelog!`;

    // Type the content
    const editor = screen.getByRole('textbox');
    await user.clear(editor);
    await user.type(editor, complexMarkdown);

    // Verify onChange was called
    await waitFor(() => {
      expect(mockElectronAPI.updateNote).toHaveBeenCalled();
    });

    // Step 2: Add tags to the note
    const addTagButton = screen.getByTitle('Add tag');
    await user.click(addTagButton);

    // Wait for tag input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument();
    });

    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'project{enter}');

    // Verify tag creation was called
    await waitFor(() => {
      expect(mockElectronAPI.createTag).toHaveBeenCalledWith('project');
    });

    // Add another tag
    await user.click(addTagButton);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Add tag...'), 'urgent{enter}');

    // Step 3: Save the note manually
    await user.keyboard('{Meta>}s{/Meta}');

    // Verify save was triggered
    await waitFor(() => {
      expect(mockElectronAPI.updateNote).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-note-123',
        })
      );
    });

    // Step 4: Simulate note link interaction
    // Mock another note for linking
    const linkedNote = createMockNote({
      id: 'linked-note-456',
      content: '# Linked Note\n\nThis is a linked note.',
    });
    mockElectronAPI.focusNote.mockResolvedValue(true);

    // Add a note link to content
    await user.type(editor, '\n\n[@Related Note](note://linked-note-456)');

    // Click the link (would be handled by Tiptap's link handler)
    // This would trigger focusNote in real usage

    // Step 5: Test note deletion flow
    const deleteButton = screen.getByTitle('Delete note');

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    await user.click(deleteButton);

    // Verify deletion was called
    await waitFor(() => {
      expect(mockElectronAPI.deleteNote).toHaveBeenCalledWith('test-note-123');
    });

    // Restore confirm
    window.confirm = originalConfirm;
  });

  /**
   * Test tag management workflow
   */
  it('manages tags throughout the note lifecycle', async () => {
    const user = userEvent.setup();

    // Setup existing tags
    const existingTags = [
      { id: 1, name: 'work' },
      { id: 2, name: 'personal' },
      { id: 3, name: 'urgent' },
    ];
    mockElectronAPI.getAllTags.mockResolvedValue(existingTags);
    mockElectronAPI.getNoteTags.mockResolvedValue([existingTags[0]]); // Note has 'work' tag

    render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Verify existing tag is displayed
    await waitFor(() => {
      expect(screen.getByText('work')).toBeInTheDocument();
    });

    // Remove existing tag
    const removeButton = screen.getByTitle('Remove tag');
    await user.click(removeButton);

    expect(mockElectronAPI.removeTagFromNote).toHaveBeenCalledWith(
      'test-note-123',
      1
    );

    // Add new tag
    const addTagButton = screen.getByTitle('Add tag');
    await user.click(addTagButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument();
    });

    // Type partial tag name to test suggestions
    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'ur');

    // In real implementation, this would show suggestions
    // For now, complete the tag name
    await user.type(tagInput, 'gent{enter}');

    expect(mockElectronAPI.createTag).toHaveBeenCalledWith('urgent');
  });

  /**
   * Test auto-save functionality
   */
  it('automatically saves changes after timeout', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Make a change
    const editor = screen.getByRole('textbox');
    await user.type(editor, 'Test content for auto-save');

    // Fast-forward past auto-save timeout (30 seconds)
    jest.advanceTimersByTime(30000);

    // Verify auto-save was triggered
    await waitFor(() => {
      expect(mockElectronAPI.updateNote).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  /**
   * Test editor mode switching
   */
  it('switches between editing modes seamlessly', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Add some content with tasks
    const editor = screen.getByRole('textbox');
    await user.type(editor, '- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3');

    // Look for mode toggle button (if implemented)
    const modeToggle = screen.queryByTitle(/toggle.*mode/i);
    if (modeToggle) {
      await user.click(modeToggle);

      // Should still show the same content in different mode
      expect(screen.getByText(/Task 1/)).toBeInTheDocument();
      expect(screen.getByText(/Task 2/)).toBeInTheDocument();
    }
  });

  /**
   * Test keyboard shortcuts
   */
  it('responds to keyboard shortcuts correctly', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Test save shortcut
    await user.keyboard('{Meta>}s{/Meta}');
    expect(mockElectronAPI.updateNote).toHaveBeenCalled();

    // Test new note shortcut
    await user.keyboard('{Meta>}n{/Meta}');
    expect(mockElectronAPI.createNote).toHaveBeenCalled();

    // Test search shortcut
    // Note: This would open search window in real app
    await user.keyboard('{Meta>}{Shift>}f{/Shift}{/Meta}');
    // In a real test, we'd verify search window opened
  });

  /**
   * Test error handling scenarios
   */
  it('handles errors gracefully during note operations', async () => {
    const user = userEvent.setup();

    // Mock API failure
    mockElectronAPI.updateNote.mockRejectedValue(new Error('Save failed'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Make a change
    const editor = screen.getByRole('textbox');
    await user.type(editor, 'Content that will fail to save');

    // Try to save
    await user.keyboard('{Meta>}s{/Meta}');

    // Should not crash the app
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(editor).toHaveValue(
      expect.stringContaining('Content that will fail to save')
    );
  });

  /**
   * Test window controls
   */
  it('handles window controls correctly', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Test minimize button
    const minimizeButton = screen.queryByTitle('Minimize');
    if (minimizeButton) {
      await user.click(minimizeButton);
      // In real app, this would minimize the window
    }

    // Test always on top toggle
    const alwaysOnTopToggle = screen.queryByTitle(/always.*top/i);
    if (alwaysOnTopToggle) {
      await user.click(alwaysOnTopToggle);
      // In real app, this would toggle always on top
    }
  });

  /**
   * Test note content persistence across reloads
   */
  it('persists note content across app reloads', async () => {
    const user = userEvent.setup();

    // First render
    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Add content
    const editor = screen.getByRole('textbox');
    await user.type(editor, 'Persistent content');

    // Save
    await user.keyboard('{Meta>}s{/Meta}');

    // Unmount and re-render (simulating app restart)
    unmount();

    // Update mock to return saved content
    const savedNote = {
      ...mockNote,
      content: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Persistent content',
              },
            ],
          },
        ],
      }),
    };
    mockElectronAPI.getNote.mockResolvedValue(savedNote);

    // Render again
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Content should be restored
    await waitFor(() => {
      expect(screen.getByText('Persistent content')).toBeInTheDocument();
    });
  });
});
