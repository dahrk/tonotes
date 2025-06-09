/**
 * Style utility functions for composable className management
 * 
 * Main export is cn() which intelligently combines class names,
 * filtering out undefined/false values for conditional styling.
 */

/**
 * Combines class names intelligently, filtering out undefined values
 * @param {...(string|undefined|false)} classes - Class names to combine
 * @returns {string} Combined class names
 * 
 * Example usage:
 * cn('base-class', isActive && 'active', error && 'error-state')
 * cn('btn', variant === 'primary' && 'btn-primary', className)
 */
export const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ===== Layout Patterns =====
// Common layout utilities used across multiple components
export const layoutStyles = {
  centerContent: "w-full h-full flex items-center justify-center", // Loading states, error states
  macOSHeaderSpacing: "ml-[70px]", // Space for macOS traffic light buttons
} as const;

// ===== Tag Component Patterns =====
// Styling for tag pills, buttons, and interactions
export const tagStyles = {
  pill: "tag-pill group flex items-center space-x-1 flex-shrink-0", // Individual tag display
  removeButton: "tag-remove-button opacity-0 group-hover:opacity-100 transition-opacity", // Tag deletion
  addButton: "tag-add-button", // Add new tag button
} as const;

// ===== Button Patterns =====
// Consistent button styling across components
export const buttonStyles = {
  base: "header-button", // Standard header buttons (save, etc.)
  delete: "header-button delete-button", // Destructive action buttons
} as const;

// ===== Typography Patterns =====
// Text styling using CSS variables for theme support
export const textStyles = {
  primary: "text-[var(--text-primary)]", // Main text content
  secondary: "text-[var(--text-secondary)]", // Supporting text
  heading: "text-[var(--text-heading)]", // Headers and emphasis
} as const;

// ===== Editor Component Patterns =====
// Styling for Tiptap editor and content areas
export const editorStyles = {
  tiptap: "tiptap-editor prose prose-sm max-w-none focus:outline-none", // Tiptap editor instance
  content: "note-content relative h-full", // Editor wrapper container
  scrollable: "h-full overflow-y-auto scrollable-content", // Scrollable content area
} as const;

// ===== Positioning Utilities =====
// Common positioning patterns for dropdowns and overlays
export const positionStyles = {
  absolute: "absolute", // Basic absolute positioning
  dropdown: "absolute z-[1000]", // Dropdown menus and search overlays
} as const;