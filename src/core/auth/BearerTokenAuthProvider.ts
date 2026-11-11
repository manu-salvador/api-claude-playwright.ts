import { IAuthProvider } from './IAuthProvider';

export class BearerTokenAuthProvider implements IAuthProvider {
  constructor(private readonly token: string) {}

  getHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.token}` };
  }
}
