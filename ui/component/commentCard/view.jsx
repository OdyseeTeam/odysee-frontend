import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import useFetchComments from './useFetchComments';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { LocalStorage } from 'util/storage';
import './style.scss';

const DEFAULT_AVATAR = 'https://thumbnails.odycdn.com/optimize/s:160:160/quality:85/plain/https://spee.ch/spaceman-png:2.png';

// Emoji mapping from Odysee CDN
const EMOJI_MAPPING = {
  ':thumb_up_2:': 'https://static.odycdn.com/emoticons/48%20px/thumb%20up%402x.png',
  ':thumb_down:': 'https://static.odycdn.com/emoticons/48%20px/thumb%20down%402x.png',
  ':smile:': 'https://static.odycdn.com/emoticons/48%20px/smile%402x.png',
  ':smile_2:': 'https://static.odycdn.com/emoticons/48%20px/smile%202%402x.png',
  ':fire:': 'https://static.odycdn.com/emoticons/48%20px/fire%20up%402x.png',
  ':love_1:': 'https://static.odycdn.com/emoticons/48%20px/Love%402x.png',
  ':love_2:': 'https://static.odycdn.com/emoticons/48%20px/Love%202%402x.png',
  ':laughing_1:': 'https://static.odycdn.com/emoticons/48%20px/Laughing%402x.png',
  ':laughing_2:': 'https://static.odycdn.com/emoticons/48%20px/Laughing%202%402x.png',
  ':cry_2:': 'https://static.odycdn.com/emoticons/48%20px/cry%202%402x.png',
  ':cry_4:': 'https://static.odycdn.com/emoticons/48%20px/cry%204%402x.png',
  ':angry_1:': 'https://static.odycdn.com/emoticons/48%20px/angry%402x.png',
  ':angry_3:': 'https://static.odycdn.com/emoticons/48%20px/angry%203%402x.png',
  ':kiss_1:': 'https://static.odycdn.com/emoticons/48%20px/kiss%402x.png',
  ':surprised:': 'https://static.odycdn.com/emoticons/48%20px/surprised%402x.png',
  ':ouch:': 'https://static.odycdn.com/emoticons/48%20px/ouch%402x.png',
  ':confused_2:': 'https://static.odycdn.com/emoticons/48%20px/confused%402x.png',
  ':what:': 'https://static.odycdn.com/emoticons/48%20px/what_%402x.png',
  ':sad:': 'https://static.odycdn.com/emoticons/48%20px/sad%402x.png',
  ':angry_2:': 'https://static.odycdn.com/emoticons/48%20px/angry%202%402x.png',
  ':cry_1:': 'https://static.odycdn.com/emoticons/48%20px/cry%402x.png',
  ':cry_3:': 'https://static.odycdn.com/emoticons/48%20px/cry%203%402x.png',
  ':cry_5:': 'https://static.odycdn.com/emoticons/48%20px/cry%205%402x.png',
  ':rainbow_puke_1:': 'https://static.odycdn.com/emoticons/48%20px/rainbow%20puke%402x-1.png',
  ':sleep:': 'https://static.odycdn.com/emoticons/48%20px/Sleep%402x.png',
  ':thinking_2:': 'https://static.odycdn.com/emoticons/48%20px/thinking%402x.png',
  ':peace:': 'https://static.odycdn.com/emoticons/48%20px/peace%402x.png',
  ':no:': 'https://static.odycdn.com/emoticons/48%20px/NO%402x.png',
  ':block:': 'https://static.odycdn.com/emoticons/48%20px/block%402x.png',
  ':confirm:': 'https://static.odycdn.com/emoticons/48%20px/CONFIRM%402x.png',
  ':kiss_2:': 'https://static.odycdn.com/emoticons/48%20px/kiss%202%402x.png',
  ':thinking_1:': 'https://static.odycdn.com/emoticons/48%20px/thinking%402x-1.png',
  ':angry_4:': 'https://static.odycdn.com/emoticons/48%20px/angry%204%402x.png',
  ':scary:': 'https://static.odycdn.com/emoticons/48%20px/scary%402x.png',
  ':alien:': 'https://static.odycdn.com/emoticons/48%20px/Alien%402x.png',
  ':blind:': 'https://static.odycdn.com/emoticons/48%20px/blind%402x.png',
  ':bomb:': 'https://static.odycdn.com/emoticons/48%20px/bomb%402x.png',
  ':brain_chip:': 'https://static.odycdn.com/emoticons/48%20px/Brain%20chip%402x.png',
  ':confused_1:': 'https://static.odycdn.com/emoticons/48%20px/confused%402x-1.png',
  ':cooking_something_nice:': 'https://static.odycdn.com/emoticons/48%20px/cooking%20something%20nice%402x.png',
  ':donut:': 'https://static.odycdn.com/emoticons/48%20px/donut%402x.png',
  ':eggplant_with_condom:': 'https://static.odycdn.com/emoticons/48%20px/eggplant%20with%20condom%402x.png',
  ':eggplant:': 'https://static.odycdn.com/emoticons/48%20px/eggplant%402x.png',
  ':fire_up:': 'https://static.odycdn.com/emoticons/48%20px/fire%20up%402x.png',
  ':flat_earth:': 'https://static.odycdn.com/emoticons/48%20px/Flat%20earth%402x.png',
  ':flying_saucer:': 'https://static.odycdn.com/emoticons/48%20px/Flying%20saucer%402x.png',
  ':heart_chopper:': 'https://static.odycdn.com/emoticons/48%20px/heart%20chopper%402x.png',
  ':ice_cream:': 'https://static.odycdn.com/emoticons/48%20px/ice%20cream%402x.png',
  ':idk:': 'https://static.odycdn.com/emoticons/48%20px/IDK%402x.png',
  ':illuminati_1:': 'https://static.odycdn.com/emoticons/48%20px/Illuminati%402x-1.png',
  ':illuminati_2:': 'https://static.odycdn.com/emoticons/48%20px/Illuminati%402x.png',
  ':laser_gun:': 'https://static.odycdn.com/emoticons/48%20px/laser%20gun%402x.png',
  ':lollipop:': 'https://static.odycdn.com/emoticons/48%20px/Lollipop%402x.png',
  ':monster:': 'https://static.odycdn.com/emoticons/48%20px/Monster%402x.png',
  ':mushroom:': 'https://static.odycdn.com/emoticons/48%20px/mushroom%402x.png',
  ':nail_it:': 'https://static.odycdn.com/emoticons/48%20px/Nail%20It%402x.png',
  ':pizza:': 'https://static.odycdn.com/emoticons/48%20px/pizza%402x.png',
  ':rabbit_hole:': 'https://static.odycdn.com/emoticons/48%20px/rabbit%20hole%402x.png',
  ':rainbow_puke_2:': 'https://static.odycdn.com/emoticons/48%20px/rainbow%20puke%402x.png',
  ':rock:': 'https://static.odycdn.com/emoticons/48%20px/ROCK%402x.png',
  ':salty:': 'https://static.odycdn.com/emoticons/48%20px/salty%402x.png',
  ':slime_down:': 'https://static.odycdn.com/emoticons/48%20px/slime%20down%402x.png',
  ':smelly_socks:': 'https://static.odycdn.com/emoticons/48%20px/smelly%20socks%402x.png',
  ':spock:': 'https://static.odycdn.com/emoticons/48%20px/SPOCK%402x.png',
  ':star:': 'https://static.odycdn.com/emoticons/48%20px/Star%402x.png',
  ':sunny_day:': 'https://static.odycdn.com/emoticons/48%20px/sunny%20day%402x.png',
  ':sweet:': 'https://static.odycdn.com/emoticons/48%20px/sweet%402x.png',
  ':tinfoil_hat:': 'https://static.odycdn.com/emoticons/48%20px/tin%20hat%402x.png',
  ':troll_king:': 'https://static.odycdn.com/emoticons/48%20px/Troll%20king%402x.png',
  ':ufo:': 'https://static.odycdn.com/emoticons/48%20px/ufo%402x.png',
  ':woodoo_doll:': 'https://static.odycdn.com/emoticons/48%20px/woodo%20doll%402x.png',
  ':hyper_troll:': 'https://static.odycdn.com/emoticons/48%20px/HyperTroll%402x.png',
  ':space_chad:': 'https://static.odycdn.com/emoticons/48%20px/space%20chad%402x.png',
  ':space_doge:': 'https://static.odycdn.com/emoticons/48%20px/doge%402x.png',
  ':space_green_wojak:': 'https://static.odycdn.com/emoticons/48%20px/space%20wojak%402x-1.png',
  ':space_julian:': 'https://static.odycdn.com/emoticons/48%20px/Space%20Julian%402x.png',
  ':space_red_wojak:': 'https://static.odycdn.com/emoticons/48%20px/space%20wojak%402x.png',
  ':space_resitas:': 'https://static.odycdn.com/emoticons/48%20px/resitas%402x.png',
  ':space_tom:': 'https://static.odycdn.com/emoticons/48%20px/space%20Tom%402x.png',
  ':waiting:': 'https://static.odycdn.com/emoticons/48%20px/waiting%402x.png',

   // Stickers mapping from Odysee CDN

  ':FIRE:': 'https://static.odycdn.com/stickers/MISC/PNG/fire.png',
  ':SLIME:': 'https://static.odycdn.com/stickers/SLIME/PNG/slime_with_frame.png',
  ':PISS:': 'https://static.odycdn.com/stickers/PISS/PNG/piss_with_frame.png',
  ':THUMBS_UP:': 'https://static.odycdn.com/stickers/MISC/PNG/thumbs_up.png',
  ':BRAVO:': 'https://static.odycdn.com/stickers/MISC/PNG/bravo.png',
  ':WOW:': 'https://static.odycdn.com/stickers/MISC/PNG/wow.png',
  ':GRR:': 'https://static.odycdn.com/stickers/MISC/PNG/grr.png',
  ':ACTUALLY:': 'https://static.odycdn.com/stickers/MISC/PNG/actually.png',
  ':INTERESTING:': 'https://static.odycdn.com/stickers/MISC/PNG/interesting.png',
  ':CAT:': 'https://static.odycdn.com/stickers/CAT/PNG/cat_with_border.png',
  ':FAIL:': 'https://static.odycdn.com/stickers/FAIL/PNG/fail_with_border.png',
  ':HYPE:': 'https://static.odycdn.com/stickers/HYPE/PNG/hype_with_border.png',
  ':PANTS_1:': 'https://static.odycdn.com/stickers/PANTS/PNG/PANTS_1_with_frame.png',
  ':DOGE:': 'https://static.odycdn.com/stickers/MISC/PNG/doge.png',
  ':EGG_CARTON:': 'https://static.odycdn.com/stickers/MISC/PNG/egg_carton.png',
  ':WAITING:': 'https://static.odycdn.com/stickers/MISC/PNG/waiting.png',
  ':BULL_RIDE:': 'https://static.odycdn.com/stickers/BULL/PNG/bull-ride.png',
  ':ELIMINATED:': 'https://static.odycdn.com/stickers/ELIMINATED/PNG/eliminated.png',
  ':BAN:': 'https://static.odycdn.com/stickers/BAN/PNG/ban.png',
  ':MONEY_PRINTER:': 'https://static.odycdn.com/stickers/MISC/PNG/money_printer.png',
  ':MOUNT_RUSHMORE:': 'https://static.odycdn.com/stickers/MISC/PNG/mount_rushmore.png',
  ':KANYE_WEST:': 'https://static.odycdn.com/stickers/MISC/PNG/kanye_west.png',
  ':TAYLOR_SWIFT:': 'https://static.odycdn.com/stickers/MISC/PNG/taylor_swift.png',
  ':DONALD_TRUMP:': 'https://static.odycdn.com/stickers/MISC/PNG/donald_trump.png',
  ':BILL_CLINTON:': 'https://static.odycdn.com/stickers/MISC/PNG/bill_clinton.png',
  ':EPSTEIN_ISLAND:': 'https://static.odycdn.com/stickers/MISC/PNG/epstein_island.png',
  ':KURT_COBAIN:': 'https://static.odycdn.com/stickers/MISC/PNG/kurt_cobain.png',
  ':BILL_COSBY:': 'https://static.odycdn.com/stickers/MISC/PNG/bill_cosby.png',
  ':CHE_GUEVARA:': 'https://static.odycdn.com/stickers/MISC/PNG/che_guevara.png',
  ':PREGNANT_MAN_BLONDE:': 'https://static.odycdn.com/stickers/pregnant%20man/png/Pregnant%20man_white%20border_blondie.png',
  ':ROCKET_SPACEMAN:': 'https://static.odycdn.com/stickers/ROCKET%20SPACEMAN/PNG/rocket-spaceman_with-border.png',
  ':SALTY:': 'https://static.odycdn.com/stickers/SALTY/PNG/salty.png',
  ':SICK_FLAME:': 'https://static.odycdn.com/stickers/SICK/PNG/sick2_with_border.png',
  ':SICK_SKULL:': 'https://static.odycdn.com/stickers/SICK/PNG/with%20borderdark%20with%20frame.png',
  ':SPHAGETTI_BATH:': 'https://static.odycdn.com/stickers/SPHAGETTI%20BATH/PNG/sphagetti%20bath_with_frame.png',
  ':THUG_LIFE:': 'https://static.odycdn.com/stickers/THUG%20LIFE/PNG/thug_life_with_border_clean.png',
  ':TRAP:': 'https://static.odycdn.com/stickers/TRAP/PNG/trap.png',
  ':TRASH:': 'https://static.odycdn.com/stickers/TRASH/PNG/trash.png',
  ':WHUUT:': 'https://static.odycdn.com/stickers/WHUUT/PNG/whuut_with-frame.png',
  ':TIP_HAND_FLIP:': 'https://static.odycdn.com/stickers/TIPS/png/tip_hand_flip_$%20_with_border.png',
  ':TIP_HAND_FLIP_COIN:': 'https://static.odycdn.com/stickers/TIPS/png/tip_hand_flip_coin_with_border.png',
  ':TIP_HAND_FLIP_LBC:': 'https://static.odycdn.com/stickers/TIPS/png/tip_hand_flip_lbc_with_border.png',
  ':COMET_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/$%20comet%20tip%20with%20border.png',
  ':SILVER_ODYSEE_COIN:': 'https://static.odycdn.com/stickers/TIPS/png/with%20bordersilver_odysee_coinv.png',
  ':LBC_COMET_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/LBC%20comet%20tip%20with%20border.png',
  ':SMALL_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/with%20bordersmall$_tip.png',
  ':SMALL_LBC_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/with%20bordersmall_LBC_tip%20.png',
  ':BITE_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/bite_$tip_with%20border.png',
  ':BITE_TIP_CLOSEUP:': 'https://static.odycdn.com/stickers/TIPS/png/bite_$tip_closeup.png',
  ':BITE_LBC_CLOSEUP:': 'https://static.odycdn.com/stickers/TIPS/png/LBC%20bite.png',
  ':MEDIUM_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/with%20bordermedium$_%20tip.png',
  ':MEDIUM_LBC_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/with%20bordermedium_LBC_tip%20%20%20%20%20%20%20%20%20%20.png',
  ':LARGE_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/with%20borderlarge$tip.png',
  ':LARGE_LBC_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/with%20borderlarge_LBC_tip%20.png',
  ':BIG_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/with%20borderbig$tip.png',
  ':BIG_LBC_TIP:': 'https://static.odycdn.com/stickers/TIPS/png/big_LBC_TIPV.png',
  ':FORTUNE_CHEST:': 'https://static.odycdn.com/stickers/TIPS/png/with%20borderfortunechest$_tip.png',
  ':FORTUNE_CHEST_LBC:': 'https://static.odycdn.com/stickers/TIPS/png/with%20borderfortunechest_LBC_tip.png',
};

