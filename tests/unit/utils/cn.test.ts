/**
 * Test Suite: cn() Utility Function
 *
 * Tests the composable className utility that intelligently combines
 * class names and filters out falsy values for conditional styling.
 */

import { cn } from '../../../src/utils/styles';

describe('cn() Utility Function', () => {
  /**
   * Basic functionality tests
   */
  describe('Basic Functionality', () => {
    it('combines multiple class names with spaces', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles single class name', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('returns empty string when no arguments provided', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('handles empty strings', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });
  });

  /**
   * Conditional styling tests
   */
  describe('Conditional Styling', () => {
    it('filters out false values', () => {
      const result = cn('base', false && 'false-class', 'other');
      expect(result).toBe('base other');
    });

    it('includes truthy conditional classes', () => {
      const result = cn('base', true && 'true-class', 'other');
      expect(result).toBe('base true-class other');
    });

    it('filters out undefined values', () => {
      const result = cn('base', undefined, 'other');
      expect(result).toBe('base other');
    });

    it('filters out null values', () => {
      const result = cn('base', null, 'other');
      expect(result).toBe('base other');
    });

    it('handles complex conditional logic', () => {
      const isActive = true;
      const isDisabled = false;
      const hasError = true;

      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled',
        hasError && 'error'
      );

      expect(result).toBe('base-class active error');
    });
  });

  /**
   * Real-world usage patterns
   */
  describe('Real-world Usage Patterns', () => {
    it('handles button variant styling', () => {
      const variant = 'primary';
      const size = 'large';
      const disabled = false;

      const result = cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        size === 'large' && 'btn-lg',
        disabled && 'btn-disabled'
      );

      expect(result).toBe('btn btn-primary btn-lg');
    });

    it('handles component state styling', () => {
      const isOpen = true;
      const isSelected = false;
      const hasChildren = true;

      const result = cn(
        'menu-item',
        isOpen && 'menu-item--open',
        isSelected && 'menu-item--selected',
        hasChildren && 'menu-item--has-children'
      );

      expect(result).toBe('menu-item menu-item--open menu-item--has-children');
    });

    it('handles responsive and theme classes', () => {
      const isMobile = false;
      const isDarkTheme = true;
      const className = 'custom-class';

      const result = cn(
        'container',
        'p-4',
        isMobile && 'mobile:p-2',
        isDarkTheme && 'dark:bg-gray-900',
        className
      );

      expect(result).toBe('container p-4 dark:bg-gray-900 custom-class');
    });

    it('handles tag component styling example', () => {
      const isHovered = true;
      const isRemoving = false;
      const color = 'blue';

      const result = cn(
        'tag-pill',
        'group',
        'flex',
        'items-center',
        isHovered && 'opacity-80',
        isRemoving && 'animate-pulse',
        color === 'blue' && 'bg-blue-100 text-blue-800',
        color === 'green' && 'bg-green-100 text-green-800'
      );

      expect(result).toBe(
        'tag-pill group flex items-center opacity-80 bg-blue-100 text-blue-800'
      );
    });
  });

  /**
   * Edge cases and error handling
   */
  describe('Edge Cases', () => {
    it('handles zero as a falsy value', () => {
      const result = cn('base', 0 && 'zero-class', 'other');
      expect(result).toBe('base other');
    });

    it('handles number 1 as truthy', () => {
      const result = cn('base', 1 && 'number-class', 'other');
      expect(result).toBe('base number-class other');
    });

    it('handles empty object as truthy', () => {
      const result = cn('base', {} && 'object-class', 'other');
      expect(result).toBe('base object-class other');
    });

    it('handles empty array as truthy', () => {
      const result = cn('base', [] && 'array-class', 'other');
      expect(result).toBe('base array-class other');
    });

    it('handles function as truthy', () => {
      const result = cn('base', (() => 'function-class')(), 'other');
      expect(result).toBe('base function-class other');
    });

    it('handles whitespace in class names', () => {
      const result = cn('  base  ', ' other ', '  final  ');
      expect(result).toBe('  base    other    final  ');
    });

    it('handles very long class name combinations', () => {
      const longClass = 'a'.repeat(100);
      const result = cn('base', longClass, 'end');
      expect(result).toBe(`base ${longClass} end`);
    });
  });

  /**
   * Performance and type safety tests
   */
  describe('Performance and Type Safety', () => {
    it('performs well with many arguments', () => {
      const start = performance.now();

      // Test with many arguments
      const result = cn(
        'class1',
        'class2',
        'class3',
        'class4',
        'class5',
        true && 'class6',
        false && 'class7',
        undefined,
        'class8',
        'class9',
        'class10',
        null,
        'class11'
      );

      const end = performance.now();

      expect(result).toBe(
        'class1 class2 class3 class4 class5 class6 class8 class9 class10 class11'
      );
      expect(end - start).toBeLessThan(10); // Should complete in under 10ms
    });

    it('returns consistent results for same inputs', () => {
      const inputs: (string | false | undefined)[] = ['base', true && 'active', false && 'disabled', 'end'];

      const result1 = cn(...inputs);
      const result2 = cn(...inputs);
      const result3 = cn(...inputs);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe('base active end');
    });

    it('handles mixed argument types gracefully', () => {
      const result = cn(
        'string',
        123 && 'number-truthy',
        0 && 'number-falsy',
        true && 'boolean-true',
        false && 'boolean-false',
        null && 'null-value',
        undefined && 'undefined-value',
        '' && 'empty-string'
      );

      expect(result).toBe('string number-truthy boolean-true');
    });
  });

  /**
   * Integration with component patterns
   */
  describe('Integration with Style Constants', () => {
    // Mock style constants for testing
    const mockButtonStyles = {
      base: 'btn',
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    };

    const mockLayoutStyles = {
      centered: 'flex items-center justify-center',
      spaceBetween: 'flex justify-between',
    };

    it('works with predefined style constants', () => {
      const variant = 'primary';
      const isDisabled = false;

      const result = cn(
        mockButtonStyles.base,
        variant === 'primary' && mockButtonStyles.primary,
        variant === 'secondary' && mockButtonStyles.secondary,
        isDisabled && 'opacity-50'
      );

      expect(result).toBe('btn btn-primary');
    });

    it('combines layout and component styles', () => {
      const result = cn(
        mockLayoutStyles.centered,
        mockButtonStyles.base,
        'px-4 py-2'
      );

      expect(result).toBe('flex items-center justify-center btn px-4 py-2');
    });
  });
});
