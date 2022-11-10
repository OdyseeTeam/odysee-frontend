// @flow
import React from 'react';
import Page from 'component/page';
import { useParams } from 'react-router-dom';
import ClaimListDiscover from 'component/claimListDiscover';
import './style.scss';

type Props = {
  uri: string,
  portals: any,
  homepageData: any,
};

export const PortalContext = React.createContext<any>();

function PortalPage(props: Props) {
  const { portals } = props;
  const [portal, setIndex] = React.useState(undefined);

  let { portalName } = useParams();

  React.useEffect(() => {
    if (portals) {
      const index = portals.find((portal) => portal.name === portalName);
      setIndex(index);
    }
  }, [portals]);

  React.useEffect(() => {
    if (portal) {
      const theme = document.getElementsByClassName('theme');
      const stars = document.getElementsByClassName('stars');
      theme[0].style.backgroundImage =
        'radial-gradient(circle at 80% 20%, rgba(0,0,0,0.6), #000 50%, rgba(101,15,124,0.9) 25%, #000 75%)';
      stars[0].classList.add('stars-active');
    }
  }, [portal]);

  React.useEffect(() => {
    const footer = document.getElementsByClassName('footer');
    footer && footer[0] && footer[0].classList.add('footer-background');
  }, []);

  return portal ? (
    <>
      <Page className="portal-wrapper" fullWidthPage>
        <div className="portal-header">
          <img src={portal.image} style={{ background: `rgba(` + portal.css.rgb + `,1)` }} />
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
          />
        </div>
      </Page>
    </>
  ) : (
    <></>
  );
}

export default PortalPage;
