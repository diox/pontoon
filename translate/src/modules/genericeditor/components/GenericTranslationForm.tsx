import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';

import { Locale } from '~/context/locale';
import {
  useHandleShortcuts,
  useReplaceSelectionContent,
  useUpdateUnsavedChanges,
} from '~/core/editor';
import { resetFailedChecks } from '~/core/editor/actions';
import { isReadOnlyEditor } from '~/core/entities/selectors';
import { useAppDispatch, useAppSelector } from '~/hooks';

type Props = {
  sendTranslation: (ignoreWarnings?: boolean) => void;
  updateTranslation: (arg0: string) => void;
};

/**
 * Shows a generic translation form, a simple textarea.
 */
export default function GenericTranslationForm({
  sendTranslation,
  updateTranslation,
}: Props): React.ReactElement<'textarea'> | null {
  const dispatch = useAppDispatch();

  const translation = useAppSelector((state) => state.editor.translation);
  const changeSource = useAppSelector((state) => state.editor.changeSource);
  const searchInputFocused = useAppSelector(
    (state) => state.search.searchInputFocused,
  );
  const { code, direction, script } = useContext(Locale);
  const readOnly = useAppSelector(isReadOnlyEditor);
  const unsavedChangesExist = useAppSelector(
    (state) => state.unsavedchanges.exist,
  );

  const handleShortcutsFn = useHandleShortcuts();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when something changes.
  useLayoutEffect(() => {
    const input = textareaRef.current;
    if (input && !searchInputFocused) {
      input.focus();
      if (changeSource !== 'internal') input.setSelectionRange(0, 0);
    }
  }, [translation, changeSource, searchInputFocused]);

  // Reset checks when content of the editor changes and some changes have been made.
  useEffect(() => {
    if (unsavedChangesExist) {
      dispatch(resetFailedChecks());
    }
  }, [dispatch, translation, unsavedChangesExist]);

  // When the translation or the initial translation changes, check for unsaved changes.
  useUpdateUnsavedChanges(false);

  // Replace selected content on external actions (for example, when a user clicks
  // on a placeable).
  useReplaceSelectionContent((content: string) => {
    const input = textareaRef.current;

    if (!input) {
      return;
    }

    const newSelectionPos = input.selectionStart + content.length;

    // Update content in the textarea.
    input.setRangeText(content);

    // Put the cursor right after the newly inserted content.
    input.setSelectionRange(newSelectionPos, newSelectionPos);

    // Update the state to show the new content in the Editor.
    updateTranslation(input.value);
  });

  if (typeof translation !== 'string') {
    return null;
  }

  return (
    <textarea
      placeholder={
        readOnly ? undefined : 'Type translation and press Enter to save'
      }
      readOnly={readOnly}
      ref={textareaRef}
      value={translation}
      onKeyDown={(ev) => handleShortcutsFn(ev, sendTranslation)}
      onChange={(ev) => updateTranslation(ev.currentTarget.value)}
      dir={direction}
      lang={code}
      data-script={script}
    />
  );
}
