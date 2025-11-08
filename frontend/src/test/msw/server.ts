// Some bundlers with ESM can have resolution quirks; keep import simple.
// Use the mapped CommonJS version via jest.config moduleNameMapper
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
