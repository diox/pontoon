import { Localized } from '@fluent/react';
import classNames from 'classnames';
import React, { useCallback, useContext, useState } from 'react';

import { Locale } from '~/context/locale';
import type { Entity as EntityType, EntityTranslation } from '~/core/api';
import type { NavigationParams } from '~/core/navigation';
import { TranslationProxy } from '~/core/translation';
import { useTranslator } from '~/hooks/useTranslator';

import './Entity.css';

type Props = {
  checkedForBatchEditing: boolean;
  toggleForBatchEditing: (entityPK: number, shiftPressed: boolean) => void;
  entity: EntityType;
  isReadOnlyEditor: boolean;
  selected: boolean;
  selectEntity: (entity: EntityType) => void;
  getSiblingEntities: (entityPK: number) => void;
  parameters: NavigationParams;
};

/**
 * Displays a single Entity as a list element.
 *
 * The format of this element is: "[Status] Source (Translation)"
 *
 * "Status" is the current status of the translation. Can be:
 *   - "errors": one of the plural forms has errors and is approved or fuzzy
 *   - "warnings": one of the plural forms has warnings and is approved or fuzzy
 *   - "approved": all plural forms are approved and don't have errors or warnings
 *   - "fuzzy": all plural forms are fuzzy and don't have errors or warnings
 *   - "partial": some plural forms have either approved or fuzzy translations, but not all
 *   - "missing": none of the plural forms have an approved or fuzzy translation
 *
 * "Source" is the original string from the project. Usually it's the en-US string.
 *
 * "Translation" is the current "best" translation. It shows either the approved
 * translation, or the fuzzy translation, or the last suggested translation.
 */
export function Entity({
  checkedForBatchEditing,
  entity,
  getSiblingEntities,
  isReadOnlyEditor,
  parameters,
  selected,
  selectEntity,
  toggleForBatchEditing,
}: Props): React.ReactElement<'li'> {
  const isTranslator = useTranslator();
  const [areSiblingsActive, setSiblingsActive] = useState(false);

  const handleSelectEntity = useCallback(
    (ev: React.MouseEvent) => {
      if (
        !(
          ev.target instanceof HTMLElement &&
          ev.target.classList.contains('status')
        )
      )
        selectEntity(entity);
    },
    [entity, selectEntity],
  );

  const showSiblingEntities = useCallback(
    (ev: React.MouseEvent) => {
      ev.stopPropagation();
      getSiblingEntities(entity.pk);
      setSiblingsActive(true);
    },
    [getSiblingEntities, entity.pk],
  );

  const handleForBatchEditing = useCallback(
    (ev: React.MouseEvent) => {
      if (isTranslator && !isReadOnlyEditor) {
        ev.stopPropagation();
        toggleForBatchEditing(entity.pk, ev.shiftKey);
      }
    },
    [entity, isReadOnlyEditor, isTranslator, toggleForBatchEditing],
  );

  const showSiblingEntitiesButton = () => {
    const { search, status, extra, tag, time, author } = parameters;
    return (
      search ||
      status != null ||
      extra != null ||
      tag != null ||
      time != null ||
      author != null
    );
  };

  const { code, direction, script } = useContext(Locale);

  const cn = classNames(
    'entity',
    translationStatus(entity.translation),
    selected && 'selected',
    isTranslator && !isReadOnlyEditor && 'batch-editable',
    checkedForBatchEditing && 'checked',
    entity.isSibling && 'sibling',
  );

  return (
    <li className={cn} onClick={handleSelectEntity}>
      <span className='status fa' onClick={handleForBatchEditing} />
      {selected && !entity.isSibling ? (
        <div>
          {!areSiblingsActive && showSiblingEntitiesButton() && (
            <Localized id='entitieslist-Entity--sibling-strings-title'>
              <i
                className={'sibling-entities-icon fas fa-expand-arrows-alt'}
                title='Click to reveal sibling strings'
                onClick={showSiblingEntities}
              ></i>
            </Localized>
          )}
        </div>
      ) : null}
      <div>
        <p className='source-string'>
          <TranslationProxy
            content={entity.original}
            format={entity.format}
            search={parameters.search}
          />
        </p>
        <p
          className='translation-string'
          dir={direction}
          lang={code}
          data-script={script}
        >
          <TranslationProxy
            content={entity.translation[0].string}
            format={entity.format}
            search={parameters.search}
          />
        </p>
      </div>
    </li>
  );
}

function translationStatus(translations: EntityTranslation[]): string {
  let errors = false;
  let warnings = false;
  let approved = 0;
  let fuzzy = 0;

  for (const tx of translations) {
    if (tx.errors.length && (tx.approved || tx.fuzzy)) errors = true;
    else if (tx.warnings.length && (tx.approved || tx.fuzzy)) warnings = true;
    else if (tx.approved) approved += 1;
    else if (tx.fuzzy) fuzzy += 1;
  }

  if (errors) return 'errors';
  if (warnings) return 'warnings';
  if (approved === translations.length) return 'approved';
  if (fuzzy === translations.length) return 'fuzzy';
  if (approved > 0 || fuzzy > 0) return 'partial';
  return 'missing';
}