// Random colors for channel avatars
const getRandomColor = (seed) => {
  const hue = Math.floor((seed * 160) % 360);
  return `hsl(${hue}, 80%, 65%)`;
};

const CommentCard = ({ pinnedClaimIds, sortBy }) => {
  const { comments, loading, error, refresh } = useFetchComments(pinnedClaimIds, sortBy);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isCommentsVisible, setIsCommentsVisible] = useState(() => {
    return LocalStorage.getItem('comments-closed') !== 'true';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  const formatCommentText = useCallback((text) => {
    if (!text) return '';
    let formattedText = text;
    for (const [emojiCode, emojiUrl] of Object.entries(EMOJI_MAPPING)) {
      formattedText = formattedText.replace(
        new RegExp(emojiCode, 'g'), 
        `<img src="${emojiUrl}" alt="${emojiCode}" class="comment-emoji comment-sticker" />`
      );
    }
    return formattedText;
  }, []);

  const scrollLeft = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      setScrollPosition(containerRef.current.scrollLeft);
    }
  }, []);
  
  const scrollRight = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      setScrollPosition(containerRef.current.scrollLeft);
    }
  }, []);

  const handleScroll = useCallback(() => {
    setScrollPosition(containerRef.current?.scrollLeft || 0);
  }, []);

  const handleCloseComments = useCallback(() => {
    setIsCommentsVisible(false);
    LocalStorage.setItem('comments-closed', 'true');
    setIsMenuOpen(false);
  }, []);

  const toggleMenu = useCallback((e) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  if (!isCommentsVisible) return null;

  if (loading) return (
    <div className="comment-card__loading">
      <div className="comment-card__spinner" aria-label="Loading" />
      <p>Loading comments...</p>
    </div>
  );

  if (error) return (
    <div className="comment-card__error">
      <p>Error loading comments: {error.message || error}</p>
      <button onClick={refresh} className="comment-card__retry">
        Retry
      </button>
    </div>
  );

  if (!comments?.length) return (
    <div className="comment-card__empty">
      <p>No comments available</p>
      <button onClick={refresh} className="comment-card__retry">
        Retry
      </button>
    </div>
  );

  return (
    <div className="comment-card-container">
      <div className="comment-context-menu" ref={menuRef}>
        <button className="comment-menu-button" onClick={toggleMenu} aria-label="Options">
          <Icon icon={ICONS.MORE} />
        </button>
        {isMenuOpen && (
          <div className="comment-menu-dropdown">
            <button className="comment-menu-item" onClick={handleCloseComments}>
              Hide comments
            </button>
          </div>
        )}
      </div>

      <button
        className={`scroll-button scroll-button--left ${scrollPosition === 0 ? 'disabled' : ''}`}
        onClick={scrollLeft}
        disabled={scrollPosition === 0}
        aria-label="Move left"
      >
        &larr;
      </button>

      <div className="comment-card__wrapper" ref={containerRef}>
        {comments.map((comment) => {
          const seed = comment.channelName?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || Math.random() * 100;
          const bgColor = getRandomColor(seed);

          return (
            <div 
              key={`${comment.id}-${comment.claimId}`} 
              className="comment-card__item"
              onClick={() => window.open(comment.claimUrl, '_blank', 'noopener,noreferrer')}
              tabIndex={0}
            >
              <div className="comment-card__header">
                <div className="comment-card__avatar" style={{ backgroundColor: bgColor }}>
                  <img 
                    src={DEFAULT_AVATAR} 
                    alt={comment.channelName || 'Anonymous'}
                    onError={(e) => e.target.style.display = 'none'}
                    className="comment-card__avatar-img"
                  />
                </div>
                <div className="comment-card__author">
                  <p className="comment-card__channel-name">
                    {comment.channelName || 'Anonymous'}
                  </p>
                  {comment.timestamp && (
                    <span className="comment-card__timestamp">
                      {new Date(comment.timestamp * 1000).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="comment-card__content">
                <div 
                  className="comment-card__text" 
                  dangerouslySetInnerHTML={{ __html: formatCommentText(comment.text) }} 
                  />
              </div>
            </div>
          );
        })}
      </div>

      <button
        className={`scroll-button scroll-button--right ${
          scrollPosition >= (containerRef.current?.scrollWidth - containerRef.current?.clientWidth) ? 'disabled' : ''
        }`}
        onClick={scrollRight}
        disabled={scrollPosition >= (containerRef.current?.scrollWidth - containerRef.current?.clientWidth)}
        aria-label="Move right"
      >
        &rarr;
      </button>
    </div>
  );
};

CommentCard.propTypes = {
  pinnedClaimIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  sortBy: PropTypes.number,
};

CommentCard.defaultProps = {
  sortBy: 3,
};

export default React.memo(CommentCard);
