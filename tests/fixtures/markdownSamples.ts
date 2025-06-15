/**
 * Markdown Test Fixtures
 *
 * Sample markdown content for testing the save/load cycle.
 * Each fixture includes the original markdown and expected HTML output.
 */

interface MarkdownSample {
  markdown: string;
  expectedHtml: string;
  description: string;
}

interface ProblematicCase {
  markdown: string;
  description: string;
}

export const bulletListSample: MarkdownSample = {
  markdown: '• First bullet\n• Second bullet\n• Third bullet',
  expectedHtml:
    '<ul><li>First bullet</li><li>Second bullet</li><li>Third bullet</li></ul>',
  description: 'Simple bullet list - tests basic list rendering',
};

export const numberedListSample: MarkdownSample = {
  markdown: '1. First item\n2. Second item\n3. Third item',
  expectedHtml:
    '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>',
  description: 'Numbered list - tests sequence preservation',
};

export const nestedTodoSample: MarkdownSample = {
  markdown: '- [ ] Parent task\n  - [ ] Child task\n    - [ ] Grandchild task',
  expectedHtml:
    '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Parent task<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Child task<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Grandchild task</li></ul></li></ul></li></ul>',
  description: 'Nested todos - tests indentation and nesting preservation',
};

export const mixedContentSample: MarkdownSample = {
  markdown:
    '# Header\n\nSome **bold** text and *italic* text.\n\n- [ ] Todo item\n- [x] Completed item\n\n```\ncode block\n```',
  expectedHtml:
    '<h1>Header</h1><p>Some <strong>bold</strong> text and <em>italic</em> text.</p><ul data-type="taskList"><li data-type="taskItem" data-checked="false">Todo item</li><li data-type="taskItem" data-checked="true">Completed item</li></ul><pre><code>code block</code></pre>',
  description: 'Mixed content - tests complex formatting combinations',
};

export const headersSample: MarkdownSample = {
  markdown: '# H1\n## H2\n### H3\n#### H4',
  expectedHtml: '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4>',
  description: 'Headers - tests heading hierarchy',
};

export const inlineFormattingSample: MarkdownSample = {
  markdown:
    '**Bold text**, *italic text*, `code text`, and [link text](https://example.com)',
  expectedHtml:
    '<p><strong>Bold text</strong>, <em>italic text</em>, <code>code text</code>, and <a href="https://example.com">link text</a></p>',
  description: 'Inline formatting - tests bold, italic, code, and links',
};

export const problematicCases = {
  // Cases that have caused bugs in the past
  bulletWithSpacing: {
    markdown:
      '• Item with trailing spaces   \n• Item with no spaces\n•Item without space after bullet',
    description: 'Bullet spacing edge cases',
  } as ProblematicCase,

  emptyLines: {
    markdown: 'Line 1\n\n\nLine 2 after empty lines\n\n',
    description: 'Empty lines handling',
  } as ProblematicCase,

  specialCharacters: {
    markdown: 'Text with émojis 🎉 and spéciål chäractërs',
    description: 'Unicode and special character handling',
  } as ProblematicCase,

  longContent: {
    markdown: 'A'.repeat(1000) + '\n\n' + 'B'.repeat(1000),
    description: 'Long content handling',
  } as ProblematicCase,
};

// All samples for iteration in tests
export const allSamples: MarkdownSample[] = [
  bulletListSample,
  numberedListSample,
  nestedTodoSample,
  mixedContentSample,
  headersSample,
  inlineFormattingSample,
];
