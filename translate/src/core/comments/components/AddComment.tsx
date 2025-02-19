import * as React from 'react';
import ReactDOM from 'react-dom';
import { Localized } from '@fluent/react';
import {
  BaseEditor,
  Editor,
  Element as SlateElement,
  Transforms,
  Range,
  createEditor,
  Text,
  Node,
} from 'slate';
import type { Descendant } from 'slate';
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  Slate,
  withReact,
} from 'slate-react';
import escapeHtml from 'escape-html';

import './AddComment.css';

import { UserAvatar } from '~/core/user';

import type { NavigationParams } from '~/core/navigation';
import type { UserState } from '~/core/user';
import type { UsersList } from '~/core/api';

type Props = {
  parameters: NavigationParams | null | undefined;
  translation?: number | null | undefined;
  user: UserState;
  contactPerson?: string;
  addComment: (arg0: string, arg1: number | null | undefined) => void;
  resetContactPerson?: () => void;
};

type Paragraph = {
  type: 'paragraph';
  children: Descendant[];
};

type Mention = {
  type: 'mention';
  character: string;
  url: string;
  children: Text[];
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: Paragraph | Mention;
  }
}

export default function AddComment(props: Props): React.ReactElement<'div'> {
  const {
    parameters,
    translation,
    user,
    contactPerson,
    addComment,
    resetContactPerson,
  } = props;

  const mentionList: any = React.useRef();
  const [target, setTarget] = React.useState<Range | null>(null);
  const [index, setIndex] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const editor = React.useMemo(
    () => withMentions(withReact(createEditor())),
    [],
  );
  const initialValue = [
    { type: 'paragraph', children: [{ text: '' }] } as Paragraph,
  ];
  const [value, setValue] = React.useState<Descendant[]>(initialValue);
  const users = user.users;
  const placeFocus = React.useCallback(() => {
    ReactEditor.focus(editor);
    Transforms.select(editor, Editor.end(editor, []));
  }, [editor]);

  // Insert project manager as mention when 'Request context / Report issue' button used
  // and then clear the value from state
  React.useEffect(() => {
    // check to see if contact person is already mentioned
    const [isMentioned] = Editor.nodes(editor, {
      at: [],
      match: (n) =>
        SlateElement.isElement(n) &&
        n.type == 'mention' &&
        n.character === contactPerson,
    });

    if (contactPerson) {
      if (!isMentioned) {
        insertMention(editor, contactPerson, users);
      }

      if (resetContactPerson) {
        resetContactPerson();
        placeFocus();
      }
    }
  }, [editor, contactPerson, users, resetContactPerson, placeFocus]);

  // Set focus on Editor
  React.useEffect(() => {
    if (!parameters || parameters.project !== 'terminology') {
      placeFocus();
    }
  }, [parameters, placeFocus]);

  const userNames = users.map((user) => user.name);
  const suggestedUsers = userNames
    .filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);

  // Set position of mentions suggestions
  React.useLayoutEffect(() => {
    if (!target || suggestedUsers.length <= 0) {
      return;
    }
    // get suggestions element and gain access to its measurements
    const el = mentionList.current;
    const domRange = ReactEditor.toDOMRange(editor, target);
    const rect = domRange.getBoundingClientRect();

    // get team comments element, gain access to its measurements, and verify
    // if it is active
    const teamCommentsEl = document.querySelector('.top');
    const teamCommentsRect = !teamCommentsEl
      ? null
      : teamCommentsEl.getBoundingClientRect();
    const teamCommentsActive = !teamCommentsEl
      ? false
      : teamCommentsEl.contains(document.activeElement);

    // get translation comments element, gain access to its measurements, and verify
    // if it is active
    const translateCommentsEl = document.querySelector('.history');
    const translateCommentsRect = !translateCommentsEl
      ? null
      : translateCommentsEl.getBoundingClientRect();
    const translateCommentsActive = !translateCommentsEl
      ? false
      : translateCommentsEl.contains(document.activeElement);

    // get editor menu element and find its height to determine when comment editor goes above
    // the editor menu in order to hide suggestions element
    const editorMenu = document.querySelector('.editor-menu');
    const editorMenuHeight = !editorMenu ? 0 : editorMenu.clientHeight;

    // get tab index element and find its height to use when determining if suggestions
    // element overflows the team comments container
    const tabIndex = document.querySelector('.react-tabs__tab-list');
    const tabIndexHeight = !tabIndex ? 0 : tabIndex.clientHeight;

    // get comment editor element and find measurements of values needed to adjust
    // the suggestions element to the correct position
    const commentEditor = document.querySelector(
      '.comments-list .add-comment .comment-editor',
    );
    const commentEditorLineHeight =
      (commentEditor &&
        parseInt(window.getComputedStyle(commentEditor).lineHeight)) ||
      0;
    const commentEditorTopPadding =
      (commentEditor &&
        parseInt(window.getComputedStyle(commentEditor).paddingTop)) ||
      0;
    const commentEditorBottomPadding =
      (commentEditor &&
        parseInt(window.getComputedStyle(commentEditor).paddingBottom)) ||
      0;
    const commentEditorSpan = document.querySelector(
      '.comments-list .add-comment .comment-editor p span',
    );
    const commentEditorSpanHeight = !(commentEditorSpan instanceof HTMLElement)
      ? 0
      : commentEditorSpan.offsetHeight;

    // add value of comment editor bottom padding and span height to properly position suggestions element
    const setTopAdjustment =
      commentEditorBottomPadding + commentEditorSpanHeight;

    // add value of comment editor top padding and difference between line height and span height
    // of the top half of the comment editor to correctly size the height of the suggestions
    const suggestionsHeightAdjustment =
      commentEditorTopPadding +
      (commentEditorLineHeight - commentEditorSpanHeight) / 2;

    let setTop = rect.top + window.pageYOffset + setTopAdjustment;
    let setLeft = rect.left + window.pageXOffset;

    // If suggestions overflow the window or teams container height then adjust the
    // position so they display above the comment
    const suggestionsHeight = el.clientHeight + suggestionsHeightAdjustment;
    const teamCommentsOverflow = !teamCommentsRect
      ? false
      : setTop + el.clientHeight - tabIndexHeight > teamCommentsRect.height;

    if (
      (teamCommentsActive && teamCommentsOverflow) ||
      setTop + suggestionsHeight > window.innerHeight
    ) {
      setTop = rect.top + window.pageYOffset - suggestionsHeight;
    }

    // If suggestions in team comments scroll below or suggestions in translation
    // comments scroll above the next section or overflow the window then hide the suggestions
    if (
      (teamCommentsRect &&
        teamCommentsActive &&
        setTop + suggestionsHeight - editorMenuHeight >
          teamCommentsRect.height) ||
      (translateCommentsRect &&
        translateCommentsActive &&
        rect.top < translateCommentsRect.top) ||
      (translateCommentsRect &&
        translateCommentsActive &&
        setTop + suggestionsHeight > window.innerHeight)
    ) {
      el.style.display = 'none';
    }

    // If suggestions overflow the window width in team comments or the right side of the
    // translations comments then adjust the position so they display to the left of the mention
    const suggestionsWidth = el.clientWidth;
    const translateCommentsOverflow = !translateCommentsRect
      ? false
      : setLeft + suggestionsWidth > translateCommentsRect.right;

    if (
      setLeft + suggestionsWidth > window.innerWidth ||
      (translateCommentsActive && translateCommentsOverflow)
    ) {
      setLeft = rect.right - suggestionsWidth;
    }

    el.style.top = `${setTop}px`;
    el.style.left = `${setLeft}px`;
  }, [suggestedUsers.length, editor, index, search, target, scrollPosition]);

  // Set scroll position values for Translation and Team Comment containers ~
  // This allows for the mention suggestions to stay properly positioned
  // when the container scrolls.
  React.useEffect(() => {
    const handleScroll = (e: Event) => {
      const element: HTMLElement = e.currentTarget as any;
      setScrollPosition(element.scrollTop);
    };

    const historyScroll = document.querySelector('#history-list');
    const teamsScroll = document.querySelector('#react-tabs-3');

    if (!historyScroll && !teamsScroll) {
      return;
    }

    if (historyScroll) {
      historyScroll.addEventListener('scroll', handleScroll);
    }
    if (teamsScroll) {
      teamsScroll.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (historyScroll) {
        historyScroll.removeEventListener('scroll', handleScroll);
      }
      if (teamsScroll) {
        teamsScroll.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleMentionsKeyDown = (event: React.KeyboardEvent) => {
    if (!target) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const prevIndex = index >= suggestedUsers.length - 1 ? 0 : index + 1;
        setIndex(prevIndex);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const nextIndex = index <= 0 ? suggestedUsers.length - 1 : index - 1;
        setIndex(nextIndex);
        break;
      }
      case 'Tab':
      case 'Enter':
        event.preventDefault();
        Transforms.select(editor, target);
        insertMention(editor, suggestedUsers[index], users);
        setTarget(null);
        placeFocus();
        break;
      case 'Escape':
        event.preventDefault();
        setTarget(null);
        break;
      default:
        return;
    }
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitComment();
    }
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      /*
       * This allows for the new lines to render while adding comments.
       * To avoid an issue with the cursor placement and an error when
       * navigating with arrows that occurs in Firefox '\n' can't be
       * the last character so the BOM was added
       */
      editor.insertText('\n\uFEFF');
      return;
    }
  };

  const handleMentionsMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (target !== null) {
      const suggestedUserIndex = suggestedUsers.indexOf(
        event.currentTarget.innerText,
      );
      Transforms.select(editor, target);
      insertMention(editor, suggestedUsers[suggestedUserIndex], users);
      return setTarget(null);
    }
  };

  const getUserGravatar = React.useCallback(
    (name: string) => {
      const user = users.find((user) => user.name === name);
      if (!user) {
        return;
      }
      return user.gravatar;
    },
    [users],
  );

  const handleEditorOnChange = (value: Node[]) => {
    setValue(value);
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const wordBefore = Editor.before(editor, start, { unit: 'word' });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      // Unicode property escapes allow for matching non-ASCII characters
      const beforeMatch =
        beforeText && beforeText.match(/^@((\p{L}|\p{N}|\p{P})+)$/u);
      const after = Editor.after(editor, start);
      const afterRange = Editor.range(editor, start, after);
      const afterText = Editor.string(editor, afterRange);
      const afterMatch = afterText.match(/^(\s|$)/);

      if (beforeMatch && afterMatch) {
        setTarget(beforeRange);
        setSearch(beforeMatch[1]);
        setIndex(0);
        return;
      }
    }

    setTarget(null);
  };

  const Portal = ({ children }: { children: React.ReactNode }) => {
    if (!document.body) {
      return null;
    }
    return ReactDOM.createPortal(children, document.body);
  };

  const serialize = (node: Descendant): string => {
    if (Text.isText(node)) {
      return escapeHtml(node.text);
    }

    if (!node.type || !node.children) {
      return '';
    }

    const children = node.children.map((n) => serialize(n)).join('');

    switch (node.type) {
      case 'paragraph':
        return `<p>${children.trim()}</p>`;
      case 'mention':
        return node.url
          ? `<a href="${escapeHtml(node.url)}">${children}</a>`
          : children;
      default:
        return children;
    }
  };

  const submitComment = () => {
    if (Node.string(editor).trim() === '') {
      return;
    }

    const comment = value.map((node) => serialize(node)).join('');

    addComment(comment, translation);

    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 },
    });
    setValue(initialValue);
  };

  const setStyleForHover = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.children[index].className = 'mention';
  };

  const removeStyleForHover = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.children[index].className = 'mention active-mention';
  };

  return (
    <div className='comment add-comment'>
      <UserAvatar username={user.username} imageUrl={user.gravatarURLSmall} />
      <div className='container'>
        <Slate editor={editor} value={value} onChange={handleEditorOnChange}>
          <Localized
            id='comments-AddComment--input'
            attrs={{ placeholder: true }}
          >
            <Editable
              className='comment-editor'
              name='comment'
              dir='auto'
              placeholder={`Write a comment…`}
              renderElement={RenderElement}
              onKeyDown={target ? handleMentionsKeyDown : handleEditorKeyDown}
            />
          </Localized>
          {target && suggestedUsers.length > 0 && (
            <Portal>
              <div
                ref={mentionList}
                className='comments-mention-list'
                onMouseEnter={setStyleForHover}
                onMouseLeave={removeStyleForHover}
              >
                {suggestedUsers.map((suggestedUser, i) => (
                  <div
                    key={suggestedUser}
                    className={
                      i === index ? 'mention active-mention' : 'mention'
                    }
                    onMouseDown={handleMentionsMouseDown}
                  >
                    <Localized
                      id='comments-AddComment--mention-avatar-alt'
                      attrs={{ alt: true }}
                    >
                      <span className='user-avatar'>
                        <img
                          src={getUserGravatar(suggestedUser)}
                          alt='User Avatar'
                          width='22'
                          height='22'
                        />
                      </span>
                    </Localized>
                    <span className='name'>{suggestedUser}</span>
                  </div>
                ))}
              </div>
            </Portal>
          )}
        </Slate>
        <Localized
          id='comments-AddComment--submit-button'
          attrs={{ title: true }}
          elems={{ glyph: <i className='fa fa-paper-plane' /> }}
        >
          <button
            className='submit-button'
            title='Submit comment'
            onClick={submitComment}
          >
            {'<glyph></glyph>'}
          </button>
        </Localized>
      </div>
    </div>
  );
}

const withMentions = (editor: BaseEditor & ReactEditor) => {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === 'mention' ? true : isVoid(element);
  };

  return editor;
};

const insertMention = (
  editor: BaseEditor,
  character: string,
  users: UsersList[],
) => {
  const selectedUser = users.find((user) => user.name === character);
  if (!selectedUser) {
    return;
  }
  const userUrl = selectedUser.url;
  const name = selectedUser.name;
  const mention = {
    type: 'mention',
    character,
    url: userUrl,
    children: [{ text: name }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
  Transforms.insertText(editor, ' ');
};

const RenderElement = ({ attributes, children, element }: RenderElementProps) =>
  element.type === 'mention' ? (
    <span {...attributes} contentEditable={false} className='mention-element'>
      @{element.character}
      {children}
    </span>
  ) : (
    <p {...attributes}>{children}</p>
  );
