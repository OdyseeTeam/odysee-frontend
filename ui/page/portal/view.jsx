// @flow
import React from 'react';
import Page from 'component/page';
import { useParams } from 'react-router-dom';
import ClaimTilesDiscover from 'component/claimTilesDiscover';
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
      // theme[0].style.backgroundImage = 'linear-gradient(312deg, rgba(0,0,0,1) 0%, rgba(101,15,124,1) 100%)';
      // theme[0].style.backgroundImage = 'linear-gradient(312deg, rgba(0,0,0,1) 40%, rgba(101,15,124,1) 100%)';
      // theme[0].style.backgroundImage = 'radial-gradient(circle at 80% 20%, #140019, #000 50%, rgba(200,200,200,0.2) 25%, rgba(101,15,124,0.9) 75%)'
      theme[0].style.backgroundImage =
        'radial-gradient(circle at 80% 20%, rgba(0,0,0,0.6), #000 50%, rgba(101,15,124,0.9) 25%, #000 75%)';
      theme[0].classList.add('theme-stars');
    }
  }, [portal]);

  // if (portal) console.log('portal: ', portal);

  return portal ? (
    <>
      <Page className="portal-wrapper" fullWidthPage>
        <div className="portal-header">
          <img src={portal.image} />
          <div className="portal-meta">
            <h1>{portal.label}</h1>
            <p>{portal.description}</p>
          </div>
        </div>
        <div className="portal-content">
          <ClaimTilesDiscover claimIds={(portal.claimIds && portal.claimIds.videos) || []} uris={[]} pageSize={18} />
        </div>
      </Page>
    </>
  ) : (
    <></>
  );
}

export default PortalPage;
