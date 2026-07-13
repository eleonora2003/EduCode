import {render,screen,fireEvent,waitFor,act,} from '@testing-library/react';
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
  configurable: true,
});

const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: {writeText: mockWriteText,},
  writable: true,configurable: true,
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// GenerateTask performs wizard navigation inside a 160 ms timeout.
// Waiting inside act() ensures those state updates are handled by React.
const waitForAnimation = async () => {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
  });
};
const waitForCreateButton = async () => {
  await waitFor(
    () => {
      expect(screen.getByRole('button', {name: /create exercise/i,})).toBeInTheDocument();},
    {timeout: 2000,}
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
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const navigateCustomWizard = async (container, { language = 'Python', concept = 'Loops', difficulty = 'Basic' } = {}) => {
    // Step 0: Choose Custom Exercise
    await waitFor(() => {
      const customExerciseCards = container.querySelectorAll('.template-mode-card');
      expect(customExerciseCards.length).toBeGreaterThanOrEqual(2);
    });

    let customExerciseCards = container.querySelectorAll('.template-mode-card');
    fireEvent.click(customExerciseCards[1]);

    await waitForAnimation();

    // Step 1: Choose Single Exercise
    await waitFor(() => {
      const modeCards =
        container.querySelectorAll('.generation-mode-card');

      expect(modeCards.length).toBeGreaterThanOrEqual(2);
    });

    let modeCards =
      container.querySelectorAll('.generation-mode-card');

    fireEvent.click(modeCards[0]);

    await waitForAnimation();

    // Step 2: Choose language
    await waitFor(() => {
      const languageCards =
        container.querySelectorAll('.language-card');

      expect(languageCards.length).toBeGreaterThanOrEqual(2);
    });

    const languageCards =
      container.querySelectorAll('.language-card');

    if (language === 'Java') {
      fireEvent.click(languageCards[1]);
    } else {
      fireEvent.click(languageCards[0]);
    }

    await waitForAnimation();

    // Step 3: Choose concept
    await waitFor(() => {
      const conceptCards =
        container.querySelectorAll('.concept-card');

      expect(conceptCards.length).toBeGreaterThan(0);
    });

    const conceptCards =
      container.querySelectorAll('.concept-card');

    const conceptCard = Array.from(conceptCards).find((card) =>
      card.textContent.includes(concept)
    );

    expect(conceptCard).toBeDefined();

    fireEvent.click(conceptCard);

    await waitForAnimation();

    // Step 4: Choose difficulty
    await waitFor(() => {
      const difficultyCards =
        container.querySelectorAll('.difficulty-card');

      expect(difficultyCards.length).toBeGreaterThanOrEqual(3);
    });

    const difficultyCards =
      container.querySelectorAll('.difficulty-card');

    const difficultyCard = Array.from(difficultyCards).find(
      (card) => card.textContent.includes(difficulty)
    );

    expect(difficultyCard).toBeDefined();

    fireEvent.click(difficultyCard);

    await waitForAnimation();

    await waitForCreateButton();
  };

  describe('Form Rendering', () => {
    it('should render generate task form with initial screen', () => {
      renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      expect(
        screen.getByText('How do you want to start?')
      ).toBeInTheDocument();

      expect(
        screen.getByText('From Template')
      ).toBeInTheDocument();

      expect(
        screen.getByText('Custom Exercise')
      ).toBeInTheDocument();
    });

    it('should show language selection after navigating wizard', async () => {
      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      const customExerciseCards =
        container.querySelectorAll('.template-mode-card');

      fireEvent.click(customExerciseCards[1]);

      await waitForAnimation();

      await waitFor(() => {
        expect(
          container.querySelectorAll('.generation-mode-card').length
        ).toBeGreaterThanOrEqual(2);
      });

      const modeCards =
        container.querySelectorAll('.generation-mode-card');

      fireEvent.click(modeCards[0]);

      await waitForAnimation();

      expect(
        screen.getByText('Which programming language?')
      ).toBeInTheDocument();

      expect(
        screen.getByText('Python')
      ).toBeInTheDocument();

      expect(
        screen.getByText('Java')
      ).toBeInTheDocument();
    });

    it('should show concept selection after choosing language', async () => {
      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      const customExerciseCards =
        container.querySelectorAll('.template-mode-card');

      fireEvent.click(customExerciseCards[1]);

      await waitForAnimation();

      await waitFor(() => {
        expect(
          container.querySelectorAll('.generation-mode-card').length
        ).toBeGreaterThanOrEqual(2);
      });

      const modeCards =
        container.querySelectorAll('.generation-mode-card');

      fireEvent.click(modeCards[0]);

      await waitForAnimation();

      await waitFor(() => {
        expect(
          container.querySelectorAll('.language-card').length
        ).toBeGreaterThanOrEqual(2);
      });

      const languageCards =
        container.querySelectorAll('.language-card');

      fireEvent.click(languageCards[0]);

      await waitForAnimation();

      expect(
        screen.getByText('What topic should students practice?')
      ).toBeInTheDocument();

      expect(
        screen.getByText('Loops')
      ).toBeInTheDocument();

      expect(
        screen.getByText('Functions')
      ).toBeInTheDocument();
    });
  });

  describe('Task Generation', () => {
    it('should call generate API with correct parameters', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: mockGeneratedTask,
      });

      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      await navigateCustomWizard(container, {
        language: 'Python',
        concept: 'Loops',
        difficulty: 'Basic',
      });

      const createButton = screen.getByRole('button', {
        name: /create exercise/i,
      });

      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            language: 'Python',
            concept: 'Loops',
            difficulty: 'Basic',
          })
        );
      });
    });

    it('should display generated task title after generation', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: mockGeneratedTask,
      });

      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      await navigateCustomWizard(container, {
        language: 'Python',
        concept: 'Loops',
        difficulty: 'Basic',
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /create exercise/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Test Task Title')
        ).toBeInTheDocument();
      });
    });

    it('should show loading state during generation', async () => {
      mockGenerate.mockImplementation(
        () =>
          new Promise(() => {
            // Deliberately unresolved so the loading state remains visible.
          })
      );

      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      await navigateCustomWizard(container, {
        language: 'Python',
        concept: 'Loops',
        difficulty: 'Basic',
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /create exercise/i,
        })
      );

      await waitFor(() => {
        const loadingOverlays =
          container.querySelectorAll('.loading-overlay');

        expect(loadingOverlays.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy solution to clipboard when clicked', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: mockGeneratedTask,
      });

      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      await navigateCustomWizard(container, {
        language: 'Python',
        concept: 'Loops',
        difficulty: 'Basic',
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /create exercise/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Test Task Title')
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByText('Reference Solution')
      );

      fireEvent.click(
        screen.getByRole('button', {
          name: /copy code/i,
        })
      );

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          mockGeneratedTask.solution
        );
      });
    });

    it('should copy tests to clipboard when clicked', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: mockGeneratedTask,
      });

      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      await navigateCustomWizard(container, {
        language: 'Python',
        concept: 'Loops',
        difficulty: 'Basic',
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /create exercise/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Test Task Title')
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByText('Unit Tests')
      );

      fireEvent.click(
        screen.getByRole('button', {
          name: /copy tests/i,
        })
      );

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          mockGeneratedTask.tests
        );
      });
    });
  });

  describe('Save Task', () => {
    it('should save task successfully', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: mockGeneratedTask,
      });

      mockCreate.mockResolvedValueOnce({
        data: {
          id: 123,
        },
      });

      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      await navigateCustomWizard(container, {
        language: 'Python',
        concept: 'Loops',
        difficulty: 'Basic',
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /create exercise/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Test Task Title')
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /save to history/i,
        })
      );

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: mockGeneratedTask.title,
            description: mockGeneratedTask.description,
            language: 'Python',
            concept: 'Loops',
            difficulty: 'Basic',
          })
        );
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', {
            name: /saved/i,
          })
        ).toBeInTheDocument();
      });
    });

    it('should show error when save fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockGenerate.mockResolvedValueOnce({
        data: mockGeneratedTask,
      });

      mockCreate.mockRejectedValueOnce({
        response: {
          status: 500,
        },
      });

      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      await navigateCustomWizard(container, {
        language: 'Python',
        concept: 'Loops',
        difficulty: 'Basic',
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /create exercise/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Test Task Title')
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /save to history/i,
        })
      );

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Failed to save task. Please try again.'
        );
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Export', () => {
    it('should export a saved task as a PDF file', async () => {
      mockGenerate.mockResolvedValueOnce({ data: mockGeneratedTask,});
      mockCreate.mockResolvedValueOnce({ data: {id: 123,},});
      const mockExportTaskPdf = jest.fn().mockResolvedValue({
        data: new Uint8Array([1, 2, 3]),
      });

      const mockClick = jest.fn();
      const mockCreateObjectURL = jest.fn(() => 'blob:test-url');
      const mockRevokeObjectURL = jest.fn();

      const originalCreateElement =
        document.createElement.bind(document);

      const createElementSpy = jest
        .spyOn(document, 'createElement')
        .mockImplementation((tag, options) => {
          const element = originalCreateElement(tag, options);

          if (String(tag).toLowerCase() === 'a') {
            element.click = mockClick;
          }

          return element;
        });

      Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        configurable: true,
        writable: true,
      });

      Object.defineProperty(URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        configurable: true,
        writable: true,
      });

      expect(mockExportTaskPdf).not.toHaveBeenCalled();

      try {
        const { container } = renderWithRouter(
          <GenerateTask
            task=""
            setTask={mockSetTask}
            onNavigate={mockOnNavigate}
          />
        );

        await navigateCustomWizard(container, {
          language: 'Python',
          concept: 'Loops',
          difficulty: 'Basic',
        });

        fireEvent.click(
          screen.getByRole('button', {name: /create exercise/i,})
        );

        await waitFor(() => {expect(screen.getByText('Test Task Title')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', {name: /save to history/i,})
        );

        await waitFor(() => {
          expect(mockCreate).toHaveBeenCalled();
        });

      } finally {createElementSpy.mockRestore();}
    });
  });

  describe('Language and Difficulty Display', () => {
    it('should display language icon for Python', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: mockGeneratedTask,});

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate}/>
      );

      await navigateCustomWizard(container, {language: 'Python', concept: 'Loops', difficulty: 'Basic',});

      fireEvent.click(screen.getByRole('button', {name: /create exercise/i,}));

      await waitFor(() => {
        expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      });

      expect(screen.getByText(/Python/i)).toBeInTheDocument();
    });

    it('should display language for Java', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: mockGeneratedTask,
      });

      const { container } = renderWithRouter(
        <GenerateTask task="" setTask={mockSetTask} onNavigate={mockOnNavigate}/>
      );

      await navigateCustomWizard(container, {
        language: 'Java',
        concept: 'Functions',
        difficulty: 'Intermediate',
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: /create exercise/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Test Task Title')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Java/i)
      ).toBeInTheDocument();
    });
  });

  describe('Template Mode', () => {
    it('should show templates when choosing From Template', async () => {
      const { container } = renderWithRouter(
        <GenerateTask
          task=""
          setTask={mockSetTask}
          onNavigate={mockOnNavigate}
        />
      );

      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalled();
      });

      const templateModeCards =
        container.querySelectorAll('.template-mode-card');

      expect(templateModeCards.length).toBeGreaterThanOrEqual(2);

      fireEvent.click(templateModeCards[0]);

      await waitForAnimation();

      await waitFor(() => {
        expect(
          screen.getByText('Pick a template')
        ).toBeInTheDocument();

        expect(
          screen.getByText('Template 1')
        ).toBeInTheDocument();

        expect(
          screen.getByText('Template 2')
        ).toBeInTheDocument();
      });
    });
  });
});