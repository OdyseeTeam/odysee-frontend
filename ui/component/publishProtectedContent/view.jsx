// @flow
import React, { useState } from 'react';
import { FormField } from 'component/common/form';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import * as PAGES from 'constants/pages';

type Props = {
  description: ?string,
  disabled: boolean,
  updatePublishForm: ({}) => void,
};

function PublishProtectedContent(props: Props) {

  const [isRestrictingContent, setIsRestrictingContent] = React.useState(false);

  function handleChangeRestriction(){
    setIsRestrictingContent(!isRestrictingContent)

    console.log('hey something')
  }

  const memberships = ['Bronze Plan', 'Silver Plan', 'Gold Plan']

  const hasMembershipsEnabled = false;



  return (
    <>
      {/*{disabled && <h2 className="card__title card__title-disabled">{__('Description')}</h2>}*/}

      <h2 className="card__title">{__('Restrict Content')}</h2>
      { !hasMembershipsEnabled && (
        <>
          {/*<h1 style={{ marginTop: '10px', marginBottom: '40px' }}>Please activate your memberships first to use this functionality</h1>*/}
          <div style={{ marginTop: '10px', marginBottom: '40px' }}>
            <I18nMessage
              tokens={{
                activate_your_memberships: (
                  <Button
                    navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`}
                    label={__('activate your memberships')}
                    button="link"
                  />
                ),
              }}
              style={{ marginTop: '10px', marginBottom: '40px' }}
            >
              Please %activate_your_memberships% first to to use this functionality
            </I18nMessage>
          </div>
        </>
      )}

      { hasMembershipsEnabled && (
        <>
          <Card
            className=""
            actions={
              <>
              </>
            }
            body={
              <>
                <FormField
                  type="checkbox"
                  defaultChecked={false}
                  label={'Restrict content to only allow subscribers to certain memberships to view it'}
                  name={'toggleRestrictedContent'}
                  style={{ fontSize: '15px', marginTop: '10px' }}
                  onChange={() => handleChangeRestriction()}
                />
                { isRestrictingContent && (<>
                  <h1 style={{ marginTop: '20px', marginBottom: '18px' }} >Memberships which can view the content:</h1>
                  {memberships.map((membership) => (
                    <FormField
                      type="checkbox"
                      defaultChecked={false}
                      label={membership}
                      name={'restrictToMembership:' + membership}
                      style={{ fontSize: '15px', marginTop: '10px' }}
                      onChange={() => console.log("hello")}
                    />
                  ))}
                </>)}
              </>
            }
          />
        </>
      )}

    </>
  );
}

export default PublishProtectedContent;
