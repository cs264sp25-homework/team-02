const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
    debug: (message: string, data?: unknown) => {
      if (isDevelopment) {
        console.debug(`[DEBUG] ${message}`, data);
      }
    },
    info:(message: string, data?: unknown) => {
        if(isDevelopment) {
            console.info(`[INFO] ${message}`, data)
        }
    },
    warn: (message: string, data?: unknown) => {
      // Warnings might be useful in production too
      console.warn(`[WARN] ${message}`, isDevelopment ? data : '');
    },
    error: (message: string, data?: unknown) => {
      // Errors should always be logged, but with sensitive data only in development
      console.error(`[ERROR] ${message}`, isDevelopment ? data : '');
    }
  };


