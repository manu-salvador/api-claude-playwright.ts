import { IAuthProvider } from './IAuthProvider';

/** Sends requests anonymously (used for public GETs and 401 scenarios). */
export class NoAuthProvider implements IAuthProvider {
  getHeaders(): Record<string, string> {
    return {};
  }
}
