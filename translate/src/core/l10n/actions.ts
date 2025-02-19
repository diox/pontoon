import { FluentBundle, FluentResource, TextTransform } from '@fluent/bundle';
import { negotiateLanguages } from '@fluent/langneg';
import { ReactLocalization } from '@fluent/react';

import api from '~/core/api';

import { AVAILABLE_LOCALES } from '.';
import { accented, bidi } from './pseudolocalization';

import type { AppDispatch } from '~/store';

export const RECEIVE: 'l10n/RECEIVE' = 'l10n/RECEIVE';
export const REQUEST: 'l10n/REQUEST' = 'l10n/REQUEST';

/**
 * Notify that translations for the UI are being fetched.
 */
export type RequestAction = {
  readonly type: typeof REQUEST;
};
export function request(): RequestAction {
  return {
    type: REQUEST,
  };
}

/**
 * Receive translations for a locale.
 */
export type ReceiveAction = {
  readonly type: typeof RECEIVE;
  readonly localization: ReactLocalization;
};
export function receive(localization: ReactLocalization): ReceiveAction {
  return {
    type: RECEIVE,
    localization,
  };
}

/**
 * Get the UI translations for a list of locales.
 *
 * This fetches the translations for the UI for each given locale, bundles
 * those and store them to be used in showing a localized interface.
 */
export function get(locales: ReadonlyArray<string>) {
  return async (dispatch: AppDispatch) => {
    dispatch(request());

    // Pseudo localization shows a weirdly translated UI, based on English.
    // This is a development only tool that helps verifying that our UI
    // is properly localized.
    const urlParams = new URLSearchParams(window.location.search);
    const usePseudoLocalization =
      urlParams.has('pseudolocalization') &&
      (urlParams.get('pseudolocalization') === 'accented' ||
        urlParams.get('pseudolocalization') === 'bidi');
    // Setting defaultLocale to `en-US` means that it will always be the
    // last fallback locale, thus making sure the UI is always working.
    let languages = negotiateLanguages(locales, AVAILABLE_LOCALES, {
      defaultLocale: 'en-US',
    });

    // For pseudo localization, we only want to serve English.
    if (usePseudoLocalization) {
      languages = ['en-US'];
    }

    const bundles = await Promise.all(
      languages.map((locale) => {
        return api.l10n.get(locale).then((content) => {
          let bundleOptions: { transform?: TextTransform } = {};

          // We know this is English, let's make it weird before bundling it.
          if (usePseudoLocalization) {
            switch (urlParams.get('pseudolocalization')) {
              case 'accented':
                bundleOptions = { transform: accented };
                break;
              case 'bidi':
                bundleOptions = { transform: bidi };
                break;
            }
          }

          const bundle = new FluentBundle(locale, bundleOptions);
          let resource = new FluentResource(content);
          bundle.addResource(resource);
          return bundle;
        });
      }),
    );

    const localization = new ReactLocalization(bundles);
    dispatch(receive(localization));
  };
}

export default {
  get,
  receive,
  request,
};
