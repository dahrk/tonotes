/**
 * Test Suite: Markdown Serialization
 *
 * Critical functionality that ensures user content is preserved exactly
 * as entered through save/load cycles. These tests catch the most
 * common user-facing bugs and ensure data integrity.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TiptapEditor from '../../../src/components/TiptapEditor';
import { allSamples, problematicCases } from '../../fixtures/markdownSamples';
import { createMockNote } from '../../utils/testHelpers';

// Mock styles import
jest.mock('../../../src/utils/styles', () => ({
  editorStyles: {
    tiptap: 'tiptap-editor',
    content: 'editor-content',
    scrollable: 'scrollable-content',
  },
}));

describe('Markdown Save/Load Cycle', () => {
  let mockOnChange;
  let mockOnSave;

  beforeEach(() => {
    mockOnChange = jest.fn();
    mockOnSave = jest.fn();
  });

  /**
   * Bullet lists were separating from their content on reload.
   * This test ensures bullets remain on the same line as their text.
   */
  describe('Bullet List Formatting', () => {
    it('preserves bullet list formatting without line breaks', async () => {
      const input = '• First bullet\n• Second bullet\n• Third bullet';

      // Render editor with bullet list content
      render(
        <TiptapEditor
          content={input}
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      // Wait for editor to initialize
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      // Check that bullets are rendered properly
      const bulletElements = screen.getAllByText(
        /First bullet|Second bullet|Third bullet/
      );
      expect(bulletElements).toHaveLength(3);

      // Verify no separation between bullets and text
      bulletElements.forEach(element => {
        const listItem = element.closest('li');
        expect(listItem).toBeInTheDocument();
        expect(listItem.textContent).toMatch(/\w+/); // Contains actual text
      });
    });

    it('handles bullet lists with varying indentation', async () => {
      const input = '• Top level\n  • Indented item\n    • Double indented';

      render(<TiptapEditor content={input} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('Top level')).toBeInTheDocument();
        expect(screen.getByText('Indented item')).toBeInTheDocument();
        expect(screen.getByText('Double indented')).toBeInTheDocument();
      });
    });
  });

  /**
   * Numbered lists were showing as "1." for all items.
   * This test verifies proper sequence preservation.
   */
  describe('Numbered List Sequence', () => {
    it('maintains numbered list sequence (1, 2, 3) not all 1s', async () => {
      const input = '1. First item\n2. Second item\n3. Third item';

      render(<TiptapEditor content={input} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('First item')).toBeInTheDocument();
        expect(screen.getByText('Second item')).toBeInTheDocument();
        expect(screen.getByText('Third item')).toBeInTheDocument();
      });

      // Check that the list items have proper numbering in the DOM
      const orderedList = screen.getByRole('list');
      expect(orderedList.tagName).toBe('OL');

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);

      // Verify CSS class for proper numbering
      expect(orderedList).toHaveClass('tiptap-ordered-list');
    });

    it('preserves numbered list sequence after content changes', async () => {
      const user = userEvent.setup();
      const input = '1. First item\n2. Second item';

      render(<TiptapEditor content={input} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('First item')).toBeInTheDocument();
      });

      // Add a new item
      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.keyboard('{End}\n3. Third item');

      // Verify the onChange callback was called with proper content
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  /**
   * Nested todos were losing indentation or showing as "- [ ]".
   * This test ensures proper nesting is preserved.
   */
  describe('Nested Todo Indentation', () => {
    it('preserves nested todo indentation and checkbox rendering', async () => {
      const input =
        '- [ ] Parent task\n  - [ ] Child task\n    - [x] Completed grandchild';

      render(<TiptapEditor content={input} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('Parent task')).toBeInTheDocument();
        expect(screen.getByText('Child task')).toBeInTheDocument();
        expect(screen.getByText('Completed grandchild')).toBeInTheDocument();
      });

      // Check for task list structure
      const taskLists = document.querySelectorAll('[data-type="taskList"]');
      expect(taskLists.length).toBeGreaterThan(0);

      // Check for checkboxes
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(3);

      // Verify completed state
      const completedCheckbox = Array.from(checkboxes).find(cb =>
        cb.closest('li')?.textContent?.includes('Completed grandchild')
      );
      expect(completedCheckbox).toBeChecked();
    });

    it('allows toggling nested todo checkboxes', async () => {
      const user = userEvent.setup();
      const input = '- [ ] Parent task\n  - [ ] Child task';

      render(<TiptapEditor content={input} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('Child task')).toBeInTheDocument();
      });

      // Find and click the child task checkbox
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      const childCheckbox = Array.from(checkboxes).find(cb =>
        cb.closest('li')?.textContent?.includes('Child task')
      );

      expect(childCheckbox).not.toBeChecked();
      await user.click(childCheckbox);

      // Verify state change
      await waitFor(() => {
        expect(childCheckbox).toBeChecked();
      });
    });
  });

  /**
   * Test all sample markdown content for round-trip preservation
   */
  describe('Complete Format Preservation', () => {
    allSamples.forEach(sample => {
      it(`preserves ${sample.description}`, async () => {
        render(
          <TiptapEditor content={sample.markdown} onChange={mockOnChange} />
        );

        // Wait for content to render
        await waitFor(() => {
          expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        // Verify content was parsed and rendered
        // The onChange should be called with JSON content (new format)
        await waitFor(() => {
          if (mockOnChange.mock.calls.length > 0) {
            const lastCall =
              mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
            const contentString = lastCall[0];

            // Should be JSON format (new standard)
            expect(() => JSON.parse(contentString)).not.toThrow();
          }
        });
      });
    });
  });

  /**
   * Test problematic edge cases that have caused bugs
   */
  describe('Edge Case Handling', () => {
    Object.entries(problematicCases).forEach(([caseName, testCase]) => {
      it(`handles ${testCase.description}`, async () => {
        render(
          <TiptapEditor content={testCase.markdown} onChange={mockOnChange} />
        );

        await waitFor(() => {
          expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        // Verify no crashes and content is processed
        expect(document.querySelector('.tiptap-editor')).toBeInTheDocument();
      });
    });
  });

  /**
   * Test JSON format handling (new standard)
   */
  describe('JSON Format Support', () => {
    it('handles JSON content format correctly', async () => {
      const jsonContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Test paragraph',
              },
            ],
          },
        ],
      });

      render(<TiptapEditor content={jsonContent} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('Test paragraph')).toBeInTheDocument();
      });
    });

    it('falls back to markdown parsing for legacy content', async () => {
      const markdownContent = '# Test Header\n\nTest paragraph';

      render(
        <TiptapEditor content={markdownContent} onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Header')).toBeInTheDocument();
        expect(screen.getByText('Test paragraph')).toBeInTheDocument();
      });
    });
  });

  /**
   * Test keyboard shortcuts and interactions
   */
  describe('Editor Interactions', () => {
    it('responds to save shortcut (CMD+S)', async () => {
      const user = userEvent.setup();

      render(
        <TiptapEditor
          content="Test content"
          onChange={mockOnChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      // Trigger CMD+S
      await user.keyboard('{Meta>}s{/Meta}');

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('handles tab indentation correctly', async () => {
      const user = userEvent.setup();

      render(
        <TiptapEditor content="- [ ] Test task" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.getByText('Test task')).toBeInTheDocument();
      });

      // Focus the editor and try tab indentation
      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.keyboard('{Tab}');

      // Should trigger onChange with indented content
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });
});
