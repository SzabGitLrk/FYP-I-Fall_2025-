import 'express';

declare module 'express' {
  interface Request {
    language?: string;
  }
}
