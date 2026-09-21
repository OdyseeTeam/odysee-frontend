import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Lbryio } from 'lbryinc';
import analytics from 'analytics';
import Button from 'component/button';
import Card from 'component/common/card';
import Page from 'component/page';
import Spinner from 'component/spinner';
import ErrorText from 'component/common/error-text';
import { Form, FormField } from 'component/common/form';
import { doToast } from 'redux/actions/notifications';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectUser, selectUserEmail } from 'redux/selectors/user';
import { FF_MAX_CHARS_DEFAULT } from 'constants/form-field';
import { EMAIL_REGEX } from 'constants/email';
import { THUMBNAIL_CDN_SIZE_LIMIT_BYTES, SITE_HELP_EMAIL } from 'config';
import * as ISSUE from 'constants/report_issue';
import * as ICONS from 'constants/icons';
import {
  buildReportMessage,
  buildReportTags,
  buildReportTitle,
  capped,
  collectDiagnostics,
  formatPlayerTimestamp,
  isValidLink,
  isValidTimestamp,
  normalizeLink,
  uploadScreenshot,
} from './helpers';

const DEFAULT_AREA = ISSUE.AREA_OTHER;

function CheckboxGrid(props: {
  name: string;
  options: Array<string>;
  selected: Array<string>;
  onToggle: (value: string) => void;
}) {
  const { name, options, selected, onToggle } = props;

  return (
    <div className="report-issue__options">
      {options.map((option) => (
        <FormField
          key={option}
          type="checkbox"
          name={`${name}--${option.replace(/\s+/g, '-').toLowerCase()}`}
          label={__(option)}
          checked={selected.includes(option)}
          onChange={() => onToggle(option)}
        />
      ))}
    </div>
  );
}

