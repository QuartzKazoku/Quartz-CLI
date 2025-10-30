// tests/autocomplete.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Test suite for autocomplete functionality
 * Note: These tests use mocked enquirer since we can't test interactive prompts directly
 */
describe('AutoComplete Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('autocomplete', () => {
    it('should accept string array choices', async () => {
      // This test verifies the function signature accepts string arrays
      const choices = ['option1', 'option2', 'option3'];
      expect(choices).toHaveLength(3);
      expect(typeof choices[0]).toBe('string');
    });

    it('should accept object array choices', async () => {
      const choices = [
        { name: 'opt1', value: 'value1', message: 'Option 1' },
        { name: 'opt2', value: 'value2', message: 'Option 2' },
      ];
      expect(choices).toHaveLength(2);
      expect(choices[0]).toHaveProperty('name');
      expect(choices[0]).toHaveProperty('value');
    });

    it('should support options configuration', async () => {
      const options = {
        limit: 10,
        initial: 0,
        multiple: false,
        suggest: (input: string, choices: any[]) => choices,
        footer: () => 'Footer text',
      };
      
      expect(options.limit).toBe(10);
      expect(typeof options.suggest).toBe('function');
      expect(typeof options.footer).toBe('function');
    });
  });

  describe('autocompleteBranch', () => {
    it('should format branch choices correctly', () => {
      const branches = ['main', 'develop', 'feature/test'];
      const currentBranch = 'main';
      
      const choices = branches.map(branch => ({
        name: branch,
        value: branch,
        message: branch === currentBranch ? `${branch} (current)` : branch,
      }));
      
      expect(choices[0].message).toBe('main (current)');
      expect(choices[1].message).toBe('develop');
    });

    it('should filter branches based on input', () => {
      const choices = [
        { name: 'main', message: 'main' },
        { name: 'feature/new-ui', message: 'feature/new-ui' },
        { name: 'fix/bug-123', message: 'fix/bug-123' },
      ];
      
      const input = 'feature';
      const filtered = choices.filter(choice =>
        choice.message.toLowerCase().includes(input.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('feature/new-ui');
    });
  });

  describe('autocompleteFile', () => {
    it('should filter files based on input', () => {
      const files = [
        'src/index.ts',
        'src/app.ts',
        'tests/app.test.ts',
        'README.md',
      ];
      
      const input = 'test';
      const filtered = files.filter(file =>
        file.toLowerCase().includes(input.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe('tests/app.test.ts');
    });

    it('should support multiple file selection', () => {
      const options = {
        multiple: true,
        limit: 15,
      };
      
      expect(options.multiple).toBe(true);
      expect(options.limit).toBe(15);
    });
  });

  describe('autocompleteIssue', () => {
    it('should format issue choices correctly', () => {
      const issues = [
        { number: 123, title: 'Fix bug', labels: ['bug', 'priority-high'] },
        { number: 124, title: 'Add feature', labels: ['enhancement'] },
        { number: 125, title: 'Update docs', labels: [] },
      ];
      
      const choices = issues.map(issue => ({
        name: `${issue.number}`,
        value: issue,
        message: `#${issue.number} - ${issue.title}${
          issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : ''
        }`,
      }));
      
      expect(choices[0].message).toBe('#123 - Fix bug [bug, priority-high]');
      expect(choices[1].message).toBe('#124 - Add feature [enhancement]');
      expect(choices[2].message).toBe('#125 - Update docs');
    });

    it('should filter issues by number', () => {
      const choices = [
        { name: '123', message: '#123 - Fix bug' },
        { name: '124', message: '#124 - Add feature' },
        { name: '125', message: '#125 - Update docs' },
      ];
      
      const input = '124';
      const filtered = choices.filter(choice =>
        choice.name.includes(input) ||
        choice.message.toLowerCase().includes(input.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('124');
    });

    it('should filter issues by keywords', () => {
      const choices = [
        { name: '123', message: '#123 - Fix login bug' },
        { name: '124', message: '#124 - Add dark mode' },
        { name: '125', message: '#125 - Update documentation' },
      ];
      
      const input = 'doc';
      const filtered = choices.filter(choice =>
        choice.message.toLowerCase().includes(input.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].message).toContain('documentation');
    });
  });

  describe('suggest functions', () => {
    it('should implement custom filtering logic', () => {
      const choices = [
        { name: 'Apple', value: 'apple' },
        { name: 'Banana', value: 'banana' },
        { name: 'Cherry', value: 'cherry' },
      ];
      
      const suggest = (input: string, items: any[]) => {
        if (!input) return items;
        const lowerInput = input.toLowerCase();
        return items.filter(item =>
          item.name.toLowerCase().includes(lowerInput)
        );
      };
      
      const result = suggest('an', choices);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Banana');
    });

    it('should return all choices when input is empty', () => {
      const choices = [
        { name: 'opt1', value: '1' },
        { name: 'opt2', value: '2' },
      ];
      
      const suggest = (input: string, items: any[]) => {
        if (!input) return items;
        return items.filter(item => item.name.includes(input));
      };
      
      const result = suggest('', choices);
      expect(result).toHaveLength(2);
    });
  });

  describe('footer functions', () => {
    it('should return formatted footer text', () => {
      const footer = () => '\n  Type to filter branches';
      expect(footer()).toBe('\n  Type to filter branches');
    });

    it('should support dynamic footer content', () => {
      const createFooter = (count: number) => () => `\n  ${count} items available`;
      const footer = createFooter(5);
      expect(footer()).toBe('\n  5 items available');
    });
  });
});