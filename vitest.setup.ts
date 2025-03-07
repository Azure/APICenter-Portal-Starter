const originalConsoleError = console.error;

console.error = (...args): void => {
  if (typeof args[0] !== 'string') {
    return;
  }

  // This is an annoying warning that is always thrown if state is changed in useEffect
  if (args[0].includes('was not wrapped in act(...)')) {
    return;
  }

  originalConsoleError(...args);
};

beforeEach(() => {
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined), // Mocking writeText
      },
      writable: true,
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
