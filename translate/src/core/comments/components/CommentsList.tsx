import * as React from 'react';
import { Localized } from '@fluent/react';

import './CommentsList.css';

import { Comment, AddComment } from '~/core/comments';

import type { NavigationParams } from '~/core/navigation';
import type { TranslationComment } from '~/core/api';
import type { UserState } from '~/core/user';
import type { HistoryTranslation } from '~/modules/history';

type Props = {
  comments: Array<TranslationComment>;
  parameters?: NavigationParams;
  translation?: HistoryTranslation;
  user: UserState;
  contactPerson?: string;
  canComment: boolean;
  canPin?: boolean;
  addComment: (arg0: string, arg1: number | null | undefined) => void;
  togglePinnedStatus?: (arg0: boolean, arg1: number) => void;
  resetContactPerson?: () => void;
};

export default function CommentsList(props: Props): React.ReactElement<'div'> {
  const {
    comments,
    parameters,
    translation,
    user,
    canComment,
    canPin,
    addComment,
    togglePinnedStatus,
    contactPerson,
    resetContactPerson,
  } = props;

  const translationId = translation ? translation.pk : null;

  // rendering comment
  const renderComment = (comment: TranslationComment) => {
    return (
      <Comment
        comment={comment}
        canPin={canPin}
        key={comment.id}
        togglePinnedStatus={togglePinnedStatus}
      />
    );
  };

  const pinnedComments = comments.filter((comment) => comment.pinned);
  const unpinnedComments = comments.filter((comment) => !comment.pinned);
  const hideAllComments =
    !canComment && unpinnedComments.length === 0 && pinnedComments.length;

  return (
    <div className='comments-list'>
      {pinnedComments.length ? (
        <section className='pinned-comments'>
          <Localized id='comments-CommentsList--pinned-comments'>
            <h2 className='title'>PINNED COMMENTS</h2>
          </Localized>

          <ul>{pinnedComments.map((comment) => renderComment(comment))}</ul>
          {!hideAllComments ? (
            <Localized id='comments-CommentsList--all-comments'>
              <h2 className='title'>ALL COMMENTS</h2>
            </Localized>
          ) : null}
        </section>
      ) : null}
      <section className='all-comments'>
        <ul>{unpinnedComments.map((comment) => renderComment(comment))}</ul>
        {!canComment ? null : (
          <AddComment
            parameters={parameters}
            translation={translationId}
            user={user}
            addComment={addComment}
            contactPerson={contactPerson}
            resetContactPerson={resetContactPerson}
          />
        )}
      </section>
    </div>
  );
}
