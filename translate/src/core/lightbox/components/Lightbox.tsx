import * as React from 'react';
import { connect } from 'react-redux';

import './Lightbox.css';

import { NAME } from '..';
import { close } from '../actions';

import type { LightboxState } from '../reducer';
import { AppDispatch, RootState } from '~/store';

type Props = {
  lightbox: LightboxState;
};

type InternalProps = Props & {
  dispatch: AppDispatch;
};

type ContentProps = {
  image: string;
  onClose: () => void;
};

/**
 * Shows an image on a grey background.
 *
 * Hides the UI behind a grey background and show a centered image.
 * Click or press a key to close.
 */
function LightboxContent({ image, onClose }: ContentProps) {
  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      // On keys:
      //   - 13: Enter
      //   - 27: Escape
      //   - 32: Space
      if (
        event.keyCode === 13 ||
        event.keyCode === 27 ||
        event.keyCode === 32
      ) {
        onClose();
      }
    },
    [onClose],
  );

  React.useEffect(() => {
    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className='lightbox' onClick={onClose}>
      <img src={image} alt='' />
    </div>
  );
}

export class LightboxBase extends React.Component<InternalProps> {
  close: () => void = () => {
    this.props.dispatch(close());
  };

  render(): null | React.ReactElement<React.ElementType> {
    const { lightbox } = this.props;

    if (!lightbox.isOpen) {
      return null;
    }

    return <LightboxContent image={lightbox.image} onClose={this.close} />;
  }
}

const mapStateToProps = (state: RootState): Props => {
  return {
    lightbox: state[NAME],
  };
};

export default connect(mapStateToProps)(LightboxBase) as any;
