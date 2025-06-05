import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  onTaskToggle?: (lineIndex: number, completed: boolean) => void;
  onNoteLink?: (noteId: string) => void;
}

interface TaskListProps {
  ordered?: boolean;
  children: React.ReactNode;
  depth?: number;
}

interface TaskItemProps {
  checked?: boolean;
  children: React.ReactNode;
  index?: number;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onTaskToggle,
  onNoteLink
}) => {
  const components: Components = {
    // Custom list rendering for task lists
    ul: ({ children, ...props }: TaskListProps) => {
      const depth = (props as any)?.depth || 0;
      return (
        <ul className={`task-list space-y-1 ${depth > 0 ? 'nested-task-list' : ''}`} {...props}>
          {children}
        </ul>
      );
    },
    
    // Custom list item rendering for tasks
    li: ({ children, ...props }: any) => {
      const isTaskItem = typeof children === 'object' && 
        Array.isArray(children) && 
        children.some(child => 
          typeof child === 'object' && 
          child?.type === 'input' && 
          child?.props?.type === 'checkbox'
        );

      if (isTaskItem) {
        const checkbox = children.find((child: any) => 
          typeof child === 'object' && 
          child?.type === 'input' && 
          child?.props?.type === 'checkbox'
        );
        
        const textContent = children.filter((child: any) => 
          typeof child === 'string' || 
          (typeof child === 'object' && child?.type !== 'input')
        );

        const isChecked = checkbox?.props?.checked || false;
        
        return (
          <li className={`task-item flex items-start space-x-2 ${isChecked ? 'completed' : ''}`} {...props}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                if (onTaskToggle) {
                  // Find line index - this is a simplified approach
                  const lines = content.split('\n');
                  const lineIndex = lines.findIndex(line => 
                    line.includes(textContent.join('').trim())
                  );
                  onTaskToggle(lineIndex, e.target.checked);
                }
              }}
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
            {...props}
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
    }
  };

  return (
    <div className="markdown-content prose prose-sm max-w-none">
      <ReactMarkdown 
        components={components}
        skipHtml={true}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;