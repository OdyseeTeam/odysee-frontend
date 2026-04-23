import React, { useCallback } from 'react';
import { FormField } from 'component/common/form';
import { CC_LICENSES, LEGACY_CC_LICENSES, COPYRIGHT, OTHER, PUBLIC_DOMAIN, NONE } from 'constants/licenses';
type Props = {
  licenseType: string | null | undefined;
  licenseUrl: string | null | undefined;
  otherLicenseDescription: string | null | undefined;
  handleLicenseChange: (arg0: string, arg1: string) => void;
  handleLicenseDescriptionChange: (arg0: React.SyntheticEvent<any>) => void;
  handleLicenseUrlChange: (arg0: React.SyntheticEvent<any>) => void;
};

function LicenseType({
  licenseType,
  otherLicenseDescription,
  licenseUrl,
  handleLicenseChange,
  handleLicenseDescriptionChange,
  handleLicenseUrlChange,
}: Props) {
  const handleLicenseOnChange = useCallback(
    (event: React.SyntheticEvent<any>) => {
      const { options, selectedIndex } = event.target as any;
      const selectedOption = options[selectedIndex];
      const type = selectedOption.value;
      const url = selectedOption.getAttribute('data-url');
      handleLicenseChange(type, url);
    },
    [handleLicenseChange]
  );

  return (
    <React.Fragment>
      <FormField
        name="license"
        label={__('License (Optional)')}
        type="select"
        value={licenseType}
        onChange={handleLicenseOnChange}
      >
        <option value={NONE}>{__('None')}</option>
        <option value={PUBLIC_DOMAIN}>{__('Public Domain')}</option>
        {CC_LICENSES.map(({ value, url }) => (
          <option key={value} value={value} data-url={url}>
            {value}
          </option>
        ))}

        <option value={COPYRIGHT}>{__('Copyrighted...')}</option>
        <option value={OTHER}>{__('Other...')}</option>
        <option disabled>{__('Legacy Licences')}</option>
        {LEGACY_CC_LICENSES.map(({ value, url }) => (
          <option key={value} value={value} data-url={url}>
            {value}
          </option>
        ))}
      </FormField>

      {licenseType === COPYRIGHT && (
        <FormField
          label={__('Copyright notice')}
          type="text"
          name="copyright-notice"
          value={otherLicenseDescription}
          onChange={handleLicenseDescriptionChange}
        />
      )}

      {licenseType === OTHER && (
        <fieldset>
          <div className="form-field__help">{__('Provide a description and link to your license')}</div>
          <fieldset-group>
            <FormField
              label={__('License description')}
              placeholder={__("The 'cool' license - TM")}
              type="text"
              name="other-license-description"
              value={otherLicenseDescription}
              onChange={handleLicenseDescriptionChange}
            />

            <FormField
              label={__('License URL')}
              placeholder={__('mywebsite.com/license')}
              type="text"
              name="other-license-url"
              value={licenseUrl}
              onChange={handleLicenseUrlChange}
            />
          </fieldset-group>
        </fieldset>
      )}
    </React.Fragment>
  );
}

export default LicenseType;
