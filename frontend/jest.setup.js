import '@testing-library/jest-dom';
import 'whatwg-fetch';
import './src/test/mocks/nextNavigation';

// Silence or mock window.location navigation methods that jsdom doesn't implement
const realLocation = window.location;
const realConsoleError = console.error;

beforeAll(() => {
  try {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...realLocation,
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
      },
    });
  } catch (e) {
    window.location.assign = jest.fn();
    window.location.replace = jest.fn();
    window.location.reload = jest.fn();
  }

  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes('Not implemented: navigation')) {
      return;
    }
    return realConsoleError(...args);
  });

  if (!('createObjectURL' in URL)) {
    URL.createObjectURL = jest.fn(() => 'blob:mock');
  }
});

afterAll(() => {
  if (console.error.mockRestore) console.error.mockRestore();
  try {
    Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
  } catch (e) {
    // ignore
  }
});