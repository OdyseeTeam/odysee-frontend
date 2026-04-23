/*jslint newcap: true */

/*global inlineAttachment: false */

/**
 * CodeMirror version for inlineAttachment
 *
 * Call inlineAttachment.attach(editor) to attach to a codemirror instance
 */
(function () {
  'use strict';

  var inlineAttachment = (window as any).inlineAttachment;

  // eslint-disable-next-line unicorn/consistent-function-scoping
  var codeMirrorEditor: any = function (this: any, instance: any) {
    if (!instance.getWrapperElement) {
      throw 'Invalid CodeMirror object given';
    }

    this.codeMirror = instance;
  };

  codeMirrorEditor.prototype.getValue = function () {
    return this.codeMirror.getValue();
  };

  codeMirrorEditor.prototype.insertValue = function (val: any) {
    this.codeMirror.replaceSelection(val);
  };

  codeMirrorEditor.prototype.setValue = function (val: any) {
    var cursor = this.codeMirror.getCursor();
    this.codeMirror.setValue(val);
    this.codeMirror.setCursor(cursor);
  };

  /**
   * Attach InlineAttachment to CodeMirror
   *
   * @param {CodeMirror} codeMirror
   */
  codeMirrorEditor.attach = function (codeMirror: any, options: any) {
    options = options || {};
    var editor = new codeMirrorEditor(codeMirror),
      inlineattach = new inlineAttachment(options, editor),
      el = codeMirror.getWrapperElement();
    el.addEventListener(
      'paste',
      function (e: any) {
        inlineattach.onPaste(e);
      },
      false
    );
    codeMirror.setOption('onDragEvent', function (data: any, e: any) {
      if (e.type === 'drop') {
        e.stopPropagation();
        e.preventDefault();
        return inlineattach.onDrop(e);
      }
    });
  };

  var codeMirrorEditor4: any = function (this: any, instance: any) {
    codeMirrorEditor.call(this, instance);
  };

  codeMirrorEditor4.attach = function (codeMirror: any, options: any) {
    options = options || {};
    var editor = new codeMirrorEditor(codeMirror),
      inlineattach = new inlineAttachment(options, editor),
      el = codeMirror.getWrapperElement();
    el.addEventListener(
      'paste',
      function (e: any) {
        inlineattach.onPaste(e);
      },
      false
    );
    codeMirror.on('drop', function (data: any, e: any) {
      if (inlineattach.onDrop(e)) {
        e.stopPropagation();
        e.preventDefault();
        return true;
      } else {
        return false;
      }
    });
  };

  inlineAttachment.editors.codemirror4 = codeMirrorEditor4;
})();
