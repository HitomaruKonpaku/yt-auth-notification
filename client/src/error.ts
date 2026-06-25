type ErrorHandler = (key: string, title: string, message: string) => void;

let handler: ErrorHandler | null = null;

export function setErrorHandler(fn: ErrorHandler): void {
  handler = fn;
}

export function notifyApiError(
  method: string,
  path: string,
  message: string,
): void {
  handler?.(`${method}:${path}`, `API Error`, `${method} ${path}: ${message}`);
}
