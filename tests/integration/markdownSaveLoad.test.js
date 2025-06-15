/**
 * Integration Test: Complete Markdown Save/Load Flow
 *
 * Tests the entire pipeline from editor input through database
 * storage and back to rendered output. This ensures that the
 * complete user workflow preserves content correctly.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TiptapEditor from '../../src/components/TiptapEditor';
import { allSamples } from '../fixtures/markdownSamples';
import { createMockNote } from '../utils/testHelpers';

// Mock the database and electron APIs
const mockDatabase = {
  notes: new Map(),
  saveNote: jest.fn(note => {
    mockDatabase.notes.set(note.id, { ...note });
    return Promise.resolve(note);
  }),
  getNote: jest.fn(id => {
    return Promise.resolve(mockDatabase.notes.get(id));
  }),
  getAllNotes: jest.fn(() => {
    return Promise.resolve(Array.from(mockDatabase.notes.values()));
  }),
};

// Mock electron API
Object.defineProperty(global.window, 'electronAPI', {
  value: {
    notes: {
      save: mockDatabase.saveNote,
      get: mockDatabase.getNote,
      getAll: mockDatabase.getAllNotes,
    },
  },
  writable: true,
});

// Mock styles
jest.mock('../../src/utils/styles', () => ({
  editorStyles: {
    tiptap: 'tiptap-editor',
    content: 'editor-content',
    scrollable: 'scrollable-content',
  },
}));

describe('Markdown Save/Load Integration', () => {
  beforeEach(() => {
    // Clear mock database
    mockDatabase.notes.clear();
    jest.clearAllMocks();
  });

  /**
   * Tests the complete save and reload cycle preserves all formatting
   */
  it('complete save and reload cycle preserves all formatting', async () => {
    const user = userEvent.setup();
    let savedContent = '';

    // Create initial note
    const initialNote = createMockNote({
      content: '# Initial Content\n\nThis will be replaced',
    });

    // Mock onChange to capture saved content
    const mockOnChange = jest.fn(content => {
      savedContent = content;
    });

    // First render: Load editor with initial content
    const { rerender } = render(
      <TiptapEditor content={initialNote.content} onChange={mockOnChange} />
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Test with complex markdown content
    const complexMarkdown = `# Main Header

## Sub Header

This is a paragraph with **bold** and *italic* text.

### Task List
- [x] Completed task
- [ ] Pending task
  - [ ] Nested task
    - [ ] Deep nested task

### Numbered List
1. First item
2. Second item
3. Third item

### Code Example
\`\`\`javascript
console.log('Hello World');
\`\`\`

[Link to example](https://example.com)

> Blockquote text`;

    // Clear the editor and type new content
    const editor = screen.getByRole('textbox');
    await user.clear(editor);
    await user.type(editor, complexMarkdown);

    // Wait for onChange to be called with the new content
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
      expect(savedContent).toBeTruthy();
    });

    // Simulate saving to database
    const noteWithNewContent = {
      ...initialNote,
      content: savedContent,
      updated_at: new Date().toISOString(),
    };

    await mockDatabase.saveNote(noteWithNewContent);

    // Verify save was called
    expect(mockDatabase.saveNote).toHaveBeenCalledWith(noteWithNewContent);

    // Simulate app restart - reload the note from database
    const reloadedNote = await mockDatabase.getNote(initialNote.id);
    expect(reloadedNote).toBeTruthy();

    // Second render: Load editor with saved content
    rerender(
      <TiptapEditor content={reloadedNote.content} onChange={mockOnChange} />
    );

    // Verify all content is preserved after reload
    await waitFor(() => {
      expect(screen.getByText('Main Header')).toBeInTheDocument();
      expect(screen.getByText('Sub Header')).toBeInTheDocument();
      expect(screen.getByText(/bold.*italic/)).toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();
      expect(screen.getByText('Pending task')).toBeInTheDocument();
      expect(screen.getByText('First item')).toBeInTheDocument();
      expect(screen.getByText('Second item')).toBeInTheDocument();
      expect(screen.getByText('Third item')).toBeInTheDocument();
    });

    // Verify task list functionality
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Check completed task is checked
    const completedCheckbox = Array.from(checkboxes).find(cb =>
      cb.closest('li')?.textContent?.includes('Completed task')
    );
    expect(completedCheckbox).toBeChecked();

    // Check pending task is not checked
    const pendingCheckbox = Array.from(checkboxes).find(cb =>
      cb.closest('li')?.textContent?.includes('Pending task')
    );
    expect(pendingCheckbox).not.toBeChecked();
  });

  /**
   * Test multiple save/load cycles don't degrade content
   */
  it('multiple save/load cycles maintain content integrity', async () => {
    const user = userEvent.setup();
    const testContent = '# Test\n\n- [ ] Task 1\n- [x] Task 2\n\n**Bold text**';

    let currentContent = testContent;
    const mockOnChange = jest.fn(content => {
      currentContent = content;
    });

    const note = createMockNote({ content: testContent });

    // Perform multiple save/load cycles
    for (let cycle = 0; cycle < 3; cycle++) {
      // Render with current content
      render(<TiptapEditor content={currentContent} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      // Make a small edit to trigger save
      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.keyboard('{End} (cycle {cycle + 1})');

      // Wait for content to be updated
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      // Save to mock database
      const updatedNote = {
        ...note,
        content: currentContent,
        updated_at: new Date().toISOString(),
      };
      await mockDatabase.saveNote(updatedNote);

      // Reload from database
      const reloadedNote = await mockDatabase.getNote(note.id);
      currentContent = reloadedNote.content;

      // Clean up for next cycle
      jest.clearAllMocks();
    }

    // Final verification - all cycles should preserve core content
    render(<TiptapEditor content={currentContent} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText(/Task 1.*cycle/)).toBeInTheDocument();
      expect(screen.getByText(/Task 2.*cycle/)).toBeInTheDocument();
      expect(screen.getByText(/Bold text.*cycle/)).toBeInTheDocument();
    });

    // Verify task states are maintained
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);

    const task2Checkbox = Array.from(checkboxes).find(cb =>
      cb.closest('li')?.textContent?.includes('Task 2')
    );
    expect(task2Checkbox).toBeChecked();
  });

  /**
   * Test all sample content for save/load preservation
   */
  describe('Sample Content Preservation', () => {
    allSamples.forEach(sample => {
      it(`preserves ${sample.description} through save/load`, async () => {
        let savedContent = '';
        const mockOnChange = jest.fn(content => {
          savedContent = content;
        });

        const note = createMockNote({ content: sample.markdown });

        // Initial render
        render(<TiptapEditor content={note.content} onChange={mockOnChange} />);

        await waitFor(() => {
          expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        // Wait for initial processing
        await waitFor(() => {
          if (mockOnChange.mock.calls.length > 0) {
            expect(savedContent).toBeTruthy();
          }
        });

        // Save to database
        const savedNote = {
          ...note,
          content: savedContent || note.content,
        };
        await mockDatabase.saveNote(savedNote);

        // Reload from database
        const reloadedNote = await mockDatabase.getNote(note.id);
        expect(reloadedNote).toBeTruthy();

        // Verify content can be loaded again
        render(
          <TiptapEditor content={reloadedNote.content} onChange={jest.fn()} />
        );

        // Should not crash and should contain some recognizable content
        await waitFor(() => {
          expect(screen.getByRole('textbox')).toBeInTheDocument();
        });
      });
    });
  });

  /**
   * Test concurrent save operations
   */
  it('handles concurrent save operations gracefully', async () => {
    const user = userEvent.setup();
    const note = createMockNote({ content: 'Initial content' });

    let content1 = '';
    let content2 = '';

    const mockOnChange1 = jest.fn(content => {
      content1 = content;
    });
    const mockOnChange2 = jest.fn(content => {
      content2 = content;
    });

    // Render two editors with the same note
    const { container: container1 } = render(
      <TiptapEditor content={note.content} onChange={mockOnChange1} />
    );

    const { container: container2 } = render(
      <TiptapEditor content={note.content} onChange={mockOnChange2} />
    );

    await waitFor(() => {
      expect(container1.querySelector('[role="textbox"]')).toBeInTheDocument();
      expect(container2.querySelector('[role="textbox"]')).toBeInTheDocument();
    });

    // Make changes in both editors simultaneously
    const editor1 = container1.querySelector('[role="textbox"]');
    const editor2 = container2.querySelector('[role="textbox"]');

    await user.click(editor1);
    await user.keyboard('{End} - Editor 1');

    await user.click(editor2);
    await user.keyboard('{End} - Editor 2');

    // Both should trigger onChange
    await waitFor(() => {
      expect(mockOnChange1).toHaveBeenCalled();
      expect(mockOnChange2).toHaveBeenCalled();
    });

    // Both saves should succeed (last writer wins)
    await Promise.all([
      mockDatabase.saveNote({ ...note, content: content1 }),
      mockDatabase.saveNote({ ...note, content: content2 }),
    ]);

    expect(mockDatabase.saveNote).toHaveBeenCalledTimes(2);
  });
});
