/**
 * Custom JSX intrinsic elements.
 *
 * These are custom HTML-like elements used in the Odysee codebase
 * for form layout and structure.
 */

declare namespace JSX {
  interface IntrinsicElements {
    'fieldset-section': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
    'fieldset-group': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
    'input-submit': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'css-doodle': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
  }
}
