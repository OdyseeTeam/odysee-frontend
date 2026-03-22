import './plugins/inline-attachment/inline-attachment';
import './plugins/inline-attachment/textarea.inline-attachment';
import { IMG_CDN_PUBLISH_URL, JSON_RESPONSE_KEYS, UPLOAD_CONFIG } from 'constants/cdn_urls';
import { FF_MAX_CHARS_DEFAULT } from 'constants/form-field';
import { lazyImport } from 'util/lazyImport';
import React from 'react';
import type { ElementRef } from 'react';
import { InputSimple, BlockWrapWrapper } from './input-simple';
import { InputSelect } from './input-select';
import MarkdownEditor from './markdown-editor';
import { CountInfo, QuickAction, Label } from './common';
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
  blockWrap: boolean;
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
  labelOnLeft: boolean;
  max?: number;
  min?: number;
  name: string;
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
};
type State = {
  drawerOpen: boolean;
};
export class FormField extends React.PureComponent<Props, State> {
  static defaultProps = {
    labelOnLeft: false,
    blockWrap: true,
  };
  input: {
    current: ElementRef<any>;
  };
  textareaInlineAttachmentAttached: boolean | null | undefined;

  constructor(props: Props) {
    super(props);
    this.input = React.createRef();
    this.state = {
      drawerOpen: false,
    };
  }

  componentDidMount() {
    const { autoFocus, showSelectors, slimInput } = this.props;
    const input = this.input.current;
    if (input && autoFocus) input.focus();
    if (slimInput && showSelectors && showSelectors.open && input) input.blur();
    this.maybeAttachTextareaInlineAttachment();
  }

  componentDidUpdate() {
    this.maybeAttachTextareaInlineAttachment();
  }

  maybeAttachTextareaInlineAttachment() {
    const { type } = this.props;
    const input = this.input.current;

    if ((type === 'textarea' || type === 'markdown') && input && !this.textareaInlineAttachmentAttached) {
      this.textareaInlineAttachmentAttached = true;
      window.inlineAttachment.editors.textarea.attach(input, {
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

  render() {
    const {
      uri,
      affixClass,
      autoFocus,
      blockWrap,
      charCount,
      children,
      disabled,
      error,
      helper,
      hideSuggestions,
      inputButton,
      isLivestream,
      label,
      labelOnLeft,
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
    } = this.props;
    const errorMessage = typeof error === 'object' ? error.message : error;
    const wrapperProps = {
      type,
      helper,
    };
    const labelProps = {
      name,
      label,
    };
    const countInfoProps = {
      charCount,
      textAreaMaxLength,
    };
    const quickActionProps = {
      label: quickActionLabel,
      quickActionHandler,
    };
    const inputSimpleProps = {
      name,
      label,
      disabled,
      ...inputProps,
    };
    const inputSelectProps = {
      name,
      error,
      label,
      children,
      ...inputProps,
    };

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

                <MarkdownEditor
                  {...inputProps}
                  id={name}
                  inputRef={this.input as React.RefObject<HTMLTextAreaElement>}
                  onChange={(value) => {
                    const normalizedValue =
                      textAreaMaxLength && value.length > textAreaMaxLength
                        ? value.substring(0, textAreaMaxLength)
                        : value;
                    inputProps.onChange?.(normalizedValue);
                  }}
                />

                <CountInfo {...countInfoProps} />
              </fieldset-section>
            </div>
          </FormFieldWrapper>
        );

      case 'textarea':
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
                isDrawerOpen={Boolean(this.state.drawerOpen)}
                toggleDrawer={() =>
                  this.setState({
                    drawerOpen: !this.state.drawerOpen,
                  })
                }
                closeSelector={closeSelector}
                commentSelectorsProps={commentSelectorsProps}
                showSelectors={Boolean(showSelectors && showSelectors.open)}
                slimInput={slimInput}
                slimInputButtonRef={slimInputButtonRef}
                onSlimInputClose={onSlimInputClose}
                tipModalOpen={tipModalOpen}
              >
                {(!slimInput || this.state.drawerOpen) && label && (
                  <div className="form-field__two-column">
                    <Label {...labelProps} />

                    {max && typeof textAreaValue === 'string' && (
                      <label
                        className={
                          Number(max) - String(textAreaValue).length > 0
                            ? 'input-max-counter'
                            : 'input-max-counter-error'
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
                    {...inputProps}
                    type={type}
                    id={name}
                    maxLength={max || textAreaMaxLength || FF_MAX_CHARS_DEFAULT}
                    ref={this.input}
                    value={textAreaValue}
                  />
                ) : (
                  <React.Suspense fallback={null}>
                    <TextareaWithSuggestions
                      {...inputProps}
                      spellCheck
                      uri={uri}
                      type={type}
                      id={name}
                      maxLength={max || textAreaMaxLength || FF_MAX_CHARS_DEFAULT}
                      value={textAreaValue}
                      inputRef={this.input}
                      isLivestream={isLivestream}
                      toggleSelectors={
                        setShowSelectors && showSelectors
                          ? () => {
                              const input = this.input.current;
                              if (!showSelectors.open && input) input.blur();
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
                        if (slimInput)
                          this.setState({
                            drawerOpen: false,
                          });
                        closeSelector();
                      }}
                      claimIsMine={commentSelectorsProps && commentSelectorsProps.claimIsMine}
                      slimInput={slimInput}
                      handlePreventClick={
                        !this.state.drawerOpen
                          ? () =>
                              this.setState({
                                drawerOpen: true,
                              })
                          : undefined
                      }
                      autoFocus={this.state.drawerOpen && (!showSelectors || !showSelectors.open)}
                      submitButtonRef={submitButtonRef}
                    />
                  </React.Suspense>
                )}
              </TextareaWrapper>
            </fieldset-section>
          </FormFieldWrapper>
        );

      default:
        const inputElementProps = {
          type,
          name,
          disabled,
          maxLength: max,
          ref: this.input,
          ...inputProps,
        };
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

              {/*
              {prefix && (
               <label htmlFor={name} className={disabled || error ? 'disabled' : ''}>
                 {prefix}
               </label>
              )}
               */}

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
