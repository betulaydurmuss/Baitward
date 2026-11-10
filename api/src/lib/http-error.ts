// A typed application error the error middleware turns into a clean JSON response.
// Throwing these keeps route handlers readable: no manual res.status(...).json(...)
// scattered around.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Same wording for a wrong password and an unknown email, so the response never
// reveals whether an address is registered.
export const INVALID_CREDENTIALS = new AppError(
  401,
  'invalid_credentials',
  'Invalid email or password',
);
