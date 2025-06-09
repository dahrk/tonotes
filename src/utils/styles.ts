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

// Reusable layout patterns
export const layoutStyles = {
  centerContent: "w-full h-full flex items-center justify-center",
  macOSHeaderSpacing: "ml-[70px]", // Space for macOS traffic light buttons
} as const;

// Common component patterns
export const tagStyles = {
  pill: "tag-pill group flex items-center space-x-1 flex-shrink-0",
  removeButton: "tag-remove-button opacity-0 group-hover:opacity-100 transition-opacity",
  addButton: "tag-add-button",
} as const;

// Button style patterns
export const buttonStyles = {
  base: "header-button",
  delete: "header-button delete-button",
} as const;

// Text and typography patterns  
export const textStyles = {
  primary: "text-[var(--text-primary)]",
  secondary: "text-[var(--text-secondary)]",
  heading: "text-[var(--text-heading)]",
} as const;

// Editor and content patterns
export const editorStyles = {
  tiptap: "tiptap-editor prose prose-sm max-w-none focus:outline-none",
  content: "note-content relative h-full",
  scrollable: "h-full overflow-y-auto scrollable-content",
} as const;

// Positioning patterns for dropdowns/modals
export const positionStyles = {
  absolute: "absolute",
  dropdown: "absolute z-[1000]",
} as const;