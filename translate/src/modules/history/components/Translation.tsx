import { Localized } from '@fluent/react';
import classNames from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import ReactTimeAgo from 'react-time-ago';
import { Locale } from '~/context/locale';

import type { Entity } from '~/core/api';
import { CommentsList } from '~/core/comments';
import { TranslationProxy } from '~/core/translation';
import { UserAvatar, UserState } from '~/core/user';
import { withActionsDisabled } from '~/core/utils';
import { useTranslator } from '~/hooks/useTranslator';

import type { ChangeOperation, HistoryTranslation } from '../index';

import './Translation.css';

type Props = {
  entity: Entity;
  isReadOnlyEditor: boolean;
  translation: HistoryTranslation;
  activeTranslation: HistoryTranslation;
  user: UserState;
  index: number;
  deleteTranslation: (id: number) => void;
  addComment: (comment: string, id: number | null | undefined) => void;
  updateEditorTranslation: (arg0: string, arg1: string) => void;
  updateTranslationStatus: (id: number, operation: ChangeOperation) => void;
};

type InternalProps = Props & {
  isActionDisabled: boolean;
  disableAction: () => void;
};

function CommentToggle({
  count,
  toggleVisible,
  visible,
}: {
  count: number;
  toggleVisible: () => void;
  visible: boolean;
}) {
  const toggleComments = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    toggleVisible();
  };

  const className = 'toggle comments ' + (visible ? 'on' : 'off');
  const title = 'Toggle translation comments';

  if (count === 0) {
    return (
      <Localized
        id='history-Translation--button-comment'
        attrs={{ title: true }}
      >
        <button className={className} title={title} onClick={toggleComments}>
          {'COMMENT'}
        </button>
      </Localized>
    );
  }

  return (
    <Localized
      id='history-Translation--button-comments'
      attrs={{ title: true }}
      elems={{ stress: <span className='stress' /> }}
      vars={{ commentCount: count }}
    >
      <button
        className={className + ' active'}
        title={title}
        onClick={toggleComments}
      >
        {'<stress>{ $commentCount }</stress> COMMENTS'}
      </button>
    </Localized>
  );
}

function DiffToggle({
  index,
  toggleVisible,
  visible,
}: {
  index: number;
  toggleVisible: () => void;
  visible: boolean;
}) {
  if (index === 0) return null;
  return (
    <Localized id='history-Translation--toggle-diff' attrs={{ title: true }}>
      <button
        className={'toggle diff ' + (visible ? 'on' : 'off')}
        title='Toggle diff against the currently active translation'
        onClick={(ev) => {
          ev.stopPropagation();
          toggleVisible();
        }}
      >
        DIFF
      </button>
    </Localized>
  );
}

const User = ({
  title,
  translation: { uid, user, username },
}: {
  title: string;
  translation: HistoryTranslation;
}) =>
  uid ? (
    <a
      href={`/contributors/${username}`}
      title={title}
      target='_blank'
      rel='noopener noreferrer'
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      {user}
    </a>
  ) : (
    <span>{user}</span>
  );

/**
 * Render a translation in the History tab.
 *
 * Shows the translation's status, date, author and reviewer, as well as
 * the content of the translation.
 *
 * The status can be interact with if the user has sufficient permissions to
 * change said status.
 */
