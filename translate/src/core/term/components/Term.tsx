import * as React from 'react';
import { Localized } from '@fluent/react';

import './Term.css';

import type { TermType } from '~/core/api';

type Props = {
  isReadOnlyEditor: boolean;
  locale: string;
  term: TermType;
  addTextToEditorTranslation: (arg0: string) => void;
  navigateToPath: (arg0: string) => void;
};

/**
 * Shows term entry with its metadata.
 */
export default function Term(
  props: Props,
): React.ReactElement<React.ElementType> {
  const { isReadOnlyEditor, locale, term } = props;

  const copyTermIntoEditor = (translation: string) => {
    if (isReadOnlyEditor) {
      return;
    }

    // Ignore if term not translated
    if (!translation) {
      return;
    }

    // Ignore if selecting text
    if (window.getSelection()?.toString()) {
      return;
    }

    props.addTextToEditorTranslation(translation);
  };

  const navigateToPath = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const path = event.currentTarget.pathname;
    props.navigateToPath(path);
  };

  // Copying into the editor is not allowed
  const cannotCopy = isReadOnlyEditor || !term.translation ? 'cannot-copy' : '';

  return (
    <Localized id='term-Term--copy' attrs={{ title: true }}>
      <li
        className={`term ${cannotCopy}`}
        title='Copy Into Translation'
        onClick={() => copyTermIntoEditor(term.translation)}
      >
        <header>
          <span className='text'>{term.text}</span>
          <span className='part-of-speech'>{term.partOfSpeech}</span>
          <a
            href={`/${locale}/terminology/common/?string=${term.entityId}`}
            onClick={navigateToPath}
            className='translate'
          >
            Translate
          </a>
        </header>
        <p className='translation'>{term.translation}</p>
        <div className='details'>
          <p className='definition'>{term.definition}</p>
          {!term.usage ? null : (
            <p className='usage'>
              <Localized id='term-Term--for-example'>
                <span className='title'>E.G.</span>
              </Localized>
              <span className='content'>{term.usage}</span>
            </p>
          )}
        </div>
      </li>
    </Localized>
  );
}
