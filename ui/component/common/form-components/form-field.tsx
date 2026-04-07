import './plugins/inline-attachment/inline-attachment';
import './plugins/inline-attachment/textarea.inline-attachment';
import { IMG_CDN_PUBLISH_URL, JSON_RESPONSE_KEYS, UPLOAD_CONFIG } from 'constants/cdn_urls';
import { FF_MAX_CHARS_DEFAULT } from 'constants/form-field';
import { lazyImport } from 'util/lazyImport';
import React, { useRef, useState, useEffect } from 'react';
import { InputSimple, BlockWrapWrapper } from './input-simple';
import { InputSelect } from './input-select';
import { CountInfo, QuickAction, Label } from './common';

const MarkdownEditor = lazyImport(() => import('./markdown-editor'));
import { TextareaWrapper } from './slim-input-field';
// prettier-ignore
const TextareaWithSuggestions = lazyImport(() => import('component/textareaWithSuggestions'
/* webpackChunkName: "suggestions" */
));
type Props = {
  uri?: string;
  affixClass?: string;
  // class applied to prefix/postfix label
  autoFocus?: boolean;
  blockWrap?: boolean;
  charCount?: number;
  children?: React.ReactNode;
  defaultValue?: string | number;
  disabled?: boolean;
  error?: string | boolean;
  helper?: string | React.ReactNode;
  hideSuggestions?: boolean;
  inputButton?: React.ReactNode;
  isLivestream?: boolean;
  label?: any;
  labelOnLeft?: boolean;
  max?: number;
  min?: number;
  name?: string;
  placeholder?: string | number;
  postfix?: string;
  prefix?: string;
  quickActionLabel?: string;
  range?: number;
  readOnly?: boolean;
  stretch?: boolean;
  textAreaMaxLength?: number;
  type?: string;
  value?: string | number;
  slimInput?: boolean;
  slimInputButtonRef?: any;
  commentSelectorsProps?: any;
  showSelectors?: any;
  submitButtonRef?: any;
  tipModalOpen?: boolean;
  noticeLabel?: any;
  inputElem?: any;
  onSlimInputClose?: () => void;
  onChange?: (arg0: any) => any;
  setShowSelectors?: (arg0: { tab?: string; open: boolean }) => void;
  quickActionHandler?: (arg0: any) => any;
  render?: () => React.ReactNode;
  handleTip?: (isLBC: boolean) => any;
  handleSubmit?: () => any;
  hideValue?: boolean;
  [key: string]: any;
};