export function TranslationBase({
  activeTranslation,
  addComment,
  deleteTranslation,
  disableAction,
  entity,
  index,
  isActionDisabled,
  isReadOnlyEditor,
  translation,
  updateEditorTranslation,
  updateTranslationStatus,
  user,
}: InternalProps): React.ReactElement<'li'> {
  const [isDiffVisible, setDiffVisible] = useState(false);
  const [areCommentsVisible, setCommentsVisible] = useState(false);
  const isTranslator = useTranslator();
  const { code, direction, script } = useContext(Locale);

  const handleStatusChange = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isActionDisabled) return;

      disableAction();
      event.stopPropagation();
      const action = event.currentTarget.name as ChangeOperation;
      updateTranslationStatus(translation.pk, action);
    },
    [disableAction, isActionDisabled, translation.pk, updateTranslationStatus],
  );

  const delete_ = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isActionDisabled) return;

      disableAction();
      event.stopPropagation();
      deleteTranslation(translation.pk);
    },
    [deleteTranslation, disableAction, isActionDisabled, translation.pk],
  );

  const copyTranslationIntoEditor = useCallback(() => {
    // Ignore if selecting text
    if (isReadOnlyEditor || window.getSelection()?.toString()) return;
    updateEditorTranslation(translation.string, 'history');
  }, [isReadOnlyEditor, translation.string, updateEditorTranslation]);

  // TODO: To Localize.
  const approvalTitle =
    translation.approved && translation.approvedUser
      ? `Approved by ${translation.approvedUser}`
      : translation.unapprovedUser
      ? `Unapproved by ${translation.unapprovedUser}`
      : 'Not reviewed yet';

  const commentCount = translation.comments.length;

  // Does the currently logged in user own this translation?
  const ownTranslation =
    user.username && user.username === translation.username;

  let canDelete = (isTranslator || ownTranslation) && !isReadOnlyEditor;
  let canReject =
    (isTranslator || (ownTranslation && !translation.approved)) &&
    !isReadOnlyEditor;
  let canComment = user.isAuthenticated;

  const className = classNames(
    'translation',
    translation.approved
      ? 'approved'
      : translation.fuzzy
      ? 'fuzzy'
      : translation.rejected
      ? 'rejected'
      : 'unreviewed',
    isReadOnlyEditor
      ? 'cannot-copy'
      : { 'can-approve': isTranslator, 'can-reject': canReject },
  );

  return (
    <li className='wrapper'>
      <Localized id='history-Translation--copy' attrs={{ title: true }}>
        <div
          className={className}
          title='Copy Into Translation'
          onClick={copyTranslationIntoEditor}
        >
          <div className='avatar-container'>
            <UserAvatar
              username={translation.username}
              title={approvalTitle}
              imageUrl={translation.userGravatarUrlSmall}
            />
            {translation.machinerySources ? (
              <Localized
                id='history-Translation--span-copied'
                attrs={{ title: true }}
                vars={{
                  machinerySources: translation.machinerySources,
                }}
              >
                <span
                  className='fa machinery-sources'
                  title={'Copied ({ $machinerySources })'}
                ></span>
              </Localized>
            ) : null}
          </div>
          <div className='content'>
            <header className='clearfix'>
              <div className='info'>
                <User title={approvalTitle} translation={translation} />
                <ReactTimeAgo
                  dir='ltr'
                  date={new Date(translation.dateIso)}
                  title={`${translation.date} UTC`}
                />
              </div>
              <menu className='toolbar'>
                <DiffToggle
                  index={index}
                  toggleVisible={() => setDiffVisible((prev) => !prev)}
                  visible={isDiffVisible}
                />

                {canComment || commentCount > 0 ? (
                  <CommentToggle
                    count={commentCount}
                    toggleVisible={() => setCommentsVisible((prev) => !prev)}
                    visible={areCommentsVisible}
                  />
                ) : null}

                {translation.rejected && canDelete ? (
                  // Delete Button
                  <Localized
                    id='history-Translation--button-delete'
                    attrs={{ title: true }}
                  >
                    <button
                      className='delete far'
                      title='Delete'
                      onClick={delete_}
                      disabled={isActionDisabled}
                    />
                  </Localized>
                ) : null}
                {translation.approved ? (
                  // Unapprove Button
                  isTranslator && !isReadOnlyEditor ? (
                    <Localized
                      id='history-Translation--button-unapprove'
                      attrs={{ title: true }}
                    >
                      <button
                        className='unapprove fa'
                        title='Unapprove'
                        name='unapprove'
                        onClick={handleStatusChange}
                        disabled={isActionDisabled}
                      />
                    </Localized>
                  ) : (
                    <Localized
                      id='history-Translation--button-approved'
                      attrs={{ title: true }}
                    >
                      <button
                        className='unapprove fa'
                        title='Approved'
                        disabled
                      />
                    </Localized>
                  )
                ) : isTranslator && !isReadOnlyEditor ? (
                  // Approve Button
                  <Localized
                    id='history-Translation--button-approve'
                    attrs={{ title: true }}
                  >
                    <button
                      className='approve fa'
                      title='Approve'
                      name='approve'
                      onClick={handleStatusChange}
                      disabled={isActionDisabled}
                    />
                  </Localized>
                ) : (
                  <Localized
                    id='history-Translation--button-not-approved'
                    attrs={{ title: true }}
                  >
                    <button
                      className='approve fa'
                      title='Not approved'
                      disabled
                    />
                  </Localized>
                )}
                {translation.rejected ? (
                  // Unreject Button
                  canReject ? (
                    <Localized
                      id='history-Translation--button-unreject'
                      attrs={{ title: true }}
                    >
                      <button
                        className='unreject fa'
                        title='Unreject'
                        name='unreject'
                        onClick={handleStatusChange}
                        disabled={isActionDisabled}
                      />
                    </Localized>
                  ) : (
                    <Localized
                      id='history-Translation--button-rejected'
                      attrs={{ title: true }}
                    >
                      <button
                        className='unreject fa'
                        title='Rejected'
                        disabled
                      />
                    </Localized>
                  )
                ) : canReject ? (
                  // Reject Button
                  <Localized
                    id='history-Translation--button-reject'
                    attrs={{ title: true }}
                  >
                    <button
                      className='reject fa'
                      title='Reject'
                      name='reject'
                      onClick={handleStatusChange}
                      disabled={isActionDisabled}
                    />
                  </Localized>
                ) : (
                  <Localized
                    id='history-Translation--button-not-rejected'
                    attrs={{ title: true }}
                  >
                    <button
                      className='reject fa'
                      title='Not rejected'
                      disabled
                    />
                  </Localized>
                )}
              </menu>
            </header>
            <p
              className={isDiffVisible ? 'diff-visible' : 'default'}
              dir={direction}
              lang={code}
              data-script={script}
            >
              <TranslationProxy
                content={translation.string}
                diffTarget={isDiffVisible ? activeTranslation.string : null}
                format={entity.format}
              />
            </p>
          </div>
        </div>
      </Localized>
      {areCommentsVisible && (
        <CommentsList
          comments={translation.comments}
          translation={translation}
          user={user}
          canComment={canComment}
          addComment={addComment}
        />
      )}
    </li>
  );
}

export default withActionsDisabled(TranslationBase);
