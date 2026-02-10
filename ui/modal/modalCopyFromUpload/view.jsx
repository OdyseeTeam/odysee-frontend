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
];

const MAX_VISIBLE_RESULTS = 100;

type Props = {
  searchUploads: (searchTerm: string, filter: string) => Promise<{ claims: Array<StreamClaim> }>,
  doPopulatePublishFormFromClaim: (claim: StreamClaim, fields: Array<string>) => void,
  doHideModal: () => void,
};

export default function ModalCopyFromUpload(props: Props) {
  const { searchUploads, doPopulatePublishFormFromClaim, doHideModal } = props;

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

  function toggleField(key: string) {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleResultKeyDown(e: SyntheticKeyboardEvent<HTMLDivElement>, claim: StreamClaim) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedClaim(claim);
    }
  }

  function handleCopy() {
    if (!selectedClaim) return;
    const fields = Object.keys(selectedFields).filter((k) => selectedFields[k]);
    doPopulatePublishFormFromClaim(selectedClaim, fields);
    doHideModal();
  }

  const hasFieldSelected = Object.values(selectedFields).some((v) => v === true);

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
            {activeFilter === 'unlisted' ? __('No unlisted uploads found') : __('No uploads found')}
          </div>
        ) : (
          visibleClaims.map((claim) => (
            <div
              key={claim.claim_id}
              className="copy-from-upload__result-item"
              onClick={() => setSelectedClaim(claim)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleResultKeyDown(e, claim)}
            >
              <ClaimPreview
                uri={claim.permanent_url || claim.canonical_url}
                type="small"
                nonClickable
                hideActions
                properties={false}
              />
            </div>
          ))
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
              properties={false}
            />
          </div>
        </div>
        <div className="copy-from-upload__field-list">
          <label className="copy-from-upload__field-label">
            {__('Select fields to copy from "%title%":', { title: claimTitle })}
          </label>
          {COPYABLE_FIELDS.map((field) => (
            <FormField
              key={field.key}
              type="checkbox"
              name={`copy_field_${field.key}`}
              label={__(field.label)}
              checked={selectedFields[field.key]}
              onChange={() => toggleField(field.key)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen type="custom" width="wide">
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
                <Button button="link" label={__('Cancel')} onClick={doHideModal} />
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
