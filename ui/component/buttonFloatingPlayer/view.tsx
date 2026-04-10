import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import { useAppDispatch } from 'redux/hooks';
import { doStartFloatingPlayingUri } from 'redux/actions/content';
import { doResolveUri } from 'redux/actions/claims';
import { doFileGetForUri } from 'redux/actions/file';

function ButtonFloatingPlayer(props: { uri: string; focusable?: boolean }) {
  const { uri, focusable = true } = props;
  const dispatch = useAppDispatch();

  function handleClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dispatch(doResolveUri(uri, false) as any);
    dispatch(doFileGetForUri(uri));
    dispatch(doStartFloatingPlayingUri({ uri }));
  }

  return (
    <div className="claim-preview__hover-actions fourth-item">
      <button
        title={__('Floating Player')}
        aria-label={__('Floating Player')}
        className="button button--no-style button--file-action"
        onClick={handleClick}
        tabIndex={focusable ? 0 : -1}
        type="button"
      >
        <span className="button__content">
          <Icon icon={ICONS.FLOATING_PLAYER} />
          <span dir="auto" className="button__label">
            {__('Floating Player')}
          </span>
        </span>
      </button>
    </div>
  );
}

export default ButtonFloatingPlayer;
