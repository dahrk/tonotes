import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  onTaskToggle?: (lineIndex: number, completed: boolean) => void;
  onNoteLink?: (noteId: string) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onTaskToggle,
  onNoteLink
}) => {
  const components: Components = {
    // Custom list rendering
    ul: ({ children, ...props }) => {
      return (
        <ul className="task-list space-y-1" {...props}>
          {children}
        </ul>
      );
    },
    
    // Custom list item rendering for tasks with improved checkbox detection
    li: ({ children, ...props }: any) => {
      // Check if this is a task item by looking for checkbox patterns
      const isTaskItem = React.Children.toArray(children).some((child: any) => 
        child?.type === 'input' && child?.props?.type === 'checkbox'
      );

      if (isTaskItem) {
        // Find the checkbox element
        const checkbox = React.Children.toArray(children).find((child: any) => 
          child?.type === 'input' && child?.props?.type === 'checkbox'
        ) as any;
        
        // Get the text content (everything that's not the checkbox)
        const textContent = React.Children.toArray(children).filter((child: any) => 
          !(child?.type === 'input' && child?.props?.type === 'checkbox')
        );

        const isChecked = checkbox?.props?.checked || false;
        
        // Find the line index by matching content
        const handleToggle = () => {
          if (onTaskToggle) {
            const lines = content.split('\n');
            // Extract text content as string for matching
            const taskText = React.Children.toArray(textContent)
              .map(child => typeof child === 'string' ? child : '')
              .join('')
              .trim();
            
            // Find the line that contains this task
            const lineIndex = lines.findIndex(line => {
              const cleanLine = line.replace(/^\s*[-*+]\s*\[[ x]\]\s*/, '').trim();
              return cleanLine === taskText || line.includes(taskText);
            });
            
            if (lineIndex !== -1) {
              onTaskToggle(lineIndex, !isChecked);
            }
          }
        };
        
        return (
          <li className={`task-item flex items-start space-x-2 ${isChecked ? 'completed' : ''}`} {...props}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={handleToggle}
              className="task-checkbox mt-0.5 flex-shrink-0"
            />
            <span className={`task-content flex-1 ${isChecked ? 'line-through text-gray-500' : ''}`}>
              {textContent}
            </span>
          </li>
        );
      }

      return <li {...props}>{children}</li>;
    },

    // Custom paragraph rendering
    p: ({ children, ...props }) => (
      <p className="mb-2 last:mb-0" {...props}>
        {children}
      </p>
    ),

    // Custom heading rendering
    h1: ({ children, ...props }) => (
      <h1 className="text-lg font-bold mb-2" {...props}>
        {children}
      </h1>
    ),
    
    h2: ({ children, ...props }) => (
      <h2 className="text-base font-bold mb-2" {...props}>
        {children}
      </h2>
    ),
    
    h3: ({ children, ...props }) => (
      <h3 className="text-sm font-bold mb-2" {...props}>
        {children}
      </h3>
    ),

    // Custom strong/bold rendering
    strong: ({ children, ...props }) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),

    // Custom emphasis/italic rendering
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    // Custom code rendering
    code: ({ children, ...props }) => (
      <code className="bg-black bg-opacity-10 px-1 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    ),

    // Block code rendering
    pre: ({ children, ...props }) => (
      <pre className="bg-black bg-opacity-10 p-2 rounded text-sm font-mono overflow-x-auto mb-2" {...props}>
        {children}
      </pre>
    ),

    // Custom link rendering for note links
    a: ({ href, children, ...props }) => {
      if (href?.startsWith('note://')) {
        const noteId = href.replace('note://', '');
        
        return (
          <button
            onClick={(e) => {
              e.preventDefault();
              if (onNoteLink) {
                onNoteLink(noteId);
              } else {
                alert(`Link to note: ${noteId}\n(Note linking not implemented in this context)`);
              }
            }}
            className="note-link"
            title={`Link to note: ${noteId}`}
            type="button"
          >
            {children}
          </button>
        );
      }
      
      // Regular external links
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="external-link"
          {...props}
        >
          {children}
        </a>
      );
    },

    // Custom blockquote rendering
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2" {...props}>
        {children}
      </blockquote>
    ),

    // Custom table rendering
    table: ({ children, ...props }) => (
      <table className="min-w-full border-collapse border border-gray-300 my-2" {...props}>
        {children}
      </table>
    ),

    th: ({ children, ...props }) => (
      <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left" {...props}>
        {children}
      </th>
    ),

    td: ({ children, ...props }) => (
      <td className="border border-gray-300 px-2 py-1" {...props}>
        {children}
      </td>
    ),

    // Custom hr rendering
    hr: ({ ...props }) => (
      <hr className="my-4 border-gray-300" {...props} />
    )
  };

  return (
    <div className="markdown-content prose prose-sm max-w-none">
      <ReactMarkdown 
        components={components}
        remarkPlugins={[remarkGfm]}
        skipHtml={false}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;