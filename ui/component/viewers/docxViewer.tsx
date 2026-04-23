import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import LoadingScreen from 'component/common/loading-screen';
type Props = {
  source: string;
};

function DocxViewer({ source }: Props) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const options = {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Section Title'] => h1:fresh",
        "p[style-name='Subsection Title'] => h2:fresh",
        "p[style-name='Aside Heading'] => div.aside > h2:fresh",
        "p[style-name='Aside Text'] => div.aside > p:fresh",
      ],
    };
    mammoth
      .convertToHtml({ path: source }, options)
      .then((result: any) => {
        setContent(result.value);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [source]);

  const loadingMessage = __('Rendering document.');
  const errorMessage = __("Sorry, looks like we can't load the document.");

  return (
    <div className="file-viewer file-viewer--document">
      {loading && <LoadingScreen status={loadingMessage} spinner />}
      {error && <LoadingScreen status={errorMessage} spinner={false} />}
      {content && (
        <div
          className="file-render__content"
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />
      )}
    </div>
  );
}

export default DocxViewer;
