// @flow
import React from 'react';
import analytics from 'analytics';

export function importPublir(componentName: 'PublirAdsProvider' | 'AdSlot') {
  return React.lazy<any>(() => {
    return import('../publir-react-plugin')
      .then((module) => ({ default: module[componentName] }))
      .catch((err) => {
        assert(false, `Failed to load publir-react-plugin::${componentName}`, err);
        analytics.log(err, { tags: { origin: 'publir-import' } }, 'publir-import');

        const FallbackComponent = () => <div />;
        return { default: FallbackComponent };
      });
  });
}