export function FormField(props: Props) {
  const {
    uri,
    affixClass,
    autoFocus,
    blockWrap = true,
    charCount,
    children,
    disabled,
    error,
    helper,
    hideSuggestions,
    inputButton,
    isLivestream,
    label,
    labelOnLeft = false,
    name,
    postfix,
    prefix,
    quickActionLabel,
    stretch,
    textAreaMaxLength,
    type,
    slimInput,
    slimInputButtonRef,
    commentSelectorsProps,
    showSelectors,
    submitButtonRef,
    tipModalOpen,
    noticeLabel,
    inputElem,
    onSlimInputClose,
    quickActionHandler,
    setShowSelectors,
    render,
    handleTip,
    handleSubmit,
    hideValue,
    max,
    ...inputProps
  } = props;

  const input = useRef<any>(null);
  const textareaInlineAttachmentAttached = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mdOnChange = React.useCallback(
    (value: string) => {
      const normalizedValue =
        textAreaMaxLength && value.length > textAreaMaxLength ? value.substring(0, textAreaMaxLength) : value;
      inputProps.onChange?.(normalizedValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [textAreaMaxLength, inputProps.onChange]
  );

  function maybeAttachTextareaInlineAttachment() {
    const el = input.current;
    if ((type === 'textarea' || type === 'markdown') && el && !textareaInlineAttachmentAttached.current) {
      textareaInlineAttachmentAttached.current = true;
      (window as any).inlineAttachment.editors.textarea.attach(el, {
        uploadUrl: IMG_CDN_PUBLISH_URL,
        uploadFieldName: UPLOAD_CONFIG.BLOB_KEY,
        extraParams: {
          [UPLOAD_CONFIG.ACTION_KEY]: UPLOAD_CONFIG.ACTION_VAL,
        },
        filenameTag: '{filename}',
        urlText: '![image]({filename})',
        jsonFieldName: JSON_RESPONSE_KEYS.UPLOADED_URL,
        errorText: '![image]("failed to upload file")',
      });
    }
  }

  useEffect(() => {
    const el = input.current;
    if (el && autoFocus) el.focus();
    if (slimInput && showSelectors && showSelectors.open && el) el.blur();
    maybeAttachTextareaInlineAttachment();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    maybeAttachTextareaInlineAttachment();
  });

  const errorMessage = typeof error === 'object' ? (error as any).message : error;
  const wrapperProps = { type, helper };
  const labelProps = { name, label };
  const countInfoProps = { charCount, textAreaMaxLength };
  const quickActionProps = { label: quickActionLabel, quickActionHandler };
  const inputSimpleProps = { name, label, disabled, ...inputProps };
  const inputSelectProps = { name, error, label, children, ...inputProps };

  switch (type) {
    case 'radio':
      return (
        <FormFieldWrapper {...wrapperProps}>
          <BlockWrapWrapper blockWrap={blockWrap}>
            <InputSimple {...inputSimpleProps} type="radio" />
          </BlockWrapWrapper>
        </FormFieldWrapper>
      );

    case 'checkbox':
      return (
        <FormFieldWrapper {...wrapperProps}>
          <div className="checkbox">
            <InputSimple {...inputSimpleProps} type="checkbox" />
          </div>
        </FormFieldWrapper>
      );

    case 'range':
      return (
        <FormFieldWrapper {...wrapperProps}>
          <div className="range">
            <InputSimple {...inputSimpleProps} type="range" />
          </div>
        </FormFieldWrapper>
      );

    case 'select':
      return (
        <FormFieldWrapper {...wrapperProps}>
          <InputSelect {...inputSelectProps} />
        </FormFieldWrapper>
      );

    case 'select-tiny':
      return (
        <FormFieldWrapper {...wrapperProps}>
          <InputSelect {...inputSelectProps} className="select--slim" />
        </FormFieldWrapper>
      );

    case 'markdown':
      return (
        <FormFieldWrapper {...wrapperProps}>
          <div className="form-field--SimpleMDE">
            <fieldset-section>
              <div className="form-field__two-column">
                <div>
                  <Label {...labelProps} />
                </div>

                <QuickAction {...quickActionProps} />
              </div>

              <React.Suspense fallback={<div className="form-field__loading" />}>
                <MarkdownEditor
                  {...inputProps}
                  id={name}
                  inputRef={input as React.RefObject<HTMLTextAreaElement>}
                  onChange={mdOnChange}
                />
              </React.Suspense>

              <CountInfo {...countInfoProps} />
            </fieldset-section>
          </div>
        </FormFieldWrapper>
      );

    case 'textarea': {
      const closeSelector =
        setShowSelectors && showSelectors
          ? () =>
              setShowSelectors({
                tab: showSelectors.tab || undefined,
                open: false,
              })
          : () => {};
      const textAreaValue =
        inputProps.value && typeof inputProps.value === 'string' && max && inputProps.value.length > max
          ? inputProps.value.substring(0, max)
          : inputProps.value;
      return (
        <FormFieldWrapper {...wrapperProps}>
          <fieldset-section>
            <TextareaWrapper
              isDrawerOpen={Boolean(drawerOpen)}
              toggleDrawer={() => setDrawerOpen(!drawerOpen)}
              closeSelector={closeSelector}
              commentSelectorsProps={commentSelectorsProps}
              showSelectors={Boolean(showSelectors && showSelectors.open)}
              slimInput={slimInput}
              slimInputButtonRef={slimInputButtonRef}
              onSlimInputClose={onSlimInputClose}
              tipModalOpen={tipModalOpen}
            >
              {(!slimInput || drawerOpen) && label && (
                <div className="form-field__two-column">
                  <Label {...labelProps} />

                  {max && typeof textAreaValue === 'string' && (
                    <label
                      className={
                        Number(max) - String(textAreaValue).length > 0 ? 'input-max-counter' : 'input-max-counter-error'
                      }
                    >
                      {Number(max) - String(textAreaValue).length}
                    </label>
                  )}

                  <QuickAction {...quickActionProps} />

                  <CountInfo {...countInfoProps} />
                </div>
              )}

              {noticeLabel}

              {hideSuggestions ? (
                <textarea
                  {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                  id={name}
                  maxLength={max || textAreaMaxLength || FF_MAX_CHARS_DEFAULT}
                  ref={input}
                  value={textAreaValue}
                />
              ) : (
                <React.Suspense fallback={null}>
                  <TextareaWithSuggestions
                    {...(inputProps as any)}
                    spellCheck
                    uri={uri}
                    type={type}
                    id={name}
                    maxLength={max || textAreaMaxLength || FF_MAX_CHARS_DEFAULT}
                    value={textAreaValue}
                    inputRef={input}
                    isLivestream={isLivestream}
                    toggleSelectors={
                      setShowSelectors && showSelectors
                        ? () => {
                            const el = input.current;
                            if (!showSelectors.open && el) el.blur();
                            setShowSelectors({
                              tab: showSelectors.tab || undefined,
                              open: !showSelectors.open,
                            });
                          }
                        : undefined
                    }
                    handleTip={handleTip}
                    handleSubmit={() => {
                      if (handleSubmit) handleSubmit();
                      if (slimInput) setDrawerOpen(false);
                      closeSelector();
                    }}
                    claimIsMine={commentSelectorsProps && commentSelectorsProps.claimIsMine}
                    slimInput={slimInput}
                    handlePreventClick={!drawerOpen ? () => setDrawerOpen(true) : undefined}
                    autoFocus={drawerOpen && (!showSelectors || !showSelectors.open)}
                    submitButtonRef={submitButtonRef}
                  />
                </React.Suspense>
              )}
            </TextareaWrapper>
          </fieldset-section>
        </FormFieldWrapper>
      );
    }

    default: {
      const { range: _range, ...restInputProps } = inputProps;
      const inputElementProps = {
        type,
        name,
        disabled,
        maxLength: max,
        ref: input,
        ...restInputProps,
      } as React.InputHTMLAttributes<HTMLInputElement> & { ref: React.MutableRefObject<any> };
      return (
        <FormFieldWrapper {...wrapperProps}>
          <fieldset-section>
            {(label || errorMessage) && (
              <div>
                <Label {...labelProps} errorMessage={errorMessage} />
                {inputElementProps.maxLength && typeof inputElementProps.value === 'string' && (
                  <label
                    className={
                      Number(inputElementProps.maxLength) - String(inputElementProps.value).length > 0
                        ? 'input-max-counter'
                        : 'input-max-counter-error'
                    }
                  >
                    {Number(inputElementProps.maxLength) - String(inputElementProps.value).length}
                  </label>
                )}
              </div>
            )}

            {inputButton ? (
              <input-submit>
                {!hideValue && <input {...inputElementProps} />}
                {inputButton}
              </input-submit>
            ) : inputElem || !prefix ? (
              <input {...inputElementProps} />
            ) : (
              <div className="arInput-wrapper">
                <span>{prefix}</span>
                <input {...inputElementProps} />
              </div>
            )}
          </fieldset-section>
        </FormFieldWrapper>
      );
    }
  }
}
export default FormField;
type WrapperProps = {
  type?: string;
  children?: any;
  helper?: any;
};

const FormFieldWrapper = (wrapperProps: WrapperProps) => {
  const { type, children, helper } = wrapperProps;
  return (
    <>
      {type && children}
      {helper && <div className="form-field__help">{helper}</div>}
    </>
  );
};