export default function ReportPage() {
  const dispatch = useAppDispatch();
  const { search } = useLocation();
  const user = useAppSelector(selectUser);
  const userEmail = useAppSelector(selectUserEmail);

  const urlParams = useMemo(() => new URLSearchParams(search), [search]);

  const [kind, setKind] = useState<string>(ISSUE.KIND_PROBLEM);
  const [areaId, setAreaId] = useState<string>(urlParams.get('area') || DEFAULT_AREA);
  const [link, setLink] = useState<string>(urlParams.get('url') || '');
  const [timestamp, setTimestamp] = useState<string>('');
  const [symptoms, setSymptoms] = useState<Array<string>>([]);
  const [frequency, setFrequency] = useState<string>('');
  const [scope, setScope] = useState<string>('');
  const [started, setStarted] = useState<string>(ISSUE.STARTED_UNKNOWN);
  const [alreadyTried, setAlreadyTried] = useState<Array<string>>([]);
  const [description, setDescription] = useState<string>('');
  const [mediaLink, setMediaLink] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState<boolean>(true);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fileInput = useRef<HTMLInputElement>(null);

  const area = ISSUE.getArea(areaId) || ISSUE.getArea(DEFAULT_AREA);
  const isProblem = kind === ISSUE.KIND_PROBLEM;
  const isEmailChange = kind === ISSUE.KIND_EMAIL_CHANGE;
  const diagnostics = useMemo(() => collectDiagnostics(user && user.id), [user]);

  // Prefill the reply address from the account, but let the reporter change it
  // (they may be reporting exactly because they lost access to that inbox).
  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
      setCurrentEmail(userEmail);
    }
  }, [userEmail]);

  // If a player is mounted (i.e. they hit the form from a floating/embedded
  // video), grab where they were -- that is the timestamp support needs.
  useEffect(() => {
    if (window.player && typeof window.player.currentTime === 'function') {
      const seconds = window.player.currentTime();
      if (seconds > 0) setTimestamp(formatPlayerTimestamp(seconds));
    }
  }, []);

  const toggleIn = useCallback(
    (setter: (fn: (prev: Array<string>) => Array<string>) => void) => (value: string) =>
      setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value])),
    []
  );

  const toggleSymptom = useMemo(() => toggleIn(setSymptoms), [toggleIn]);
  const toggleAlreadyTried = useMemo(() => toggleIn(setAlreadyTried), [toggleIn]);

  // Symptom lists are per-area, so a stale selection would be nonsense.
  const handleAreaChange = useCallback((nextAreaId: string) => {
    setAreaId(nextAreaId);
    setSymptoms([]);
  }, []);

  const handleFileChosen = useCallback(() => {
    const file = fileInput.current?.files?.[0];
    if (!file) return;

    setUploadError('');

    const sizeLimit = Number(THUMBNAIL_CDN_SIZE_LIMIT_BYTES);

    if (sizeLimit && file.size >= sizeLimit) {
      const maxSizeMB = sizeLimit / (1024 * 1024);
      setUploadError(__('Image must be smaller than %max_size%MB.', { max_size: maxSizeMB }));
      if (fileInput.current) fileInput.current.value = '';
      return;
    }

    setIsUploading(true);
    uploadScreenshot(file)
      .then((url) => {
        setScreenshotUrl(url);
        setScreenshotName(file.name);
      })
      .catch((err) => setUploadError(err.message || __('The image could not be uploaded. Try a different file.')))
      .finally(() => {
        setIsUploading(false);
        if (fileInput.current) fileInput.current.value = '';
      });
  }, []);

  const removeScreenshot = useCallback(() => {
    setScreenshotUrl('');
    setScreenshotName('');
    setUploadError('');
  }, []);

  // Clears the answers but keeps the reply address -- someone filing a second
  // report is almost always the same person reachable at the same place.
  const resetForm = useCallback(() => {
    setKind(ISSUE.KIND_PROBLEM);
    setAreaId(DEFAULT_AREA);
    setLink('');
    setTimestamp('');
    setSymptoms([]);
    setFrequency('');
    setScope('');
    setStarted(ISSUE.STARTED_UNKNOWN);
    setAlreadyTried([]);
    setDescription('');
    setMediaLink('');
    setScreenshotUrl('');
    setScreenshotName('');
    setUploadError('');
    setNewEmail('');
    setError('');
    setHasSubmitted(false);
  }, []);

  const linkIsRequired = isProblem && area?.linkMode === ISSUE.LINK_REQUIRED;
  const linkIsShown = !isEmailChange && area?.linkMode !== ISSUE.LINK_HIDDEN;
  const linkError = link !== '' && !isValidLink(link);
  const mediaLinkError = mediaLink !== '' && !isValidLink(mediaLink);
  const timestampError = timestamp !== '' && !isValidTimestamp(timestamp);
  const emailError = email !== '' && !EMAIL_REGEX.test(email);

  const currentEmailError = currentEmail !== '' && !EMAIL_REGEX.test(currentEmail);
  const newEmailError = newEmail !== '' && !EMAIL_REGEX.test(newEmail);
  const sameEmailError = newEmail !== '' && newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase();

  // An email-change request carries its payload in the two address fields, so a
  // written description is optional there -- everywhere else it is the report.
  const descriptionTooShort = !isEmailChange && description.trim().length < ISSUE.MIN_DESCRIPTION_LENGTH;

  const emailChangeIncomplete =
    isEmailChange && (!currentEmail.trim() || !newEmail.trim() || currentEmailError || newEmailError || sameEmailError);

  const canSubmit =
    !isSubmitting &&
    !isUploading &&
    !descriptionTooShort &&
    !emailChangeIncomplete &&
    (!linkIsShown || !linkError) &&
    !mediaLinkError &&
    (!isProblem || !area?.allowTimestamp || !timestampError) &&
    (isEmailChange || !emailError) &&
    (!linkIsRequired || link.trim() !== '');

  const submitReport = useCallback(() => {
    if (!canSubmit || !area) return;

    const payload = {
      kind,
      area: isEmailChange ? ISSUE.AREA_ACCOUNT : area.id,
      areaLabel: isEmailChange ? '' : area.label,
      symptoms: isProblem ? symptoms : [],
      frequency: isProblem ? frequency : '',
      scope: isProblem ? scope : '',
      started: isProblem ? started : '',
      alreadyTried: isProblem ? alreadyTried : [],
      link: linkIsShown ? normalizeLink(link) : '',
      timestamp: isProblem && area.allowTimestamp ? timestamp.trim() : '',
      description: description.trim(),
      screenshotUrl,
      recordingUrl: normalizeLink(mediaLink),
      // The reply address for an email change is the address being changed
      // from -- that is the one support has to verify against.
      email: isEmailChange ? currentEmail.trim() : email.trim(),
      currentEmail: isEmailChange ? currentEmail.trim() : '',
      newEmail: isEmailChange ? newEmail.trim() : '',
      diagnostics: includeDiagnostics ? diagnostics : [],
    };

    const message = buildReportMessage(payload);

    setError('');
    setIsSubmitting(true);

    analytics.log(buildReportTitle(payload), {
      level: 'info',
      tags: buildReportTags(payload),
    });

    Lbryio.call('event', 'desktop_error', { error_message: message })
      .then(() => {
        setHasSubmitted(true);
        dispatch(doToast({ message: __('Report received! Thanks for helping.') }));
      })
      .catch(() => {
        // Keep every answer on screen -- retyping a long report because the
        // network blipped is exactly the frustration this form is meant to fix.
        setError(__('Your report could not be sent. Check your connection and try again.'));
      })
      .finally(() => setIsSubmitting(false));
  }, [
    canSubmit,
    area,
    kind,
    isProblem,
    isEmailChange,
    linkIsShown,
    currentEmail,
    newEmail,
    symptoms,
    frequency,
    scope,
    started,
    alreadyTried,
    link,
    timestamp,
    description,
    screenshotUrl,
    mediaLink,
    email,
    includeDiagnostics,
    diagnostics,
    dispatch,
  ]);

  if (hasSubmitted) {
    return (
      <Page className="card-stack">
        <Card
          title={isEmailChange ? __('Email change requested') : __('Report sent')}
          subtitle={
            isEmailChange
              ? __('We process these manually and will reply to %email% once it is done.', { email: currentEmail })
              : email
                ? __(
                    'Thanks for the detail — it helps us fix things faster. If we need anything else we will reply to %email%.',
                    { email }
                  )
                : __('Thanks for the detail — it helps us fix things faster.')
          }
          actions={
            <div className="section__actions">
              <Button button="primary" label={__('Send another report')} onClick={resetForm} />
              <Button button="link" label={__('Back to Help')} navigate="/$/help" />
            </div>
          }
        />
      </Page>
    );
  }

  return (
    <Page className="card-stack">
      <Form onSubmit={submitReport}>
        <Card
          title={__('Get help or send feedback')}
          subtitle={__(
            'The more you can tell us here, the more likely we are to solve it without having to email you back for details.'
          )}
          actions={
            <div className="report-issue">
              {/* ---------- What kind of report ---------- */}
              <div className="report-issue__section">
                <fieldset className="report-issue__group" aria-label={__('Get help or send feedback')}>
                  <div className="report-issue__options report-issue__options--inline">
                    <FormField
                      type="radio"
                      name="report_kind_problem"
                      groupName="report_kind"
                      label={__('Report a problem')}
                      checked={isProblem}
                      onChange={() => setKind(ISSUE.KIND_PROBLEM)}
                    />
                    <FormField
                      type="radio"
                      name="report_kind_feature"
                      groupName="report_kind"
                      label={__('Request a feature')}
                      checked={kind === ISSUE.KIND_FEATURE}
                      onChange={() => setKind(ISSUE.KIND_FEATURE)}
                    />
                    <FormField
                      type="radio"
                      name="report_kind_email"
                      groupName="report_kind"
                      label={__('Change my email address')}
                      checked={isEmailChange}
                      onChange={() => setKind(ISSUE.KIND_EMAIL_CHANGE)}
                    />
                  </div>
                </fieldset>
              </div>

              {/* ---------- Email change ---------- */}
              {isEmailChange && (
                <div className="report-issue__section">
                  <p className="report-issue__note">
                    {__(
                      'Email changes are processed manually. Send this from the account you want to change, or we will need to verify ownership another way.'
                    )}
                  </p>
                  <FormField
                    type="email"
                    name="report_current_email"
                    label={__('Current email address')}
                    placeholder={__('e.g. john@example.com')}
                    value={currentEmail}
                    error={currentEmailError ? __('Enter a valid email address') : ''}
                    onChange={(e: any) => setCurrentEmail(capped(e.target.value, ISSUE.MAX_EMAIL_LENGTH))}
                  />
                  <FormField
                    type="email"
                    name="report_new_email"
                    label={__('New email address')}
                    placeholder={__('e.g. john@newdomain.com')}
                    value={newEmail}
                    error={
                      newEmailError
                        ? __('Enter a valid email address')
                        : sameEmailError
                          ? __('The new address must be different from the current one')
                          : ''
                    }
                    onChange={(e: any) => setNewEmail(capped(e.target.value, ISSUE.MAX_EMAIL_LENGTH))}
                  />
                </div>
              )}

              {/* ---------- Area ---------- */}
              {!isEmailChange && (
                <div className="report-issue__section">
                  <FormField
                    type="select"
                    name="report_area"
                    label={isProblem ? __('What is this about?') : __('Which part of Odysee?')}
                    value={areaId}
                    onChange={(e: any) => handleAreaChange(e.target.value)}
                  >
                    {ISSUE.AREAS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {__(option.label)}
                      </option>
                    ))}
                  </FormField>

                  {/* ---------- Link + timestamp ---------- */}
                  {linkIsShown && area && (
                    <>
                      <FormField
                        type="text"
                        name="report_link"
                        label={
                          linkIsRequired
                            ? __(area.linkLabel || 'Link')
                            : `${__(area.linkLabel || 'Link')} ${__('(optional)')}`
                        }
                        placeholder={area.linkPlaceholder}
                        value={link}
                        error={linkError ? __('That does not look like a valid link') : ''}
                        onChange={(e: any) => setLink(capped(e.target.value, ISSUE.MAX_LINK_LENGTH))}
                      />

                      {isProblem && area.allowTimestamp && (
                        <FormField
                          type="text"
                          name="report_timestamp"
                          label={__('Timestamp where it happens (optional)')}
                          placeholder={'00:04:12'}
                          value={timestamp}
                          error={timestampError ? __('Use mm:ss or hh:mm:ss') : ''}
                          onChange={(e: any) => setTimestamp(capped(e.target.value, 8))}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ---------- Symptoms ---------- */}
              {isProblem && area && area.symptoms.length > 0 && (
                <div className="report-issue__section">
                  <fieldset className="report-issue__group">
                    <legend className="report-issue__legend">{__('What is happening?')}</legend>
                    <span className="report-issue__hint">{__('Check all that apply.')}</span>
                    <CheckboxGrid name="symptom" options={area.symptoms} selected={symptoms} onToggle={toggleSymptom} />
                  </fieldset>
                </div>
              )}

              {/* ---------- Reproducibility ---------- */}
              {isProblem && (
                <div className="report-issue__section">
                  <fieldset className="report-issue__group">
                    <legend className="report-issue__legend">{__('How often does it happen?')}</legend>
                    <div className="report-issue__options report-issue__options--inline">
                      {ISSUE.FREQUENCIES.map((option) => (
                        <FormField
                          key={option}
                          type="radio"
                          name={`report_frequency--${option.replace(/\s+/g, '-').toLowerCase()}`}
                          groupName="report_frequency"
                          label={__(option)}
                          checked={frequency === option}
                          onChange={() => setFrequency(option)}
                        />
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="report-issue__group">
                    <legend className="report-issue__legend">{__('Where does it happen?')}</legend>
                    <div className="report-issue__options report-issue__options--inline">
                      {ISSUE.SCOPES.map((option) => (
                        <FormField
                          key={option}
                          type="radio"
                          name={`report_scope--${option.replace(/\s+/g, '-').toLowerCase()}`}
                          groupName="report_scope"
                          label={__(option)}
                          checked={scope === option}
                          onChange={() => setScope(option)}
                        />
                      ))}
                    </div>
                  </fieldset>

                  <FormField
                    type="select"
                    name="report_started"
                    label={__('When did it start?')}
                    value={started}
                    onChange={(e: any) => setStarted(e.target.value)}
                  >
                    <option value={ISSUE.STARTED_UNKNOWN}>{__('Not sure')}</option>
                    {ISSUE.STARTED_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {__(option)}
                      </option>
                    ))}
                  </FormField>

                  {/* ---------- Already tried ---------- */}
                  <fieldset className="report-issue__group">
                    <legend className="report-issue__legend">{__('Have you already tried any of these?')}</legend>
                    <span className="report-issue__hint">
                      {__('Telling us saves a round-trip email asking you to try them.')}
                    </span>
                    <CheckboxGrid
                      name="tried"
                      options={ISSUE.ALREADY_TRIED_OPTIONS}
                      selected={alreadyTried}
                      onToggle={toggleAlreadyTried}
                    />
                  </fieldset>
                </div>
              )}

              {/* ---------- Description ---------- */}
              <div className="report-issue__section">
                <FormField
                  type="textarea"
                  name="report_description"
                  rows="6"
                  stretch
                  hideSuggestions
                  label={
                    isEmailChange
                      ? __('Anything else we should know? (optional)')
                      : isProblem
                        ? __('Describe what happened')
                        : __('Describe what you would like to see')
                  }
                  placeholder={
                    isEmailChange
                      ? __('Any context that helps us verify the account is yours.')
                      : isProblem
                        ? __(
                            'What did you expect to happen, and what happened instead? Steps to reproduce it help a lot.'
                          )
                        : __('What should it do, and what problem would it solve for you?')
                  }
                  value={description}
                  charCount={description.length}
                  textAreaMaxLength={FF_MAX_CHARS_DEFAULT}
                  onChange={(e: any) => setDescription(e.target.value)}
                />
              </div>

              {/* ---------- Attachments ---------- */}
              <div className="report-issue__section">
                <fieldset className="report-issue__group">
                  <legend className="report-issue__legend">{__('Screenshot or recording')}</legend>
                  <span className="report-issue__hint">
                    {__('Optional, but it often replaces a whole email thread.')}
                  </span>

                  {screenshotUrl ? (
                    <div className="report-issue__attachment">
                      <img src={screenshotUrl} alt={screenshotName} className="report-issue__attachment-preview" />
                      <div className="report-issue__attachment-meta">
                        <span>{screenshotName}</span>
                        <Button button="link" label={__('Remove')} onClick={removeScreenshot} />
                      </div>
                    </div>
                  ) : (
                    <div className="report-issue__upload">
                      <Button
                        button="secondary"
                        icon={ICONS.IMAGE}
                        disabled={isUploading}
                        label={isUploading ? __('Uploading...') : __('Choose an image')}
                        onClick={() => fileInput.current?.click()}
                      />
                      {isUploading && <Spinner type="small" />}
                      <input
                        type="file"
                        ref={fileInput}
                        style={{ display: 'none' }}
                        accept={ISSUE.SCREENSHOT_ACCEPT}
                        onChange={handleFileChosen}
                      />
                    </div>
                  )}
                  {uploadError && <ErrorText>{uploadError}</ErrorText>}

                  <FormField
                    type="text"
                    name="report_media_link"
                    label={__('Or paste a link to a recording (optional)')}
                    placeholder={'odysee.com/@channel/video'}
                    value={mediaLink}
                    error={mediaLinkError ? __('That does not look like a valid link') : ''}
                    onChange={(e: any) => setMediaLink(capped(e.target.value, ISSUE.MAX_LINK_LENGTH))}
                  />
                </fieldset>
              </div>

              {/* ---------- Contact + diagnostics ---------- */}
              <div className="report-issue__section">
                {!isEmailChange && (
                  <FormField
                    type="email"
                    name="report_email"
                    label={__('Email, so we can reply with a fix (optional)')}
                    placeholder={__('e.g. john@example.com')}
                    value={email}
                    error={emailError ? __('Enter a valid email address') : ''}
                    onChange={(e: any) => setEmail(capped(e.target.value, ISSUE.MAX_EMAIL_LENGTH))}
                  />
                )}

                <FormField
                  type="checkbox"
                  name="report_include_diagnostics"
                  label={__('Include technical details about my browser')}
                  checked={includeDiagnostics}
                  onChange={() => setIncludeDiagnostics(!includeDiagnostics)}
                />
                {includeDiagnostics && (
                  <>
                    <Button
                      button="link"
                      className="report-issue__disclosure"
                      label={showDiagnostics ? __('Hide what will be sent') : __('See exactly what will be sent')}
                      onClick={() => setShowDiagnostics(!showDiagnostics)}
                    />
                    {showDiagnostics && (
                      <ul className="report-issue__diagnostics">
                        {diagnostics.map(({ label, value }) => (
                          <li key={label}>
                            <span className="report-issue__diagnostics-label">{label}</span>
                            <span className="report-issue__diagnostics-value">{value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              {/* ---------- Submit ---------- */}
              <div className="section__actions report-issue__actions">
                <Button
                  button="primary"
                  disabled={!canSubmit}
                  label={
                    isSubmitting
                      ? __('Submitting...')
                      : isEmailChange
                        ? __('Request Email Change')
                        : __('Submit Report')
                  }
                  onClick={submitReport}
                />
              </div>

              {descriptionTooShort && description.length > 0 && (
                <p className="help">{__('Please add a little more detail so we can act on it.')}</p>
              )}
              {linkIsRequired && !link.trim() && (
                <p className="help">{__('A link is required so we can look at the exact video.')}</p>
              )}
              {isEmailChange && !newEmail && (
                <p className="help">{__('Enter the address you would like to switch to.')}</p>
              )}
              {error && (
                <div className="error__wrapper--no-overflow">
                  <ErrorText>{error}</ErrorText>
                </div>
              )}
            </div>
          }
        />
      </Form>

      <Card
        title={__('Developer? Or looking for more?')}
        actions={
          <div dir="auto" className="markdown-preview">
            <p>{__('You can also:')}</p>
            <ul>
              <li>
                <Button
                  button="link"
                  href="https://github.com/OdyseeTeam/odysee-frontend/issues"
                  label={__('Submit an issue on GitHub')}
                />
                .
              </li>
              <li>
                <Button button="link" href={`mailto:${SITE_HELP_EMAIL}`} label={__('Email support directly')} />.
              </li>
            </ul>
          </div>
        }
      />
    </Page>
  );
}
