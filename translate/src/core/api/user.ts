import type { Settings } from '../user';
import APIBase from './base';

const SETTINGS_NAMES_MAP = {
  runQualityChecks: 'quality_checks',
  forceSuggestions: 'force_suggestions',
};

export default class UserAPI extends APIBase {
  /**
   * Return data about the current user from the server.
   */
  async get(): Promise<any> {
    const headers = new Headers();
    headers.append('X-Requested-With', 'XMLHttpRequest');

    return await this.fetch('/user-data/', 'GET', null, headers);
  }

  /**
   * Get all users from server.
   */
  async getUsers(): Promise<any> {
    const headers = new Headers();
    headers.append('X-Requested-With', `XMLHttpRequest`);

    return await this.fetch('get-users', 'GET', null, headers);
  }

  /**
   * Mark all notifications of the current user as read.
   */
  async markAllNotificationsAsRead(): Promise<any> {
    const headers = new Headers();
    headers.append('X-Requested-With', 'XMLHttpRequest');

    return await this.fetch(
      '/notifications/mark-all-as-read/',
      'GET',
      null,
      headers,
    );
  }

  /**
   * Sign out the current user.
   */
  async signOut(url: string): Promise<any> {
    const csrfToken = this.getCSRFToken();

    const payload = new URLSearchParams();
    payload.append('csrfmiddlewaretoken', csrfToken);

    const headers = new Headers();

    return await this.fetch(url, 'POST', payload, headers);
  }

  async updateSetting(
    username: string,
    setting: keyof Settings,
    value: boolean,
  ): Promise<string> {
    const csrfToken = this.getCSRFToken();

    const payload = new URLSearchParams();
    payload.append('attribute', SETTINGS_NAMES_MAP[setting]);
    payload.append('value', value.toString());
    payload.append('csrfmiddlewaretoken', csrfToken);

    const headers = new Headers();
    headers.append('X-Requested-With', 'XMLHttpRequest');
    headers.append('X-CSRFToken', csrfToken);

    return (await this.fetch(
      `/api/v1/user/${username}/`,
      'POST',
      payload,
      headers,
    )) as string;
  }

  /**
   * Update Interactive Tour status to a given step.
   */
  async updateTourStatus(step: number): Promise<any> {
    const csrfToken = this.getCSRFToken();

    const payload = new URLSearchParams();
    payload.append('tour_status', step.toString());
    payload.append('csrfmiddlewaretoken', csrfToken);

    const headers = new Headers();
    headers.append('X-Requested-With', 'XMLHttpRequest');
    headers.append('X-CSRFToken', csrfToken);

    return await this.fetch('/update-tour-status/', 'POST', payload, headers);
  }

  /**
   * Dismiss Add-On Promotion.
   */
  dismissAddonPromotion(): Promise<any> {
    const headers = new Headers();
    headers.append('X-Requested-With', 'XMLHttpRequest');

    return this.fetch('/dismiss-addon-promotion/', 'GET', null, headers);
  }
}
