import { ApiResponse } from '../http/ApiResponse';

export interface HttpExchange {
  readonly request: {
    readonly method: string;
    readonly url: string;
    readonly headers: Record<string, string>;
    readonly body?: string;
  };
  readonly response: ApiResponse;
}

/** Abstraction for publishing request/response evidence to a report. */
export interface IRequestReporter {
  report(exchange: HttpExchange): Promise<void>;
}
