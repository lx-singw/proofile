require('@testing-library/jest-dom');
require('whatwg-fetch');
const { TextEncoder, TextDecoder } = require('util');
const { TransformStream, WritableStream, ReadableStream } = require('node:stream/web');

if (typeof global.TextEncoder === 'undefined') {
  // Polyfill TextEncoder/Decoder for Node test environment
  global.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  // @ts-expect-error - jsdom types don't include TextDecoder on global
  global.TextDecoder = TextDecoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  // @ts-expect-error - jsdom types don't include TextDecoder on globalThis
  globalThis.TextDecoder = TextDecoder;
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream;
}

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = TransformStream;
}

if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = WritableStream;
}

if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = WritableStream;
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream;
}

if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream;
}

if (typeof global.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    constructor() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    postMessage() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addEventListener() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeEventListener() {}
  }
  global.BroadcastChannel = MockBroadcastChannel;
  globalThis.BroadcastChannel = MockBroadcastChannel;
}

require('./src/test/mocks/nextNavigation');
const { server } = require('./src/test/msw/server');

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

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