import * as React from 'react';
import Card from 'component/common/card';
import WebUploadItem from './internal/web-upload-item';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal as doOpenModalAction } from 'redux/actions/app';
import {
  doPublishResume as doPublishResumeAction,
  doUpdateUploadRemove as doUpdateUploadRemoveAction,
} from 'redux/actions/publish';
import { selectCurrentUploads, selectUploadCount } from 'redux/selectors/publish';
type Props = {};
export default function WebUploadList(props: Props) {
  const dispatch = useAppDispatch();
  const currentUploads = useAppSelector(selectCurrentUploads);
  const uploadCount = useAppSelector(selectUploadCount);
  const doPublishResume = (arg0: any) => dispatch(doPublishResumeAction(arg0));
  const doUpdateUploadRemove = (arg0: string, arg1: any) => dispatch(doUpdateUploadRemoveAction(arg0, arg1));
  const doOpenModal = (arg0: string, arg1: {}) => dispatch(doOpenModalAction(arg0, arg1));
  return (
    !!uploadCount && (
      <Card
        title={__('Currently Uploading')}
        subtitle={__('Leave the app running until upload is complete')}
        body={
          <section>
            {/* $FlowFixMe */}
            {Object.values(currentUploads).map((uploadItem) => (
              <WebUploadItem
                key={`upload${uploadItem.params.name}`}
                uploadItem={uploadItem}
                doPublishResume={doPublishResume}
                doUpdateUploadRemove={doUpdateUploadRemove}
                doOpenModal={doOpenModal}
              />
            ))}
          </section>
        }
      />
    )
  );
}
