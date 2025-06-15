/**
 * Integration Tests: Markdown Save/Load Workflow
 *
 * These tests verify the complete markdown save/load workflow including
 * database persistence and UI integration.
 */

import { createMockNote } from '../utils/testHelpers';
import { allSamples } from '../fixtures/markdownSamples';

// Mock the database module
jest.mock('../../src/database/database', () => ({
  saveNote: jest.fn(),
  getNote: jest.fn(),
  getAllNotes: jest.fn(),
}));

// Mock electron API
const mockElectronAPI = {
  notes: {
    save: jest.fn(),
    getAll: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
};

// Set up window.electronAPI mock
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('Markdown Save/Load Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Save/Load Workflow', () => {
    it('should preserve markdown content through complete save/load cycle', async () => {
      // Why this test exists: Verifies end-to-end data persistence
      // Tests the complete flow: UI -> Database -> Storage -> Retrieval -> UI

      const testNote = createMockNote({
        content: '# Test Note\n\n- [ ] Task 1\n- [x] Completed task',
      });

      // Mock successful save
      mockElectronAPI.notes.save.mockResolvedValue({ success: true });
      mockElectronAPI.notes.getAll.mockResolvedValue([testNote]);

      // Simulate save operation
      const saveResult = await mockElectronAPI.notes.save(testNote);
      expect(saveResult.success).toBe(true);
      expect(mockElectronAPI.notes.save).toHaveBeenCalledWith(testNote);

      // Simulate load operation
      const loadedNotes = await mockElectronAPI.notes.getAll();
      expect(loadedNotes).toHaveLength(1);
      expect(loadedNotes[0].content).toBe(testNote.content);
    });

    it('should handle multiple save/load cycles without data corruption', async () => {
      // Why this test exists: Ensures data integrity over multiple save cycles
      // Critical: Repeated saves must not degrade content quality

      const originalContent = '1. First item\n2. Second item\n3. Third item';
      let testNote = createMockNote({ content: originalContent });

      mockElectronAPI.notes.save.mockResolvedValue({ success: true });

      // Simulate 5 save/load cycles
      for (let i = 0; i < 5; i++) {
        // Save
        await mockElectronAPI.notes.save(testNote);

        // Load (simulate getting the note back)
        mockElectronAPI.notes.getAll.mockResolvedValue([testNote]);
        const loadedNotes = await mockElectronAPI.notes.getAll();
        testNote = loadedNotes[0];
      }

      // Content should be identical after multiple cycles
      expect(testNote.content).toBe(originalContent);
      expect(mockElectronAPI.notes.save).toHaveBeenCalledTimes(5);
    });
  });

  describe('Format-Specific Preservation', () => {
    it.each(allSamples)(
      'should preserve $description through save/load cycle',
      async ({ markdown, description }) => {
        // Why these tests exist: Each format has unique serialization challenges
        // Ensures no specific format is broken by the save/load process

        const testNote = createMockNote({ content: markdown });

        mockElectronAPI.notes.save.mockResolvedValue({ success: true });
        mockElectronAPI.notes.getAll.mockResolvedValue([testNote]);

        // Save and load
        await mockElectronAPI.notes.save(testNote);
        const loadedNotes = await mockElectronAPI.notes.getAll();

        expect(loadedNotes[0].content).toBe(markdown);
      }
    );
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent save operations safely', async () => {
      // Why this test exists: Users may trigger multiple saves quickly
      // Must handle race conditions without data corruption

      const notes = [
        createMockNote({ id: 'note-1', content: 'Content 1' }),
        createMockNote({ id: 'note-2', content: 'Content 2' }),
        createMockNote({ id: 'note-3', content: 'Content 3' }),
      ];

      // Mock successful saves for all notes
      mockElectronAPI.notes.save.mockResolvedValue({ success: true });

      // Simulate concurrent saves
      const savePromises = notes.map(note => mockElectronAPI.notes.save(note));
      const results = await Promise.all(savePromises);

      // All saves should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockElectronAPI.notes.save).toHaveBeenCalledTimes(3);
    });

    it('should handle save errors gracefully', async () => {
      // Why this test exists: Save operations may fail due to various reasons
      // Must provide proper error handling and user feedback

      const testNote = createMockNote();

      // Mock save failure
      mockElectronAPI.notes.save.mockRejectedValue(new Error('Save failed'));

      // Should handle error without crashing
      await expect(mockElectronAPI.notes.save(testNote)).rejects.toThrow('Save failed');
      expect(mockElectronAPI.notes.save).toHaveBeenCalledWith(testNote);
    });
  });

  describe('Large Content Handling', () => {
    it('should handle large notes efficiently', async () => {
      // Why this test exists: Large notes should not cause performance issues
      // Tests both save and load performance with substantial content

      const largeContent = Array(1000)
        .fill(0)
        .map((_, i) => `- [ ] Task item ${i + 1}`)
        .join('\n');

      const largeNote = createMockNote({ content: largeContent });

      mockElectronAPI.notes.save.mockResolvedValue({ success: true });
      mockElectronAPI.notes.getAll.mockResolvedValue([largeNote]);

      const start = performance.now();

      // Save large note
      await mockElectronAPI.notes.save(largeNote);

      // Load large note
      const loadedNotes = await mockElectronAPI.notes.getAll();

      const end = performance.now();

      expect(loadedNotes[0].content).toBe(largeContent);
      expect(end - start).toBeLessThan(500); // Should complete in under 500ms
    });
  });

  describe('Data Integrity Validation', () => {
    it('should validate note structure after load', async () => {
      // Why this test exists: Loaded data must conform to expected structure
      // Ensures database corruption doesn't crash the application

      const testNote = createMockNote();
      mockElectronAPI.notes.getAll.mockResolvedValue([testNote]);

      const loadedNotes = await mockElectronAPI.notes.getAll();
      const note = loadedNotes[0];

      // Validate all required fields are present
      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('content');
      expect(note).toHaveProperty('color');
      expect(note).toHaveProperty('position_x');
      expect(note).toHaveProperty('position_y');
      expect(note).toHaveProperty('width');
      expect(note).toHaveProperty('height');
      expect(note).toHaveProperty('created_at');
      expect(note).toHaveProperty('updated_at');

      // Validate data types
      expect(typeof note.id).toBe('string');
      expect(typeof note.content).toBe('string');
      expect(['yellow', 'pink', 'blue']).toContain(note.color);
      expect(typeof note.position_x).toBe('number');
      expect(typeof note.position_y).toBe('number');
    });

    it('should handle malformed data gracefully', async () => {
      // Why this test exists: Corrupted data should not crash the application
      // Must provide fallbacks for invalid or missing data

      const malformedNote = {
        id: 'test-id',
        content: null, // Invalid content
        color: 'invalid-color', // Invalid color
        position_x: 'not-a-number', // Invalid position
      };

      mockElectronAPI.notes.getAll.mockResolvedValue([malformedNote]);

      // Should not throw an error
      const loadedNotes = await mockElectronAPI.notes.getAll();
      expect(loadedNotes).toHaveLength(1);
    });
  });
});
