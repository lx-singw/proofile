/// <reference types="jest" />
import '@testing-library/jest-dom';
import 'whatwg-fetch';
import './src/test/mocks/nextNavigation';

// Silence or mock window.location navigation methods that jsdom doesn't implement
const realLocation = window.location;
const realConsoleError = console.error;

beforeAll(() => {
	try {
		// Redefine location to be writable and mock assign/replace/reload
		// Keep other properties from the real location to avoid breaking code that reads them
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
		// Fallback for environments that don't allow redefining location
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).location.assign = jest.fn();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).location.replace = jest.fn();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).location.reload = jest.fn();
	}

	// Filter noisy jsdom navigation errors while keeping other errors visible
	jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
		const first = args[0];
		if (typeof first === 'string' && first.includes('Not implemented: navigation')) {
			return;
		}
		return realConsoleError(...args);
	});

	// Mock URL.createObjectURL for avatar/file previews in tests
	if (!('createObjectURL' in URL)) {
		// @ts-expect-error jsdom missing createObjectURL
		URL.createObjectURL = jest.fn(() => 'blob:mock');
	}
});

afterAll(() => {
	// Restore console.error
	(console.error as jest.Mock).mockRestore?.();
	// Restore original location if possible
	try {
		Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
	} catch (e) {
		// ignore
	}
});
