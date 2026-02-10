// @flow
import React from 'react';
import classnames from 'classnames';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Button from 'component/button';
import ClaimPreview from 'component/claimPreview';
import Spinner from 'component/spinner';
import { FormField } from 'component/common/form';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { CC_LICENSES, COPYRIGHT, OTHER, NONE, PUBLIC_DOMAIN } from 'constants/licenses';
import { MEMBERS_ONLY_CONTENT_TAG, SCHEDULED_TAGS, VISIBILITY_TAGS } from 'constants/tags';
import { parsePurchaseTag, parseRentalTag } from 'util/stripe';
import './style.scss';

const COPYABLE_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'tags', label: 'Tags' },
  { key: 'thumbnail', label: 'Thumbnail' },
  { key: 'languages', label: 'Language' },
  { key: 'license', label: 'License' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'price', label: 'Price / Paywall' },
];

const FILTERS = [
  { key: 'all', label: 'All Uploads' },
  { key: 'unlisted', label: 'Unlisted' },
  { key: 'scheduled', label: 'Scheduled' },
];

const MAX_VISIBLE_RESULTS = 100;

type Props = {
  searchUploads: (searchTerm: string, filter: string) => Promise<{ claims: Array<StreamClaim> }>,
  doPopulatePublishFormFromClaim: (claim: StreamClaim, fields: Array<string>) => void,
  publishFormValues: any,
  updatePublishForm: (UpdatePublishState) => void,
  doOpenModal: (string, ?{}) => void,
  doToast: ({ message: string, actionText?: string, action?: () => void, isError?: boolean }) => void,
  doHideModal: () => void,
};

type ClaimCopyMetadata = {
  rawTags: Array<string>,
  filteredTags: Array<string>,
  title: string,
  description: string,
  thumbnailUrl: string,
  languageList: Array<string>,
  license: string,
  licenseUrl: string,
  feeAmount: number,
  hasRental: boolean,
  hasPurchase: boolean,
  hasVisibilitySettings: boolean,
  visibilityLabel: string,
};

type ClaimCopySummary = {
  fieldChips: Array<string>,
  detailChips: Array<string>,
  hiddenFieldCount: number,
  hiddenDetailCount: number,
};

const MAX_FIELD_CHIPS = 3;
const MAX_DETAIL_CHIPS = 2;
const FIELD_TO_FORM_KEYS = {
  title: ['title'],
  description: ['description'],
  tags: ['tags', 'nsfw'],
  thumbnail: ['thumbnail', 'uploadThumbnailStatus'],
  languages: ['language', 'languages'],
  license: ['licenseType', 'licenseUrl', 'otherLicenseDescription'],
  visibility: ['visibility', 'memberRestrictionOn', 'memberRestrictionTierIds'],
  price: [
    'paywall',
    'fee',
    'fiatPurchaseEnabled',
    'fiatPurchaseFee',
    'fiatRentalEnabled',
    'fiatRentalFee',
    'fiatRentalExpiration',
  ],
};

function cloneValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }

  if (value && typeof value === 'object') {
    const clone = {};
    Object.keys(value).forEach((key) => {
      clone[key] = cloneValue(value[key]);
    });
    return clone;
  }

  return value;
}

