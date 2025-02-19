export default class APIBase {
  abortController: AbortController;
  signal: AbortSignal;

  constructor() {
    // Create a controller to abort fetch requests.
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
  }

  abort() {
    // Abort the previously started requests.
    this.abortController.abort();

    // Now create a new controller for the next round of requests.
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
  }

  getCSRFToken(): string {
    const root = document.getElementById('root');
    return root?.dataset.csrfToken ?? '';
  }

  getFullURL(url: string): URL {
    return new URL(url, window.location.origin);
  }

  toCamelCase: (s: string) => string = (s: string) => {
    return s.replace(/([-_][a-z])/gi, ($1) => {
      return $1.toUpperCase().replace('-', '').replace('_', '');
    });
  };

  isObject: (obj: any) => boolean = function (obj: any) {
    return (
      obj === Object(obj) && !Array.isArray(obj) && typeof obj !== 'function'
    );
  };

  async fetch(
    url: string,
    method: string,
    payload: URLSearchParams | FormData | null,
    headers: Headers,
  ): Promise<any> {
    const fullUrl = this.getFullURL(url);

    const requestParams = {
      method: method,
      credentials: 'same-origin' as RequestCredentials,
      headers: headers,
      // This signal is used to cancel requests with the `abort()` method.
      signal: this.signal,
      body: payload,
    };

    if (payload !== null && method === 'GET') {
      requestParams.body = null;
      fullUrl.search = payload.toString();
    }

    let response;
    try {
      response = await fetch(fullUrl.toString(), requestParams);
    } catch (e) {
      // Swallow Abort errors because we trigger them ourselves.
      if (e instanceof Error && e.name === 'AbortError') {
        return {};
      }
      throw e;
    }

    try {
      return await response.json();
    } catch (e) {
      // Catch non-JSON responses
      /* eslint-disable no-console */
      console.error('The response content is not JSON-compatible');
      console.error(`URL: ${url} - Method: ${method}`);
      console.error(e);

      return {};
    }
  }

  keysToCamelCase(results: any): any {
    if (this.isObject(results)) {
      const newObj: any = {};

      Object.keys(results).forEach((key) => {
        newObj[this.toCamelCase(key)] = this.keysToCamelCase(results[key]);
      });

      return newObj;
    } else if (Array.isArray(results)) {
      return results.map((i) => {
        return this.keysToCamelCase(i);
      });
    }

    return results;
  }
}
