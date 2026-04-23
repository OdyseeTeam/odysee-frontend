import React from 'react';

function scaleToDevicePixelRatio(value: number) {
  const devicePixelRatio = window.devicePixelRatio || 1.0;

  if (devicePixelRatio < 1.0) {
    return Math.ceil(value / devicePixelRatio);
  }

  return Math.ceil(value * devicePixelRatio);
}

type Props = {
  children: any;
  skipWait?: boolean;
  placeholder?: any;
  yOffset?: number;
};
export default function WaitUntilOnPage(props: Props) {
  const { yOffset } = props;
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    if (shouldRender || !ref.current) return;

    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setShouldRender(true);
      return;
    }

    const rootMarginBottom = yOffset ? scaleToDevicePixelRatio(yOffset) : 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: `0px 0px ${rootMarginBottom}px 0px`,
        threshold: 0,
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shouldRender, yOffset]);

  const render = props.skipWait || shouldRender;
  return (
    <div ref={ref}>
      {render && props.children}
      {!render && props.placeholder !== undefined && props.placeholder}
    </div>
  );
}