function hasExistingValueForField(fieldKey: string, publishFormValues: any): boolean {
  const formValues = publishFormValues || {};

  switch (fieldKey) {
    case 'title':
      return Boolean((formValues.title || '').trim());
    case 'description':
      return Boolean((formValues.description || '').trim());
    case 'tags':
      return Array.isArray(formValues.tags) && formValues.tags.length > 0;
    case 'thumbnail':
      return Boolean((formValues.thumbnail || '').trim());
    case 'languages':
      return (
        (Array.isArray(formValues.languages) && formValues.languages.length > 0) ||
        Boolean((formValues.language || '').trim())
      );
    case 'license': {
      const licenseType = String(formValues.licenseType || '').toLowerCase();
      return (
        (licenseType && licenseType !== 'none') ||
        Boolean((formValues.licenseUrl || '').trim()) ||
        Boolean((formValues.otherLicenseDescription || '').trim())
      );
    }
    case 'visibility': {
      const visibility = formValues.visibility || 'public';
      const hasMemberRestriction =
        Boolean(formValues.memberRestrictionOn) ||
        (Array.isArray(formValues.memberRestrictionTierIds) && formValues.memberRestrictionTierIds.length > 0);
      return visibility !== 'public' || hasMemberRestriction;
    }
    case 'price': {
      const feeAmount = Number(formValues?.fee?.amount || 0);
      const purchaseAmount = Number(formValues?.fiatPurchaseFee?.amount || 0);
      const rentalAmount = Number(formValues?.fiatRentalFee?.amount || 0);
      const hasFiatPurchase = Boolean(formValues.fiatPurchaseEnabled && purchaseAmount > 0);
      const hasFiatRental = Boolean(formValues.fiatRentalEnabled && rentalAmount > 0);
      return (formValues.paywall && formValues.paywall !== 'free') || feeAmount > 0 || hasFiatPurchase || hasFiatRental;
    }
    default:
      return false;
  }
}

function normalizeStringForCompare(value: any): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTagValuesForCompare(tags: any): Array<string> {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => (tag && typeof tag === 'object' ? tag.name : tag))
    .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
    .filter(Boolean);
}

function normalizeLanguageValuesForCompare(languages: any, fallbackLanguage: any): Array<string> {
  const hasLanguages = Array.isArray(languages) && languages.length > 0;
  const values = hasLanguages ? languages : fallbackLanguage ? [fallbackLanguage] : [];

  return values.map((lang) => String(lang).trim().toLowerCase()).filter(Boolean);
}

