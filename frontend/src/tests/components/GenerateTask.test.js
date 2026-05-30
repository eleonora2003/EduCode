import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GenerateTask from '../../components/GenerateTask';

const mockGenerate = jest.fn();
const mockCreate = jest.fn();
const mockGetAll = jest.fn();

jest.mock('../../api/client', () => ({
  tasksAPI: {
    generate: (...args) => mockGenerate(...args),
    create: (...args) => mockCreate(...args),
  },
  templatesAPI: {
    getAll: (...args) => mockGetAll(...args),
  },
  validationAPI: {},
}));

const mockAlert = jest.fn();
window.alert = mockAlert;

const mockSessionStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('GenerateTask Component', () => {
  const mockSetTask = jest.fn();
  const mockOnNavigate = jest.fn();
  
  const mockGeneratedTask = {
    title: 'Test Task Title',
    description: 'This is a test task description.',
    solution: 'def solution():\n    return "Hello World"',
    tests: 'def test_solution():\n    assert solution() == "Hello World"',
    examples: 'Example: solution() returns "Hello World"',
  };

  const mockTemplates = [
    { template_id: 1, name: 'Template 1', concept: 'Loops', difficulty: 'Basic', description: 'Language: Python' },
    { template_id: 2, name: 'Template 2', concept: 'Functions', difficulty: 'Intermediate', description: 'Language: Java' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue({ data: mockTemplates });
    mockGenerate.mockReset();
    mockCreate.mockReset();
  });

  const fillForm = (container, { language, concept, difficulty } = {}) => {
    const selects = container.querySelectorAll('select');
    if (language) fireEvent.change(selects[0], { target: { value: language } });
    if (concept) fireEvent.change(selects[1], { target: { value: concept } });
    if (difficulty) fireEvent.change(selects[2], { target: { value: difficulty } });
  };

  describe('Form Rendering', () => {
    it('should render generate task form with all fields', () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      expect(screen.getByText('Generate Programming Task')).toBeInTheDocument();
      
      const labels = container.querySelectorAll('label');
      const labelTexts = Array.from(labels).map(l => l.textContent);
      expect(labelTexts).toContain('Programming Language');
      expect(labelTexts).toContain('Programming Concept');
      expect(labelTexts).toContain('Difficulty Level');
      expect(labelTexts).toContain('Custom Template');
      
      const selects = container.querySelectorAll('select');
      expect(selects.length).toBe(4);
      
      expect(screen.getByRole('button', { name: /generate complete task/i })).toBeInTheDocument();
    });

    it('should have language options', () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      const selects = container.querySelectorAll('select');
      expect(selects[0].options.length).toBe(3); 
    });

    it('should have concept options', () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      const selects = container.querySelectorAll('select');
      expect(selects[1].options.length).toBe(11); 
    });

    it('should have difficulty options', () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      const selects = container.querySelectorAll('select');
      expect(selects[2].options.length).toBe(4); 
    });
  });

  describe('Form Validation', () => {
    it('should enable generate button when all required fields are filled', () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });

      expect(screen.getByRole('button', { name: /generate complete task/i })).not.toBeDisabled();
    });
  });

  describe('Template Selection', () => {
    it('should display templates in the dropdown', async () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      await waitFor(() => expect(mockGetAll).toHaveBeenCalled());

      const selects = container.querySelectorAll('select');
      expect(selects.length).toBe(4);
    });
  });

  describe('Task Generation', () => {
    it('should call generate API with correct parameters', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
          language: 'Python',
          concept: 'Loops',
          difficulty: 'Basic',
        }));
      });
    });

    it('should display generated task title after generation', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });
    });

    it('should show loading state during generation', async () => {
      let resolveGenerate;
      mockGenerate.mockImplementation(() => new Promise((resolve) => {
        resolveGenerate = resolve;
      }));

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generating with ai/i })).toBeInTheDocument();
      });

      resolveGenerate({ data: mockGeneratedTask });
    });
  });

  describe('Tab Switching', () => {
    it('should show description tab content after generation', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      expect(screen.getByText('📝 Task Description')).toBeInTheDocument();
      expect(screen.getByText('This is a test task description.')).toBeInTheDocument();
    });

    it('should switch to solution tab when clicked', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('💡 Reference Solution'));
      
      await waitFor(() => {
        expect(screen.getByText(/def solution/i)).toBeInTheDocument();
      });
    });

    it('should switch to tests tab when clicked', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🧪 Unit Tests'));
      
      await waitFor(() => {
        expect(screen.getByText(/def test_solution/i)).toBeInTheDocument();
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy solution to clipboard when clicked', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('💡 Reference Solution'));
      fireEvent.click(screen.getByRole('button', { name: /copy code/i }));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(mockGeneratedTask.solution);
      });
    });

    it('should copy tests to clipboard when clicked', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🧪 Unit Tests'));
      fireEvent.click(screen.getByRole('button', { name: /copy tests/i }));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(mockGeneratedTask.tests);
      });
    });
  });

  describe('Save Task', () => {
    it('should save task successfully', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });
      mockCreate.mockResolvedValueOnce({ data: { id: 123 } });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save to history/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    it('should show error when save fails', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });
      mockCreate.mockRejectedValueOnce({ response: { status: 500 } });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save to history/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });
    });
  });

  describe('Export to Markdown', () => {
    it('should export task as markdown file', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const mockClick = jest.fn();
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tag) => {
        const element = originalCreateElement.call(document, tag);
        if (tag === 'a') {
          element.click = mockClick;
        }
        return element;
      });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /export/i }));

      await waitFor(() => {
        expect(mockClick).toHaveBeenCalled();
      });

      document.createElement = originalCreateElement;
    });
  });

  describe('Language and Difficulty Display', () => {
    it('should display language icon for Python', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText(/🐍 Python/i)).toBeInTheDocument();
      });
    });

    it('should display language icon for Java', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      fillForm(container, { language: 'Java', concept: 'Functions', difficulty: 'Intermediate' });
      fireEvent.click(screen.getByRole('button', { name: /generate complete task/i }));

      await waitFor(() => {
        expect(screen.getByText(/☕ Java/i)).toBeInTheDocument();
      });
    });
  });
});