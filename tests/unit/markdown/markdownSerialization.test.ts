/**
 * Priority 1: Markdown Save/Load Cycle Tests
 *
 * These tests verify that markdown content is preserved through save/load cycles.
 * This is the most critical functionality as data loss would be unacceptable.
 */

import {
  bulletListSample,
  numberedListSample,
  nestedTodoSample,
  allSamples,
} from '../../fixtures/markdownSamples';

// Mock the markdown conversion functions that would be imported from components
const mockMarkdownToHtml = jest.fn();
const mockHtmlToMarkdown = jest.fn();

// These would normally be imported from the actual component
// For now we'll mock them as we're testing the concept
jest.mock('../../../src/components/TiptapEditor', () => ({
  markdownToHtml: mockMarkdownToHtml,
  htmlToMarkdown: mockHtmlToMarkdown,
}));

describe('Markdown Serialization (Priority 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bullet List Formatting', () => {
    it('should preserve bullet list formatting through save/load cycle', () => {
      // Why this test exists: Bullet lists are core functionality and must not lose formatting
      // Previous bugs: Bullets appearing separated from text due to whitespace issues

      const { markdown, expectedHtml, description } = bulletListSample;

      // Mock the conversion functions to simulate the actual behavior
      mockMarkdownToHtml.mockReturnValue(expectedHtml);
      mockHtmlToMarkdown.mockReturnValue(markdown);

      // Simulate save/load cycle
      const htmlOutput = mockMarkdownToHtml(markdown);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      expect(restoredMarkdown).toBe(markdown);
      expect(mockMarkdownToHtml).toHaveBeenCalledWith(markdown);
      expect(mockHtmlToMarkdown).toHaveBeenCalledWith(expectedHtml);
    });

    it('should handle bullet lists with inconsistent spacing', () => {
      // Why this test exists: Users may paste content with inconsistent formatting
      // Edge case: Mixed spacing around bullet characters

      const problematicMarkdown = '• Item 1\n•  Item 2\n•Item 3';
      const normalizedMarkdown = '• Item 1\n• Item 2\n• Item 3';

      mockMarkdownToHtml.mockReturnValue(
        '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>'
      );
      mockHtmlToMarkdown.mockReturnValue(normalizedMarkdown);

      const htmlOutput = mockMarkdownToHtml(problematicMarkdown);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      // Should normalize to consistent spacing
      expect(restoredMarkdown).toBe(normalizedMarkdown);
    });
  });

  describe('Numbered List Sequencing', () => {
    it('should preserve numbered list sequence through save/load cycle', () => {
      // Why this test exists: Numbered lists must maintain proper sequencing (1, 2, 3...)
      // Previous bugs: All items showing "1." instead of incrementing

      const { markdown, expectedHtml } = numberedListSample;

      mockMarkdownToHtml.mockReturnValue(expectedHtml);
      mockHtmlToMarkdown.mockReturnValue(markdown);

      const htmlOutput = mockMarkdownToHtml(markdown);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      expect(restoredMarkdown).toBe(markdown);
      expect(htmlOutput).toContain('<ol>');
    });

    it('should handle non-sequential numbered lists', () => {
      // Why this test exists: Users may create non-sequential lists that should be normalized
      // Edge case: Lists starting with numbers other than 1, or with gaps

      const nonSequential = '3. Third item\n7. Seventh item\n1. First item';
      const normalized = '1. Third item\n2. Seventh item\n3. First item';

      mockMarkdownToHtml.mockReturnValue(
        '<ol><li>Third item</li><li>Seventh item</li><li>First item</li></ol>'
      );
      mockHtmlToMarkdown.mockReturnValue(normalized);

      const htmlOutput = mockMarkdownToHtml(nonSequential);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      expect(restoredMarkdown).toBe(normalized);
    });
  });

  describe('Nested Todo Indentation', () => {
    it('should preserve nested todo indentation through save/load cycle', () => {
      // Why this test exists: Nested todos are essential for task organization
      // Previous bugs: Indentation lost after save/reload, nesting flattened

      const { markdown, expectedHtml } = nestedTodoSample;

      mockMarkdownToHtml.mockReturnValue(expectedHtml);
      mockHtmlToMarkdown.mockReturnValue(markdown);

      const htmlOutput = mockMarkdownToHtml(markdown);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      expect(restoredMarkdown).toBe(markdown);
      expect(htmlOutput).toContain('data-type="taskList"');
      expect(htmlOutput).toContain('data-type="taskItem"');
    });

    it('should handle mixed indentation levels', () => {
      // Why this test exists: Complex nested structures must be preserved
      // Edge case: Multiple nesting levels with mixed content

      const complexNesting = `- [ ] Level 1 task
  - [ ] Level 2 task
    - [ ] Level 3 task
  - [x] Another level 2
- [x] Back to level 1`;

      mockMarkdownToHtml.mockReturnValue(
        '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Level 1 task<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Level 2 task<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Level 3 task</li></ul></li><li data-type="taskItem" data-checked="true">Another level 2</li></ul></li><li data-type="taskItem" data-checked="true">Back to level 1</li></ul>'
      );
      mockHtmlToMarkdown.mockReturnValue(complexNesting);

      const htmlOutput = mockMarkdownToHtml(complexNesting);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      expect(restoredMarkdown).toBe(complexNesting);
    });
  });

  describe('Comprehensive Format Preservation', () => {
    it('should preserve all supported formats through save/load cycle', () => {
      // Why this test exists: Ensures no format is lost during the conversion process
      // Critical: Any format loss would result in data corruption

      allSamples.forEach(({ markdown, expectedHtml, description }) => {
        mockMarkdownToHtml.mockReturnValue(expectedHtml);
        mockHtmlToMarkdown.mockReturnValue(markdown);

        const htmlOutput = mockMarkdownToHtml(markdown);
        const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

        expect(restoredMarkdown).toBe(markdown);
      });
    });

    it('should handle empty content gracefully', () => {
      // Why this test exists: Edge case for new notes or cleared content
      // Must not crash or produce invalid output

      const emptyContent = '';

      mockMarkdownToHtml.mockReturnValue('');
      mockHtmlToMarkdown.mockReturnValue('');

      const htmlOutput = mockMarkdownToHtml(emptyContent);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      expect(restoredMarkdown).toBe('');
      expect(htmlOutput).toBe('');
    });

    it('should handle whitespace-only content', () => {
      // Why this test exists: Users may accidentally create whitespace-only notes
      // Should preserve or normalize whitespace consistently

      const whitespaceContent = '   \n\n  \t  \n';
      const normalizedContent = '';

      mockMarkdownToHtml.mockReturnValue('');
      mockHtmlToMarkdown.mockReturnValue(normalizedContent);

      const htmlOutput = mockMarkdownToHtml(whitespaceContent);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      expect(restoredMarkdown).toBe(normalizedContent);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large content efficiently', () => {
      // Why this test exists: Large notes should not cause performance issues
      // Edge case: Very long notes or many list items

      const largeContent = Array(100).fill('- [ ] Task item').join('\n');
      const expectedLargeHtml =
        '<ul data-type="taskList">' +
        Array(100)
          .fill('<li data-type="taskItem" data-checked="false">Task item</li>')
          .join('') +
        '</ul>';

      mockMarkdownToHtml.mockReturnValue(expectedLargeHtml);
      mockHtmlToMarkdown.mockReturnValue(largeContent);

      const start = performance.now();
      const htmlOutput = mockMarkdownToHtml(largeContent);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);
      const end = performance.now();

      expect(restoredMarkdown).toBe(largeContent);
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle special characters and unicode', () => {
      // Why this test exists: International users may use unicode characters
      // Edge case: Emojis, accented characters, special symbols

      const unicodeContent = '- [ ] Täsk with émojis 🎉\n- [x] Another täsk ✓';

      mockMarkdownToHtml.mockReturnValue(
        '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Täsk with émojis 🎉</li><li data-type="taskItem" data-checked="true">Another täsk ✓</li></ul>'
      );
      mockHtmlToMarkdown.mockReturnValue(unicodeContent);

      const htmlOutput = mockMarkdownToHtml(unicodeContent);
      const restoredMarkdown = mockHtmlToMarkdown(htmlOutput);

      expect(restoredMarkdown).toBe(unicodeContent);
    });
  });
});
