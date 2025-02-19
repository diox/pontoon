import * as React from 'react';

import './ProjectPercent.css';

import type { Localization } from '~/context/locale';

type Props = {
  localization: Localization;
};

/**
 * Render a project item percentage.
 */
export default function ProjectPercent(
  props: Props,
): React.ReactElement<'span'> {
  const { approvedStrings, stringsWithWarnings, totalStrings } =
    props.localization;
  const completeStrings = approvedStrings + stringsWithWarnings;

  const percent = Math.floor((completeStrings / totalStrings) * 100) + '%';

  return <span className='percent'>{percent}</span>;
}
