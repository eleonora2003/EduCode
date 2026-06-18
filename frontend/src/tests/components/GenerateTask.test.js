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

// Helper to wait for animations to complete
const waitForAnimation = () => new Promise(resolve => setTimeout(resolve, 300));

// Helper to wait for the create button to appear after wizard navigation
const waitForCreateButton = async () => {
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /create exercise/i })).toBeInTheDocument();
  }, { timeout: 2000 });
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

  // Helper function to navigate through wizard for custom exercise
  const navigateCustomWizard = async (container, { language = 'Python', concept = 'Loops', difficulty = 'Basic' } = {}) => {
    // Step 0: Choose "Custom Exercise"
    await waitFor(() => {
      const customExerciseCards = container.querySelectorAll('.template-mode-card');
      expect(customExerciseCards.length).toBeGreaterThanOrEqual(2);
    });
    const customExerciseCards = container.querySelectorAll('.template-mode-card');
    fireEvent.click(customExerciseCards[1]); // Custom Exercise is second card
    await waitForAnimation();

    // Step 1: Choose "Single Exercise" mode
    await waitFor(() => {
      const modeCards = container.querySelectorAll('.generation-mode-card');
      expect(modeCards.length).toBeGreaterThanOrEqual(2);
    });
    const modeCards = container.querySelectorAll('.generation-mode-card');
    fireEvent.click(modeCards[0]); // Single Exercise is first card
    await waitForAnimation();

    // Step 2: Choose Language
    await waitFor(() => {
      const languageCards = container.querySelectorAll('.language-card');
      expect(languageCards.length).toBeGreaterThanOrEqual(2);
    });
    const languageCards = container.querySelectorAll('.language-card');
    if (language === 'Python') {
      fireEvent.click(languageCards[0]);
    } else if (language === 'Java') {
      fireEvent.click(languageCards[1]);
    }
    await waitForAnimation();

    // Step 3: Choose Concept
    await waitFor(() => {
      const conceptCards = container.querySelectorAll('.concept-card');
      expect(conceptCards.length).toBeGreaterThan(0);
    });
    const conceptCards = container.querySelectorAll('.concept-card');
    const conceptCard = Array.from(conceptCards).find(card => card.textContent.includes(concept));
    if (conceptCard) {
      fireEvent.click(conceptCard);
    }
    await waitForAnimation();

    // Step 4: Choose Difficulty
    await waitFor(() => {
      const difficultyCards = container.querySelectorAll('.difficulty-card');
      expect(difficultyCards.length).toBeGreaterThanOrEqual(3);
    });
    const difficultyCards = container.querySelectorAll('.difficulty-card');
    const difficultyCard = Array.from(difficultyCards).find(card => card.textContent.includes(difficulty));
    if (difficultyCard) {
      fireEvent.click(difficultyCard);
    }
    await waitForAnimation();

    // Wait for the final create step to appear
    await waitForCreateButton();
  };

  describe('Form Rendering', () => {
    it('should render generate task form with initial screen', () => {
      renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      expect(screen.getByText('How do you want to start?')).toBeInTheDocument();
      expect(screen.getByText('From Template')).toBeInTheDocument();
      expect(screen.getByText('Custom Exercise')).toBeInTheDocument();
    });

    it('should show language selection after navigating wizard', async () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      // Click Custom Exercise
      const customExerciseCards = container.querySelectorAll('.template-mode-card');
      fireEvent.click(customExerciseCards[1]);
      await waitForAnimation();

      // Click Single Exercise
      const modeCards = container.querySelectorAll('.generation-mode-card');
      fireEvent.click(modeCards[0]);
      await waitForAnimation();

      // Should show language selection
      expect(screen.getByText('Which programming language?')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Java')).toBeInTheDocument();
    });

    it('should show concept selection after choosing language', async () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      // Navigate to language step
      const customExerciseCards = container.querySelectorAll('.template-mode-card');
      fireEvent.click(customExerciseCards[1]);
      await waitForAnimation();

      const modeCards = container.querySelectorAll('.generation-mode-card');
      fireEvent.click(modeCards[0]);
      await waitForAnimation();

      // Choose Python
      const languageCards = container.querySelectorAll('.language-card');
      fireEvent.click(languageCards[0]);
      await waitForAnimation();

      // Should show concept selection
      expect(screen.getByText('What topic should students practice?')).toBeInTheDocument();
      expect(screen.getByText('Loops')).toBeInTheDocument();
      expect(screen.getByText('Functions')).toBeInTheDocument();
    });
  });

  describe('Task Generation', () => {
    it('should call generate API with correct parameters', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });

      // Click Create Exercise button
      const createButton = screen.getByRole('button', { name: /create exercise/i });
      expect(createButton).toBeInTheDocument();
      fireEvent.click(createButton);

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

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

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

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

      await waitFor(() => {
        const loadingOverlays = container.querySelectorAll('.loading-overlay');
        expect(loadingOverlays.length).toBeGreaterThan(0);
      });
    });
  });


  describe('Copy to Clipboard', () => {
    it('should copy solution to clipboard when clicked', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reference Solution'));
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

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Unit Tests'));
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

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

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

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

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

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

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

      await navigateCustomWizard(container, { language: 'Python', concept: 'Loops', difficulty: 'Basic' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

      await waitFor(() => {
        expect(screen.getByText(/Python/i)).toBeInTheDocument();
      });
    });

    it('should display language for Java', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      await navigateCustomWizard(container, { language: 'Java', concept: 'Functions', difficulty: 'Intermediate' });
      fireEvent.click(screen.getByRole('button', { name: /create exercise/i }));

      await waitFor(() => {
        expect(screen.getByText(/Java/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template Mode', () => {
    it('should show templates when choosing From Template', async () => {
      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate} />
      );

      await waitFor(() => expect(mockGetAll).toHaveBeenCalled());

      // Click "From Template"
      const templateModeCards = container.querySelectorAll('.template-mode-card');
      fireEvent.click(templateModeCards[0]);
      await waitForAnimation();

      // Should show templates
      await waitFor(() => {
        expect(screen.getByText('Pick a template')).toBeInTheDocument();
        expect(screen.getByText('Template 1')).toBeInTheDocument();
        expect(screen.getByText('Template 2')).toBeInTheDocument();
      });
    });
  });
});