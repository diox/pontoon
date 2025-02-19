import APIBase from './base';

export default class CommentAPI extends APIBase {
  add(
    entity: number,
    locale: string,
    comment: string,
    translation: number | null | undefined,
  ): Promise<any> {
    const payload = new URLSearchParams();
    payload.append('entity', entity.toString());
    payload.append('locale', locale);
    payload.append('comment', comment);
    if (translation) {
      payload.append('translation', translation.toString());
    }

    const headers = new Headers();
    const csrfToken = this.getCSRFToken();
    headers.append('X-Requested-With', 'XMLHttpRequest');
    headers.append('X-CSRFToken', csrfToken);

    return this.fetch('/add-comment/', 'POST', payload, headers);
  }

  _updateComment(url: string, commentId: number): Promise<any> {
    const payload = new URLSearchParams();
    payload.append('comment_id', commentId.toString());

    const headers = new Headers();
    const csrfToken = this.getCSRFToken();
    headers.append('X-Requested-With', 'XMLHttpRequest');
    headers.append('X-CSRFToken', csrfToken);

    return this.fetch(url, 'POST', payload, headers);
  }

  pinComment(commentId: number): Promise<any> {
    return this._updateComment('/pin-comment/', commentId);
  }

  unpinComment(commentId: number): Promise<any> {
    return this._updateComment('/unpin-comment/', commentId);
  }
}
