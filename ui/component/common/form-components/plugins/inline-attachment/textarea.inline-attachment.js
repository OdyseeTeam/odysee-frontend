/*jslint newcap: true */
/*global inlineAttachment: false */
/**
 * Textarea adapter for inlineAttachment
 *
 * Works with React controlled inputs by using the native input value setter
 * and dispatching an 'input' event, which React's onChange handler picks up.
 *
 * Call inlineAttachment.editors.textarea.attach(element, options) to attach.
 */
(function () {
  'use strict';

  // React overrides the native value setter on input/textarea elements.
  // To programmatically change the value in a way React detects, we need
  // to use the original native setter and then dispatch an 'input' event.
  var nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  ).set;

  var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;

  function setNativeValue(el, value) {
    var setter = el.tagName === 'TEXTAREA' ? nativeTextareaValueSetter : nativeInputValueSetter;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  var textareaEditor = function (el) {
    this.el = el;
  };

  textareaEditor.prototype.getValue = function () {
    return this.el.value;
  };

  textareaEditor.prototype.insertValue = function (val) {
    var el = this.el;
    var start = el.selectionStart || 0;
    var end = el.selectionEnd || 0;
    var newValue = el.value.substring(0, start) + val + el.value.substring(end);
    var newCursorPos = start + val.length;

    setNativeValue(el, newValue);

    // Restore cursor position after React re-render
    setTimeout(function () {
      el.selectionStart = newCursorPos;
      el.selectionEnd = newCursorPos;
      el.focus();
    }, 0);
  };

  textareaEditor.prototype.setValue = function (val) {
    var el = this.el;
    var cursorPos = el.selectionStart || 0;

    setNativeValue(el, val);

    setTimeout(function () {
      el.selectionStart = cursorPos;
      el.selectionEnd = cursorPos;
    }, 0);
  };

  /**
   * Attach InlineAttachment to a textarea or input element
   *
   * @param {HTMLElement} el - textarea or input element
   * @param {Object} options
   */
  textareaEditor.attach = function (el, options) {
    options = options || {};

    var editor = new textareaEditor(el);
    var inlineattach = new inlineAttachment(options, editor);

    el.addEventListener(
      'paste',
      function (e) {
        inlineattach.onPaste(e);
      },
      false
    );

    el.addEventListener('drop', function (e) {
      if (inlineattach.onDrop(e)) {
        e.stopPropagation();
        e.preventDefault();
        return true;
      }
      return false;
    });
  };

  inlineAttachment.editors.textarea = textareaEditor;
})();
