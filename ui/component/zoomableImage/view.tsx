import React from 'react';
import * as MODALS from 'constants/modal_types';
import { useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';

type Props = {
  src?: string;
  title?: string;
  alt?: string;
  [key: string]: any;
};

function ZoomableImage(props: Props) {
  const { ...imgProps } = props;
  const dispatch = useAppDispatch();

  const onClick = () => {
    dispatch(
      doOpenModal(MODALS.VIEW_IMAGE, {
        src: imgProps.src,
        title: imgProps.title || imgProps.alt,
      })
    );
  };

  return <img className="img__zoomable" {...imgProps} onClick={onClick} />;
}

export default ZoomableImage;
