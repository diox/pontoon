import { RECEIVE, REQUEST } from './actions';

import type { TermType } from '~/core/api';
import type { ReceiveAction, RequestAction } from './actions';

type Action = ReceiveAction | RequestAction;

export type TermState = {
  readonly fetching: boolean;
  readonly sourceString: string;
  readonly terms: Array<TermType>;
};

const initialState: TermState = {
  fetching: false,
  sourceString: '',
  terms: [],
};

export default function reducer(
  state: TermState = initialState,
  action: Action,
): TermState {
  switch (action.type) {
    case REQUEST:
      return {
        ...state,
        fetching: true,
        sourceString: action.sourceString,
        terms: [],
      };
    case RECEIVE:
      return {
        ...state,
        fetching: false,
        terms: action.terms,
      };
    default:
      return state;
  }
}
