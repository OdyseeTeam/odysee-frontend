import React from 'react';
import moment from 'moment';
import classnames from 'classnames';
import Button from 'component/button';
import { FormField } from 'component/common/form';
import { formatLbryUrlForWeb } from 'util/url';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { makeSelectClaimForUri } from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';

type Props = {
  lastViewed: number;
  uri: string;
  selected: boolean;
  onSelect?: () => void;
  slim: boolean;
};

function NavigationHistoryItem(props: Props) {
  const navigate = useNavigate();
  const { lastViewed, selected, onSelect, uri, slim } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector(makeSelectClaimForUri(uri));
  const resolveUri = React.useCallback((u: string) => dispatch(doResolveUri(u)), [dispatch]);

  React.useEffect(() => {
    if (!claim) {
      resolveUri(uri);
    }
  }, [claim, resolveUri, uri]);

  let title;

  if (claim && claim.value) {
    ({ title } = claim.value);
  }

  const navigatePath = formatLbryUrlForWeb(uri);
  const handleClick =
    onSelect ||
    function () {
      navigate(navigatePath);
    };

  return (
    <div
      role="button"
      onClick={handleClick}
      className={classnames('item-list__row', {
        'item-list__row--selected': selected,
      })}
    >
      {!slim && <FormField checked={selected} type="checkbox" onChange={onSelect} />}
      <span className="">{moment(lastViewed).from(moment())}</span>
      <Button className="item-list__element" button="link" label={uri} navigate={uri} />
      <span className="item-list__element">{title}</span>
    </div>
  );
}

NavigationHistoryItem.defaultProps = {
  slim: false,
};

export default NavigationHistoryItem;
