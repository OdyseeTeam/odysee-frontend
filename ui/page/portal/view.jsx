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

function Portal(props: Props) {
  const { portals } = props;
  const [portal, setPortal] = React.useState(1);

  let { portalName } = useParams();

  React.useEffect(() => {
    if (portals) {
      const index = portals.find((portal) => portal.name === portalName);
      setPortal(index);

      const theme = document.getElementsByClassName('theme');
      theme[0].style.backgroundImage = 'linear-gradient(312deg, rgba(0,0,0,1) 0%, rgba(101,15,124,1) 100%)';
    }
  }, [portals]);

  // if(portal) console.log('portal: ', portal)

  return (
    <Page className="portal-wrapper" fullWidthPage>
      <div className="portal-header">
        <img src={portal.background} />
        <div className="portal-meta">
          <h1>{portal.label}</h1>
          <p>{portal.description}</p>
        </div>
      </div>
      <ClaimTilesDiscover claimIds={portal.claimIds} uris={[]} />
    </Page>
  );
}

export default Portal;
