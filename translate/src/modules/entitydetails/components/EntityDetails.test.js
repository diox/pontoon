/* eslint-env node */

import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import { createReduxStore, mountComponentWithStore } from '~/test/store';

import * as editorActions from '~/core/editor/actions';
import * as historyActions from '~/modules/history/actions';
import * as unsavedchangesActions from '~/modules/unsavedchanges/actions';

import EntityDetails, { EntityDetailsBase } from './EntityDetails';

const ENTITIES = [
  {
    pk: 42,
    original: 'le test',
    translation: [
      {
        string: 'test',
        errors: [],
        warnings: [],
      },
    ],
    project: { contact: '' },
    comment: '',
  },
  {
    pk: 1,
    original: 'something',
    translation: [
      {
        string: 'quelque chose',
        errors: [],
        warnings: [],
      },
    ],
    project: { contact: '' },
    comment: '',
  },
];
const TRANSLATION = 'test';
const SELECTED_ENTITY = {
  pk: 42,
  original: 'le test',
  translation: [{ string: TRANSLATION }],
};
const NAVIGATION = {
  entity: 42,
  locale: 'kg',
};
const PARAMETERS = {
  pluralForm: 0,
};
const HISTORY = {
  translations: [],
};
const LOCALES = {
  translations: [],
};
const USER = {
  settings: {
    forceSuggestions: true,
  },
  username: 'Franck',
};

function createShallowEntityDetails(selectedEntity = SELECTED_ENTITY) {
  return shallow(
    <EntityDetailsBase
      activeTranslationString={TRANSLATION}
      history={HISTORY}
      otherlocales={LOCALES}
      navigation={NAVIGATION}
      selectedEntity={selectedEntity}
      parameters={PARAMETERS}
      dispatch={() => {}}
      user={{ settings: {} }}
    />,
  );
}

function createEntityDetailsWithStore() {
  const initialState = {
    entities: {
      entities: ENTITIES,
    },
    user: USER,
    router: {
      location: {
        pathname: '/kg/pro/all/',
        search: '?string=' + ENTITIES[0].pk,
      },
      action: 'some-string-to-please-connected-react-router',
    },
    locale: {
      code: 'kg',
    },
  };
  const store = createReduxStore(initialState);
  const root = mountComponentWithStore(EntityDetails, store);

  return [root.find(EntityDetailsBase), store];
}

describe('<EntityDetailsBase>', () => {
  beforeAll(() => {
    sinon
      .stub(editorActions, 'updateFailedChecks')
      .returns({ type: 'whatever' });
    sinon
      .stub(editorActions, 'resetFailedChecks')
      .returns({ type: 'whatever' });
  });

  afterEach(() => {
    editorActions.updateFailedChecks.reset();
    editorActions.resetFailedChecks.reset();
  });

  afterAll(() => {
    editorActions.updateFailedChecks.restore();
    editorActions.resetFailedChecks.restore();
  });

  it('shows an empty section when no entity is selected', () => {
    const wrapper = createShallowEntityDetails(null);
    expect(wrapper.text()).toContain('');
  });

  it('loads the correct list of components', () => {
    const wrapper = createShallowEntityDetails();

    expect(wrapper.text()).toContain('EntityNavigation');
    expect(wrapper.text()).toContain('Metadata');
    expect(wrapper.text()).toContain('Editor');
    expect(wrapper.text()).toContain('Helpers');
  });

  // enzyme shallow rendering doesn't support useEffect()
  // https://github.com/enzymejs/enzyme/issues/2086
  it.skip('shows failed checks for approved (or fuzzy) translations with errors or warnings', () => {
    const wrapper = createShallowEntityDetails();

    // componentDidMount(): reset failed checks
    expect(editorActions.updateFailedChecks.calledOnce).toBeFalsy();
    expect(editorActions.resetFailedChecks.calledOnce).toBeTruthy();

    wrapper.setProps({
      pluralForm: -1,
      selectedEntity: {
        pk: 2,
        original: 'something',
        translation: [
          {
            approved: true,
            string: 'quelque chose',
            errors: ['Error1'],
            warnings: ['Warning1'],
          },
        ],
      },
    });

    // componentDidUpdate(): update failed checks
    expect(editorActions.updateFailedChecks.calledOnce).toBeTruthy();
    expect(editorActions.resetFailedChecks.calledOnce).toBeTruthy();
  });

  // enzyme shallow rendering doesn't support useEffect()
  // https://github.com/enzymejs/enzyme/issues/2086
  it.skip('hides failed checks for approved (or fuzzy) translations without errors or warnings', () => {
    const wrapper = createShallowEntityDetails();

    // componentDidMount(): reset failed checks
    expect(editorActions.updateFailedChecks.calledOnce).toBeFalsy();
    expect(editorActions.resetFailedChecks.calledOnce).toBeTruthy();

    wrapper.setProps({
      pluralForm: -1,
      selectedEntity: {
        pk: 2,
        original: 'something',
        translation: [
          {
            approved: true,
            string: 'quelque chose',
            errors: [],
            warnings: [],
          },
        ],
      },
    });

    // componentDidUpdate(): reset failed checks
    expect(editorActions.updateFailedChecks.calledOnce).toBeFalsy();
    expect(editorActions.resetFailedChecks.calledTwice).toBeTruthy();
  });
});

/**
 * This test ends up calling fetch(), and expects it to actually work.
 * It needs to be skipped for now, because it triggers async errors when
 * the API calls fail, and the calling code doesn't handle the errors.
 */
describe.skip('<EntityDetails>', () => {
  const hasFetch = typeof fetch === 'function';
  beforeAll(() => {
    if (!hasFetch)
      global.fetch = (url) => Promise.reject(new Error(`Mock fetch: ${url}`));
    sinon.stub(editorActions, 'update').returns({ type: 'whatever' });
    sinon.stub(historyActions, 'updateStatus').returns({ type: 'whatever' });
  });

  afterEach(() => {
    editorActions.update.resetHistory();
  });

  afterAll(() => {
    if (!hasFetch) delete global.fetch;
    editorActions.update.restore();
    historyActions.updateStatus.restore();
  });

  it('dispatches the updateStatus action when updateTranslationStatus is called', () => {
    const [wrapper, store] = createEntityDetailsWithStore();

    wrapper.instance().updateTranslationStatus(42, 'fake translation');
    // Proceed with changes even if unsaved
    store.dispatch(unsavedchangesActions.ignore());
    expect(historyActions.updateStatus.calledOnce).toBeTruthy();
  });
});
