import * as allure from 'allure-js-commons';
import { HttpExchange, IRequestReporter } from './IRequestReporter';

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie'];

/** Attaches every HTTP exchange to the Allure report as a step with request/response attachments. */
export class AllureRequestReporter implements IRequestReporter {
  async report({ request, response }: HttpExchange): Promise<void> {
    const url = new URL(request.url);
    const title = `${request.method} ${url.pathname}${url.search} → ${response.status} (${response.durationMs} ms)`;

    await allure.step(title, async () => {
      await allure.attachment(
        'Request',
        this.format({
          method: request.method,
          url: request.url,
          headers: this.mask(request.headers),
          body: this.tryParse(request.body),
        }),
        allure.ContentType.JSON,
      );
      await allure.attachment(
        'Response',
        this.format({ status: response.status, headers: response.headers, body: response.body ?? null }),
        allure.ContentType.JSON,
      );
      await allure.attachment('cURL', this.toCurl(request), allure.ContentType.TEXT);
    });
  }

  private mask(headers: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k, SENSITIVE_HEADERS.includes(k.toLowerCase()) ? '***' : v]),
    );
  }

  private toCurl(request: HttpExchange['request']): string {
    const headers = Object.entries(this.mask(request.headers))
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(' ');
    const body = request.body !== undefined ? ` --data ${JSON.stringify(request.body)}` : '';
    return `curl -X ${request.method} "${request.url}" ${headers}${body}`;
  }

  private tryParse(body?: string): unknown {
    if (body === undefined) return null;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  private format(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
