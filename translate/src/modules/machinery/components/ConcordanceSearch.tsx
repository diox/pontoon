import React, { useContext } from 'react';

import { Locale } from '~/context/locale';
import type { MachineryTranslation } from '~/core/api';
import { GenericTranslation } from '~/core/translation';
import TranslationMemory from './source/TranslationMemory';

type Props = {
  sourceString: string;
  translation: MachineryTranslation;
};

function ProjectList({ projects }: { projects: (string | null)[] }) {
  const notEmpty = projects.filter(Boolean) as string[];

  if (notEmpty.length === 0) {
    return <TranslationMemory />;
  }

  return (
    <>
      {notEmpty.map((project) => (
        <li key={project}>
          <span className='translation-source'>
            <span>{project.toUpperCase()}</span>
          </span>
        </li>
      ))}
    </>
  );
}

export function ConcordanceSearch({
  sourceString,
  translation,
}: Props): React.ReactElement {
  const { code, direction, script } = useContext(Locale);
  const projects = translation.projectNames;
  const title = projects?.filter(Boolean).join(' • ');

  return (
    <>
      <header>
        <ul className='sources projects' title={title}>
          {projects && <ProjectList projects={projects} />}
        </ul>
      </header>
      <p className='original'>
        <GenericTranslation
          content={translation.original}
          search={sourceString}
        />
      </p>
      <p
        className='suggestion'
        dir={direction}
        data-script={script}
        lang={code}
      >
        <GenericTranslation
          content={translation.translation}
          search={sourceString}
        />
      </p>
    </>
  );
}
