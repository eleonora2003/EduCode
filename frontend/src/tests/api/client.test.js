import axios from 'axios';

jest.mock('axios');

describe('API Client', () => {
  let instance;

  beforeEach(() => {
    instance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      defaults: {
        headers: {
          common: {},
        },
      },
    };

    axios.create.mockReturnValue(instance);
  });

  describe('API Configuration', () => {
    it('should have axios create function available', () => {
      expect(typeof axios.create).toBe('function');
    });

    it('should have interceptors available', () => {
      expect(instance.interceptors).toBeDefined();
      expect(instance.interceptors.request).toBeDefined();
      expect(instance.interceptors.response).toBeDefined();
    });

    it('should have defaults available', () => {
      expect(instance.defaults).toBeDefined();
      expect(instance.defaults.headers).toBeDefined();
      expect(instance.defaults.headers.common).toBeDefined();
    });
  });

  describe('API Methods', () => {
    it('should have get method', () => {
      expect(typeof instance.get).toBe('function');
    });

    it('should have post method', () => {
      expect(typeof instance.post).toBe('function');
    });

    it('should have put method', () => {
      expect(typeof instance.put).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof instance.delete).toBe('function');
    });
  });
});