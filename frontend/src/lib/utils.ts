
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) return String(error.message);
    if ('error' in error) return String(error.error);
  }
  return 'An unexpected error occurred';
}

