// @flow
import React from 'react';
import Page from 'component/page';
import { useParams } from 'react-router-dom';
import ClaimListDiscover from 'component/claimListDiscover';
import Portals from 'component/portals';
import './style.scss';

type Props = {
  portals: any,
  homepageData: any,
  showViews: boolean,
};

export const PortalContext = React.createContext<any>();

function PortalPage(props: Props) {
  const { portals, homepageData, showViews } = props;
  const [portal, setIndex] = React.useState(undefined);
  const [displayedTiles, setDisplayedTiles] = React.useState(0);

  let { portalName } = useParams();

  React.useEffect(() => {
    if (portals) {
      const index = portals.find((portal) => portal.name === portalName);
      setIndex(index);
    }
  }, [portals, portalName]);

  React.useEffect(() => {
    if (portal) {
      const theme = document.getElementsByClassName('theme');
      const stars = document.getElementsByClassName('stars');
      theme[0].style.backgroundImage =
        'radial-gradient(circle at 80% 20%, rgba(0,0,0,0.6), #000 50%, rgba(101,15,124,0.9) 25%, #000 75%)';
      stars[0].classList.add('stars-active');
      setTimeout(() => {
        const footer = document.getElementsByClassName('footer');
        footer && footer[0] && footer[0].classList.add('footer-background');
      }, 1000);
    }
  }, [portal]);

  return portal ? (
    <>
      <Page className="portal-wrapper" fullWidthPage>
        <div className="portal-header">
          <img
            src={'https://thumbnails.odycdn.com/optimize/s:237:0/quality:95/plain/' + portal.image}
            style={{ background: `rgba(` + portal.css.rgb + `,1)` }}
          />
          <div className="portal-meta">
            <h1>{portal.label}</h1>
            <p>{portal.description}</p>
          </div>
        </div>
        <div className="portal-content">
          <ClaimListDiscover
            claimIds={(portal.claimIds && portal.claimIds.videos) || []}
            infiniteScroll
            tileLayout
            showHeader={false}
            loadedCallback={setDisplayedTiles}
            fetchViewCount={showViews}
          />
        </div>
        {homepageData && displayedTiles >= portal.claimIds.videos.length - 3 && (
          <Portals homepageData={homepageData} activePortal={portal.name} />
        )}
      </Page>
    </>
  ) : (
    <></>
  );
}

export default PortalPage;