function areArraysEqualForCompare(a: Array<any>, b: Array<any>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function areNumbersEqualForCompare(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.000001;
}

function getClaimVisibilityKey(rawTags: Array<string>): string {
  if (rawTags.includes(VISIBILITY_TAGS.PRIVATE)) return 'private';
  if (rawTags.includes(VISIBILITY_TAGS.UNLISTED)) return 'unlisted';
  return 'public';
}

function getFormVisibilityKey(formValues: any): string {
  const visibility = String(formValues.visibility || 'public').toLowerCase();
  if (visibility === 'private') return 'private';
  if (visibility === 'unlisted') return 'unlisted';
  return 'public';
}

function getClaimLicenseValuesForCompare(metadata: ClaimCopyMetadata): {
  licenseType: string,
  licenseUrl: string,
  otherLicenseDescription: string,
} {
  const sourceLicense = normalizeStringForCompare(metadata.license);
  const sourceLicenseUrl = normalizeStringForCompare(metadata.licenseUrl);

  let licenseType = NONE;
  let otherLicenseDescription = '';
  let licenseUrl = '';

  if (sourceLicense) {
    const isStandardLicense = CC_LICENSES.some(({ value }) => value === sourceLicense);

    if (isStandardLicense || sourceLicense === NONE || sourceLicense === PUBLIC_DOMAIN) {
      licenseType = sourceLicense;
    } else if (!sourceLicenseUrl) {
      licenseType = COPYRIGHT;
      otherLicenseDescription = sourceLicense;
    } else {
      licenseType = OTHER;
      otherLicenseDescription = sourceLicense;
    }

    if (sourceLicenseUrl) {
      licenseUrl = sourceLicenseUrl;
    }
  }

  return {
    licenseType: normalizeStringForCompare(licenseType).toLowerCase(),
    licenseUrl: normalizeStringForCompare(licenseUrl),
    otherLicenseDescription: normalizeStringForCompare(otherLicenseDescription),
  };
}

function fieldWouldChangeValue(fieldKey: string, claim: ?StreamClaim, publishFormValues: any): boolean {
  const formValues = publishFormValues || {};
  const metadata = getClaimCopyMetadata(claim);

  switch (fieldKey) {
    case 'title':
      return normalizeStringForCompare(metadata.title) !== normalizeStringForCompare(formValues.title);
    case 'description':
      return normalizeStringForCompare(metadata.description) !== normalizeStringForCompare(formValues.description);
    case 'tags': {
      const sourceTags = normalizeTagValuesForCompare(metadata.filteredTags);
      const targetTags = normalizeTagValuesForCompare(formValues.tags);
      return !areArraysEqualForCompare(sourceTags, targetTags);
    }
    case 'thumbnail':
      return normalizeStringForCompare(metadata.thumbnailUrl) !== normalizeStringForCompare(formValues.thumbnail);
    case 'languages': {
      const sourceLanguages = normalizeLanguageValuesForCompare(metadata.languageList, null);
      const targetLanguages = normalizeLanguageValuesForCompare(formValues.languages, formValues.language);
      return !areArraysEqualForCompare(sourceLanguages, targetLanguages);
    }
    case 'license': {
      const sourceLicenseValues = getClaimLicenseValuesForCompare(metadata);
      const targetLicense = normalizeStringForCompare(formValues.licenseType).toLowerCase();
      const targetLicenseUrl = normalizeStringForCompare(formValues.licenseUrl);
      const targetOtherDescription = normalizeStringForCompare(formValues.otherLicenseDescription);

      return (
        sourceLicenseValues.licenseType !== targetLicense ||
        sourceLicenseValues.licenseUrl !== targetLicenseUrl ||
        sourceLicenseValues.otherLicenseDescription !== targetOtherDescription
      );
    }
    case 'visibility':
      return getClaimVisibilityKey(metadata.rawTags) !== getFormVisibilityKey(formValues);
    case 'price': {
      const sourcePurchasePrice = Number(parsePurchaseTag(metadata.rawTags) || 0);
      const sourceRentalData = parseRentalTag(metadata.rawTags);
      const sourceRentalPrice = Number(sourceRentalData?.price || 0);
      const sourceFeeAmount = Number(metadata.feeAmount || 0);

      const targetPurchasePrice = Number(formValues?.fiatPurchaseFee?.amount || 0);
      const targetRentalPrice = Number(formValues?.fiatRentalFee?.amount || 0);
      const targetFeeAmount = Number(formValues?.fee?.amount || 0);
      const targetHasPurchase = Boolean(formValues.fiatPurchaseEnabled && targetPurchasePrice > 0);
      const targetHasRental = Boolean(formValues.fiatRentalEnabled && targetRentalPrice > 0);
      const targetPaywall = String(formValues.paywall || 'free').toLowerCase();

      const sourceHasPurchase = sourcePurchasePrice > 0;
      const sourceHasRental = sourceRentalPrice > 0;
      const sourceHasFee = sourceFeeAmount > 0;

      if (sourceHasPurchase !== targetHasPurchase) return true;
      if (sourceHasPurchase && !areNumbersEqualForCompare(sourcePurchasePrice, targetPurchasePrice)) return true;

      if (sourceHasRental !== targetHasRental) return true;
      if (sourceHasRental && !areNumbersEqualForCompare(sourceRentalPrice, targetRentalPrice)) return true;

      const targetHasFee = targetFeeAmount > 0;
      if (sourceHasFee !== targetHasFee) return true;
      if (sourceHasFee && !areNumbersEqualForCompare(sourceFeeAmount, targetFeeAmount)) return true;

      const sourceHasNoPricing = !sourceHasPurchase && !sourceHasRental && !sourceHasFee;
      if (sourceHasNoPricing && targetPaywall !== 'free') return true;

      return false;
    }
    default:
      return true;
  }
}

function getUndoDataForFields(fields: Array<string>, publishFormValues: any): UpdatePublishState {
  const undoData = {};

  fields.forEach((field) => {
    const targetKeys = FIELD_TO_FORM_KEYS[field] || [];
    targetKeys.forEach((targetKey) => {
      undoData[targetKey] = cloneValue(publishFormValues ? publishFormValues[targetKey] : undefined);
    });
  });

  return undoData;
}

function getClaimCopyMetadata(claim: ?StreamClaim): ClaimCopyMetadata {
  if (!claim || !claim.value) {
    return {
      rawTags: [],
      filteredTags: [],
      title: '',
      description: '',
      thumbnailUrl: '',
      languageList: [],
      license: '',
      licenseUrl: '',
      feeAmount: 0,
      hasRental: false,
      hasPurchase: false,
      hasVisibilitySettings: false,
      visibilityLabel: '',
    };
  }

  const value = claim.value;
  const rawTags = Array.isArray(value.tags) ? value.tags : [];
  const filteredTags = rawTags.filter(
    (tag) =>
      tag !== VISIBILITY_TAGS.UNLISTED &&
      tag !== VISIBILITY_TAGS.PRIVATE &&
      tag !== SCHEDULED_TAGS.HIDE &&
      tag !== SCHEDULED_TAGS.SHOW &&
      tag !== MEMBERS_ONLY_CONTENT_TAG
  );

  const hasUnlisted = rawTags.includes(VISIBILITY_TAGS.UNLISTED);
  const hasPrivate = rawTags.includes(VISIBILITY_TAGS.PRIVATE);
  const hasMembersOnly = rawTags.includes(MEMBERS_ONLY_CONTENT_TAG);

  let visibilityLabel = '';
  if (hasPrivate) {
    visibilityLabel = __('Private');
  } else if (hasUnlisted) {
    visibilityLabel = __('Unlisted');
  } else if (hasMembersOnly) {
    visibilityLabel = __('Members only');
  }

  const hasRental = Boolean(parseRentalTag(rawTags));
  const hasPurchase = Boolean(parsePurchaseTag(rawTags));
  const feeAmount = Number(value?.fee?.amount || 0);

  return {
    rawTags,
    filteredTags,
    title: typeof value.title === 'string' ? value.title.trim() : '',
    description: typeof value.description === 'string' ? value.description.trim() : '',
    thumbnailUrl: value.thumbnail && typeof value.thumbnail.url === 'string' ? value.thumbnail.url.trim() : '',
    languageList: Array.isArray(value.languages) ? value.languages : [],
    license: typeof value.license === 'string' ? value.license.trim() : '',
    licenseUrl: typeof value.license_url === 'string' ? value.license_url.trim() : '',
    feeAmount,
    hasRental,
    hasPurchase,
    hasVisibilitySettings: Boolean(hasUnlisted || hasPrivate || hasMembersOnly),
    visibilityLabel,
  };
}

function getFieldAvailabilityForClaim(claim: ?StreamClaim): { [string]: boolean } {
  const availability = {};
  COPYABLE_FIELDS.forEach((field) => {
    availability[field.key] = false;
  });

  const metadata = getClaimCopyMetadata(claim);
  const hasPaidSettings = Boolean(metadata.hasRental || metadata.hasPurchase || metadata.feeAmount > 0);

  availability.title = Boolean(metadata.title);
  availability.description = Boolean(metadata.description);
  availability.tags = metadata.filteredTags.length > 0;
  availability.thumbnail = Boolean(metadata.thumbnailUrl);
  availability.languages = metadata.languageList.length > 0;
  availability.license = Boolean(metadata.license || metadata.licenseUrl);
  availability.visibility = metadata.hasVisibilitySettings;
  availability.price = hasPaidSettings;

  return availability;
}

function getCopySummaryForClaim(claim: ?StreamClaim): ClaimCopySummary {
  const availability = getFieldAvailabilityForClaim(claim);
  const metadata = getClaimCopyMetadata(claim);
  const fieldChips = COPYABLE_FIELDS.filter((field) => availability[field.key]).map((field) => field.label);
  const detailChips = [];

  if (metadata.visibilityLabel) {
    detailChips.push(metadata.visibilityLabel);
  }

  if (metadata.hasRental) {
    detailChips.push(__('Rental'));
  }

  if (metadata.hasPurchase) {
    detailChips.push(__('Purchase'));
  }

  if (metadata.feeAmount > 0 && !metadata.hasRental && !metadata.hasPurchase) {
    detailChips.push(__('Paid'));
  }

  metadata.filteredTags.slice(0, MAX_DETAIL_CHIPS).forEach((tag) => {
    detailChips.push(`#${tag}`);
  });

  const visibleFieldChips = fieldChips.slice(0, MAX_FIELD_CHIPS);
  const visibleDetailChips = detailChips.slice(0, MAX_DETAIL_CHIPS);

  return {
    fieldChips: visibleFieldChips,
    detailChips: visibleDetailChips,
    hiddenFieldCount: Math.max(0, fieldChips.length - visibleFieldChips.length),
    hiddenDetailCount: Math.max(0, detailChips.length - visibleDetailChips.length),
  };
}

export default function ModalCopyFromUpload(props: Props) {
  const {
    searchUploads,
    doPopulatePublishFormFromClaim,
    publishFormValues,
    updatePublishForm,
    doOpenModal,
    doToast,
    doHideModal,
  } = props;

  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedTerm, setDebouncedTerm] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [claims, setClaims] = React.useState<Array<StreamClaim>>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingFailed, setLoadingFailed] = React.useState(false);
  const searchRequestRef = React.useRef(0);
  const isMountedRef = React.useRef(true);

  const [selectedClaim, setSelectedClaim] = React.useState<?StreamClaim>(null);
  const [selectedFields, setSelectedFields] = React.useState<{ [string]: boolean }>(() => {
    const defaults = {};
    COPYABLE_FIELDS.forEach((field) => {
      defaults[field.key] = true;
    });
    return defaults;
  });

  const trimmedTerm = debouncedTerm.trim();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cleanup
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Run search whenever debounced term or filter changes
  const runSearch = React.useCallback(
    async (term: string, filter: string) => {
      const reqId = ++searchRequestRef.current;
      setLoading(true);
      setLoadingFailed(false);

      try {
        const result = await searchUploads(term, filter);
        if (!isMountedRef.current || searchRequestRef.current !== reqId) return;
        setClaims(Array.isArray(result?.claims) ? result.claims : []);
      } catch {
        if (!isMountedRef.current || searchRequestRef.current !== reqId) return;
        setClaims([]);
        setLoadingFailed(true);
      } finally {
        if (isMountedRef.current && searchRequestRef.current === reqId) {
          setLoading(false);
        }
      }
    },
    [searchUploads]
  );

  React.useEffect(() => {
    runSearch(trimmedTerm, activeFilter);
  }, [trimmedTerm, activeFilter, runSearch]);

  // Client-side title filter for very short terms (1-2 chars) in 'all' mode
  const filteredClaims = React.useMemo(() => {
    if (activeFilter === 'all' && trimmedTerm.length > 0 && trimmedTerm.length < 3) {
      const lower = trimmedTerm.toLowerCase();
      return claims.filter((c) => (c?.value?.title || c?.name || '').toLowerCase().includes(lower));
    }
    return claims;
  }, [claims, trimmedTerm, activeFilter]);

  const visibleClaims = React.useMemo(() => filteredClaims.slice(0, MAX_VISIBLE_RESULTS), [filteredClaims]);
  const fieldAvailability = React.useMemo(() => getFieldAvailabilityForClaim(selectedClaim), [selectedClaim]);

  function toggleField(key: string) {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleResultKeyDown(e: SyntheticKeyboardEvent<HTMLDivElement>, claim: StreamClaim) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedClaim(claim);
    }
  }

  const selectedAvailableFields = React.useMemo(
    () => COPYABLE_FIELDS.filter((field) => selectedFields[field.key] && fieldAvailability[field.key]),
    [selectedFields, fieldAvailability]
  );

  const fieldsThatWouldOverwrite = React.useMemo(
    () =>
      selectedAvailableFields.filter(
        (field) =>
          hasExistingValueForField(field.key, publishFormValues) &&
          fieldWouldChangeValue(field.key, selectedClaim, publishFormValues)
      ),
    [selectedAvailableFields, selectedClaim, publishFormValues]
  );

  const fieldsToApply = React.useMemo(
    () => selectedAvailableFields.filter((field) => fieldWouldChangeValue(field.key, selectedClaim, publishFormValues)),
    [selectedAvailableFields, selectedClaim, publishFormValues]
  );

  const hasFieldSelected = fieldsToApply.length > 0;

  function applyCopy(fields: Array<{ key: string, label: string }>) {
    if (!selectedClaim || fields.length === 0) return;

    const fieldKeys = fields.map((field) => field.key);
    const undoData = getUndoDataForFields(fieldKeys, publishFormValues);
    doPopulatePublishFormFromClaim(selectedClaim, fieldKeys);

    doToast({
      message: __('Copied %count% field(s).', { count: fieldKeys.length }),
      actionText: __('Undo'),
      action: () => updatePublishForm(undoData),
    });
    doHideModal();
  }

  function handleCopy() {
    if (!selectedClaim) return;
    if (fieldsToApply.length === 0) {
      doToast({
        message: __('Selected fields already match the current form values.'),
        isError: true,
      });
      return;
    }

    const overwriteFieldLabels = fieldsThatWouldOverwrite.map((field) => field.label);

    if (overwriteFieldLabels.length > 0) {
      doOpenModal(MODALS.CONFIRM, {
        title: __('Replace existing metadata?'),
        subtitle: __('The selected upload will replace %count% existing field(s) in this form.', {
          count: overwriteFieldLabels.length,
        }),
        body: (
          <ul className="copy-from-upload__overwrite-list">
            {overwriteFieldLabels.map((fieldLabel) => (
              <li key={fieldLabel}>{__(fieldLabel)}</li>
            ))}
          </ul>
        ),
        labelOk: __('Replace Fields'),
        onConfirm: () => {
          applyCopy(fieldsToApply);
        },
      });
      return;
    }

    applyCopy(fieldsToApply);
  }

  // --- Step 1: Search & Select ---
  const renderSearchStep = () => (
    <div className="copy-from-upload__search-step">
      <div className="copy-from-upload__controls">
        <div className="copy-from-upload__filters">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              button="alt"
              label={__(f.label)}
              onClick={() => setActiveFilter(f.key)}
              className={classnames('button-toggle', {
                'button-toggle--active': activeFilter === f.key,
              })}
            />
          ))}
        </div>
        <div className="copy-from-upload__search-field">
          <FormField
            type="text"
            name="copy_from_upload_search"
            className="copy-from-upload__search-input"
            placeholder={__('Search by title...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <p className="copy-from-upload__result-hint">
        {__('Recent uploads are shown first by release date (up to 100).')}
      </p>
      {activeFilter === 'all' && trimmedTerm.length > 0 && trimmedTerm.length < 3 && (
        <p className="copy-from-upload__result-hint">{__('Type at least 3 characters to search.')}</p>
      )}
      <div className="copy-from-upload__results">
        {loading ? (
          <div className="main--empty">
            <Spinner />
          </div>
        ) : loadingFailed ? (
          <div className="main--empty">
            <p>{__('Something went wrong. Please try again.')}</p>
            <Button button="link" label={__('Retry')} onClick={() => runSearch(trimmedTerm, activeFilter)} />
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="main--empty">
            {activeFilter === 'unlisted'
              ? __('No unlisted uploads found')
              : activeFilter === 'scheduled'
              ? __('No scheduled uploads found')
              : __('No uploads found')}
          </div>
        ) : (
          visibleClaims.map((claim) => {
            const copySummary = getCopySummaryForClaim(claim);
            return (
              <div
                key={claim.claim_id}
                className="copy-from-upload__result-item"
                onClick={() => setSelectedClaim(claim)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleResultKeyDown(e, claim)}
              >
                <div className="copy-from-upload__result-main">
                  <ClaimPreview
                    uri={claim.permanent_url || claim.canonical_url}
                    type="small"
                    nonClickable
                    hideActions
                    hideMenu
                    properties={false}
                  />
                </div>
                <div className="copy-from-upload__result-copy-meta">
                  <div className="copy-from-upload__chip-row">
                    {copySummary.fieldChips.length > 0 ? (
                      copySummary.fieldChips.map((fieldLabel) => (
                        <span
                          key={`${claim.claim_id}:${fieldLabel}`}
                          className="copy-from-upload__chip copy-from-upload__chip--field"
                        >
                          {__(fieldLabel)}
                        </span>
                      ))
                    ) : (
                      <span className="copy-from-upload__chip copy-from-upload__chip--muted">
                        {__('No copyable fields found')}
                      </span>
                    )}
                    {copySummary.hiddenFieldCount > 0 && (
                      <span className="copy-from-upload__chip copy-from-upload__chip--muted">
                        {__('+%count% more', { count: copySummary.hiddenFieldCount })}
                      </span>
                    )}
                  </div>
                  {copySummary.detailChips.length > 0 && (
                    <div className="copy-from-upload__chip-row copy-from-upload__chip-row--detail">
                      {copySummary.detailChips.map((detailLabel, index) => (
                        <span
                          key={`${claim.claim_id}:detail:${index}`}
                          className="copy-from-upload__chip copy-from-upload__chip--detail"
                        >
                          {detailLabel}
                        </span>
                      ))}
                      {copySummary.hiddenDetailCount > 0 && (
                        <span className="copy-from-upload__chip copy-from-upload__chip--muted">
                          {__('+%count% more', { count: copySummary.hiddenDetailCount })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {filteredClaims.length > MAX_VISIBLE_RESULTS && (
        <p className="copy-from-upload__result-hint">
          {__('Showing %shown% of %total% results. Refine your search to see more.', {
            shown: MAX_VISIBLE_RESULTS,
            total: filteredClaims.length,
          })}
        </p>
      )}
    </div>
  );

  // --- Step 2: Field Selection ---
  const renderFieldStep = () => {
    const claimTitle = selectedClaim?.value?.title || selectedClaim?.name || __('Untitled');
    const availableFieldCount = COPYABLE_FIELDS.filter((field) => fieldAvailability[field.key]).length;
    const overwriteCount = fieldsThatWouldOverwrite.length;

    return (
      <div className="copy-from-upload__field-step">
        <div className="copy-from-upload__selected-claim">
          <Button
            button="link"
            icon={ICONS.ARROW_LEFT}
            label={__('Back to search')}
            onClick={() => setSelectedClaim(null)}
          />
          <div className="copy-from-upload__selected-preview">
            <ClaimPreview
              uri={selectedClaim?.permanent_url || selectedClaim?.canonical_url}
              type="small"
              nonClickable
              hideActions
              hideMenu
              properties={false}
            />
          </div>
        </div>
        <div className="copy-from-upload__field-list">
          <label className="copy-from-upload__field-label">
            {__('Select fields to copy from "%title%":', { title: claimTitle })}
          </label>
          <p className="copy-from-upload__field-hint">
            {__('Unavailable fields are grayed out because they are not set on the selected upload.')}
          </p>
          {overwriteCount > 0 && (
            <p className="copy-from-upload__field-hint">
              {__('%count% selected field(s) will replace existing values.', { count: overwriteCount })}
            </p>
          )}
          {availableFieldCount === 0 && (
            <p className="copy-from-upload__field-hint">{__('No copyable metadata found on this upload.')}</p>
          )}
          {COPYABLE_FIELDS.map((field) => (
            // Disable no-op options so users only pick fields that actually exist on the source claim.
            <FormField
              key={field.key}
              type="checkbox"
              name={`copy_field_${field.key}`}
              label={__(field.label)}
              checked={Boolean(selectedFields[field.key] && fieldAvailability[field.key])}
              disabled={!fieldAvailability[field.key]}
              onChange={() => fieldAvailability[field.key] && toggleField(field.key)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen type="custom" width="wide" className="copy-from-upload-modal" onAborted={doHideModal}>
      <Card
        title={selectedClaim ? __('Select Fields to Copy') : __('Copy from Previous Upload')}
        subtitle={
          selectedClaim
            ? __('Choose which fields to copy to your current upload.')
            : __('Search and select one of your previous uploads to copy its details.')
        }
        body={selectedClaim ? renderFieldStep() : renderSearchStep()}
        actions={
          <div className="section__actions">
            {selectedClaim ? (
              <>
                <Button
                  button="primary"
                  label={__('Copy Selected Fields')}
                  onClick={handleCopy}
                  disabled={!hasFieldSelected}
                />
                <Button button="link" label={__('Back')} onClick={() => setSelectedClaim(null)} />
              </>
            ) : (
              <Button button="link" label={__('Cancel')} onClick={doHideModal} />
            )}
          </div>
        }
      />
    </Modal>
  );
}
