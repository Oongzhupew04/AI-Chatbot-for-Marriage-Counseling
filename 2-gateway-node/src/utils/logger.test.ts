import { describe, it, expect } from '@jest/globals';
import logger from './logger';

describe('Logger Utility', () => {
    it('should be defined', () => {
        expect(logger).toBeDefined();
    });

    it('should have info and error methods', () => {
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
    });

    it('should have correct configuration', () => {
        expect(logger.level).toBe('info');
        expect(logger.transports.length).toBeGreaterThan(0);
    });
});
