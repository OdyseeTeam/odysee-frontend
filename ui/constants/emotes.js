// @flow

const buildCDNUrl = (path: string) => `https://static.odycdn.com/emoticons/${path}`;

const buildEmote = (name: string, path: string) => ({
  name: `:${name}:`,
  url: buildCDNUrl(path),
});

const getEmotes = (px: string, multiplier: string) => [
  buildEmote('love_1', `${px}/Love${multiplier}.png`),
  buildEmote('love_2', `${px}/Love%202${multiplier}.png`),
  buildEmote('smile_1', `${px}/smile${multiplier}.png`),
  buildEmote('smile_2', `${px}/smile%202${multiplier}.png`),
  buildEmote('laughing_1', `${px}/Laughing${multiplier}.png`),
  buildEmote('laughing_2', `${px}/Laughing 2${multiplier}.png`),
  buildEmote('cry_2', `${px}/cry%202${multiplier}.png`),
  buildEmote('cry_4', `${px}/cry%204${multiplier}.png`),
  buildEmote('angry_1', `${px}/angry${multiplier}.png`),
  buildEmote('angry_3', `${px}/angry%203${multiplier}.png`),
  buildEmote('kiss_1', `${px}/kiss${multiplier}.png`),
  buildEmote('surprised', `${px}/surprised${multiplier}.png`),
  buildEmote('ouch', `${px}/ouch${multiplier}.png`),
  buildEmote('confused_2', `${px}/confused${multiplier}.png`),
  buildEmote('what', `${px}/what_${multiplier}.png`),
  buildEmote('sad', `${px}/sad${multiplier}.png`),
  buildEmote('angry_2', `${px}/angry%202${multiplier}.png`),
  buildEmote('cry_1', `${px}/cry${multiplier}.png`),
  buildEmote('cry_3', `${px}/cry%203${multiplier}.png`),
  buildEmote('cry_5', `${px}/cry%205${multiplier}.png`),
  buildEmote('rainbow_puke_1', `${px}/rainbow%20puke${multiplier}-1.png`),
  buildEmote('sleep', `${px}/Sleep${multiplier}.png`),
  buildEmote('thinking_2', `${px}/thinking${multiplier}.png`),
  buildEmote('peace', `${px}/peace${multiplier}.png`),
  buildEmote('no', `${px}/NO${multiplier}.png`),
  buildEmote('block', `${px}/block${multiplier}.png`),
  buildEmote('confirm', `${px}/CONFIRM${multiplier}.png`),
  buildEmote('thumb_down', `${px}/thumb%20down${multiplier}.png`),
  buildEmote('thumb_up_1', `${px}/thumb%20up${multiplier}-1.png`),
  buildEmote('kiss_2', `${px}/kiss%202${multiplier}.png`),
  buildEmote('thinking_1', `${px}/thinking${multiplier}-1.png`),
  buildEmote('angry_4', `${px}/angry%204${multiplier}.png`),
  buildEmote('scary', `${px}/scary${multiplier}.png`),
  buildEmote('alien', `${px}/Alien${multiplier}.png`),
  buildEmote('blind', `${px}/blind${multiplier}.png`),
  buildEmote('bomb', `${px}/bomb${multiplier}.png`),
  buildEmote('brain_chip', `${px}/Brain%20chip${multiplier}.png`),
  buildEmote('confused_1', `${px}/confused${multiplier}-1.png`),
  buildEmote('cooking_something_nice', `${px}/cooking%20something%20nice${multiplier}.png`),
  buildEmote('donut', `${px}/donut${multiplier}.png`),
  buildEmote('eggplant_with_condom', `${px}/eggplant%20with%20condom${multiplier}.png`),
  buildEmote('eggplant', `${px}/eggplant${multiplier}.png`),
  buildEmote('fire_up', `${px}/fire%20up${multiplier}.png`),
  buildEmote('flat_earth', `${px}/Flat%20earth${multiplier}.png`),
  buildEmote('flying_saucer', `${px}/Flying%20saucer${multiplier}.png`),
  buildEmote('heart_chopper', `${px}/heart%20chopper${multiplier}.png`),
  buildEmote('ice_cream', `${px}/ice%20cream${multiplier}.png`),
  buildEmote('idk', `${px}/IDK${multiplier}.png`),
  buildEmote('illuminati_1', `${px}/Illuminati${multiplier}-1.png`),
  buildEmote('illuminati_2', `${px}/Illuminati${multiplier}.png`),
  buildEmote('laser_gun', `${px}/laser%20gun${multiplier}.png`),
  buildEmote('lollipop', `${px}/Lollipop${multiplier}.png`),
  buildEmote('monster', `${px}/Monster${multiplier}.png`),
  buildEmote('mushroom', `${px}/mushroom${multiplier}.png`),
  buildEmote('nail_it', `${px}/Nail%20It${multiplier}.png`),
  buildEmote('pizza', `${px}/pizza${multiplier}.png`),
  buildEmote('rabbit_hole', `${px}/rabbit%20hole${multiplier}.png`),
  buildEmote('rainbow_puke_2', `${px}/rainbow%20puke${multiplier}.png`),
  buildEmote('rock', `${px}/ROCK${multiplier}.png`),
  buildEmote('salty', `${px}/salty${multiplier}.png`),
  buildEmote('slime_down', `${px}/slime%20down${multiplier}.png`),
  buildEmote('smelly_socks', `${px}/smelly%20socks${multiplier}.png`),
  buildEmote('spock', `${px}/SPOCK${multiplier}.png`),
  buildEmote('star', `${px}/Star${multiplier}.png`),
  buildEmote('sunny_day', `${px}/sunny%20day${multiplier}.png`),
  buildEmote('sweet', `${px}/sweet${multiplier}.png`),
  buildEmote('thumb_up_2', `${px}/thumb%20up${multiplier}.png`),
  buildEmote('tinfoil_hat', `${px}/tin%20hat${multiplier}.png`),
  buildEmote('troll_king', `${px}/Troll%20king${multiplier}.png`),
  buildEmote('ufo', `${px}/ufo${multiplier}.png`),
  buildEmote('woodoo_doll', `${px}/woodo%20doll${multiplier}.png`),
  buildEmote('hyper_troll', `${px}/HyperTroll${multiplier}.png`),
  buildEmote('space_chad', `${px}/space%20chad${multiplier}.png`),
  buildEmote('space_doge', `${px}/doge${multiplier}.png`),
  buildEmote('space_green_wojak', `${px}/space%20wojak${multiplier}-1.png`),
  buildEmote('space_julian', `${px}/Space%20Julian${multiplier}.png`),
  buildEmote('space_red_wojak', `${px}/space%20wojak${multiplier}.png`),
  buildEmote('space_resitas', `${px}/resitas${multiplier}.png`),
  buildEmote('space_tom', `${px}/space%20Tom${multiplier}.png`),
  buildEmote('waiting', `${px}/waiting${multiplier}.png`),
];

const buildTwemote = (name: string, path: string) => ({
  name: `:${name}:`,
  url: '/public/img/emoticons/twemoji/' + path,
});
const getTwemotes = (category) => {
  switch (category) {
    case 'SMILIES':
      return [
        buildTwemote('grinning', `smilies/grinning.png`),
        buildTwemote('smiley', `smilies/smiley.png`),
        buildTwemote('smile', `smilies/smile.png`),
        buildTwemote('grin', `smilies/grin.png`),
        buildTwemote('laughing', `smilies/laughing.png`),
        buildTwemote('sweat_smile', `smilies/sweat_smile.png`),
        buildTwemote('joy', `smilies/joy.png`),
        buildTwemote('rofl', `smilies/rofl.png`),
        buildTwemote('relaxed', `smilies/relaxed.png`),

        buildTwemote('blush', `smilies/blush.png`),
        buildTwemote('innocent', `smilies/innocent.png`),
        buildTwemote('slight_smile', `smilies/slight_smile.png`),
        buildTwemote('upside_down_face', `smilies/upside_down_face.png`),
        buildTwemote('wink', `smilies/wink.png`),
        buildTwemote('relieved', `smilies/relieved.png`),
        buildTwemote('smiling_face_with_tear', `smilies/smiling_face_with_tear.png`),
        buildTwemote('heart_eyes', `smilies/heart_eyes.png`),
        buildTwemote('smiling_face_with_hearts', `smilies/smiling_face_with_hearts.png`),

        buildTwemote('kissing_heart', `smilies/kissing_heart.png`),
        buildTwemote('kissing', `smilies/kissing.png`),
        buildTwemote('kissing_smiling_eyes', `smilies/kissing_smiling_eyes.png`),
        buildTwemote('kissing_closed_eyes', `smilies/kissing_closed_eyes.png`),
        buildTwemote('yum', `smilies/yum.png`),
        buildTwemote('stuck_out_tongue', `smilies/stuck_out_tongue.png`),
        buildTwemote('stuck_out_tongue_closed_eyes', `smilies/stuck_out_tongue_closed_eyes.png`),
        buildTwemote('stuck_out_tongue_winking_eye', `smilies/stuck_out_tongue_winking_eye.png`),
        buildTwemote('zany', `smilies/zany.png`),

        buildTwemote('raised_eyebrow', `smilies/raised_eyebrow.png`),
        buildTwemote('monocle', `smilies/monocle.png`),
        buildTwemote('nerd_face', `smilies/nerd_face.png`),
        buildTwemote('sunglasses', `smilies/sunglasses.png`),
        buildTwemote('star_struck', `smilies/star_struck.png`),
        buildTwemote('partying', `smilies/partying.png`),
        buildTwemote('smirk', `smilies/smirk.png`),
        buildTwemote('unamused', `smilies/unamused.png`),
        buildTwemote('disappointed', `smilies/disappointed.png`),

        buildTwemote('pensive', `smilies/pensive.png`),
        buildTwemote('worried', `smilies/worried.png`),
        buildTwemote('confused', `smilies/confused.png`),
        buildTwemote('slightly_frowning_face', `smilies/slightly_frowning_face.png`),
        buildTwemote('frowning_face', `smilies/frowning_face.png`),
        buildTwemote('persevere', `smilies/persevere.png`),
        buildTwemote('confounded', `smilies/confounded.png`),
        buildTwemote('tired_face', `smilies/tired_face.png`),
        buildTwemote('weary', `smilies/weary.png`),

        buildTwemote('pleading', `smilies/pleading.png`),
        buildTwemote('cry', `smilies/cry.png`),
        buildTwemote('sob', `smilies/sob.png`),
        buildTwemote('triump', `smilies/triumph.png`),
        buildTwemote('exhaling', `smilies/exhaling.png`),
        buildTwemote('angry', `smilies/angry.png`),
        buildTwemote('rage', `smilies/rage.png`),
        buildTwemote('symbols_over_mouth', `smilies/symbols_over_mouth.png`),
        buildTwemote('exploding_head', `smilies/exploding_head.png`),

        buildTwemote('flushed', `smilies/flushed.png`),
        buildTwemote('face_in_clouds', `smilies/face_in_clouds.png`),
        buildTwemote('hot', `smilies/hot.png`),
        buildTwemote('cold', `smilies/cold.png`),
        buildTwemote('scream', `smilies/scream.png`),
        buildTwemote('fearful', `smilies/fearful.png`),
        buildTwemote('cold_sweat', `smilies/cold_sweat.png`),
        buildTwemote('disappointed_relieved', `smilies/disappointed_relieved.png`),
        buildTwemote('sweat', `smilies/sweat.png`),

        buildTwemote('hugging', `smilies/hugging.png`),
        buildTwemote('thinking', `smilies/thinking.png`),
        buildTwemote('hand_over_mouth', `smilies/hand_over_mouth.png`),
        buildTwemote('yawning', `smilies/yawning.png`),
        buildTwemote('shushing', `smilies/shushing.png`),
        buildTwemote('lying_face', `smilies/lying_face.png`),
        buildTwemote('no_mouth', `smilies/no_mouth.png`),
        buildTwemote('neutral_face', `smilies/neutral_face.png`),
        buildTwemote('expressionless', `smilies/expressionless.png`),

        buildTwemote('grimacing', `smilies/grimacing.png`),
        buildTwemote('roll_eyes', `smilies/roll_eyes.png`),
        buildTwemote('hushed', `smilies/hushed.png`),
        buildTwemote('frowning', `smilies/frowning.png`),
        buildTwemote('anguished', `smilies/anguished.png`),
        buildTwemote('open_mouth', `smilies/open_mouth.png`),
        buildTwemote('astonished', `smilies/astonished.png`),
        buildTwemote('sleeping', `smilies/sleeping.png`),
        buildTwemote('drooling_face', `smilies/drooling_face.png`),

        buildTwemote('sleepy', `smilies/sleepy.png`),
        buildTwemote('dizzy_face', `smilies/dizzy_face.png`),
        buildTwemote('spiral_eyes', `smilies/spiral_eyes.png`),
        buildTwemote('zipper_mouth_face', `smilies/zipper_mouth_face.png`),
        buildTwemote('woozy', `smilies/woozy.png`),
        buildTwemote('nauseated_face', `smilies/nauseated_face.png`),
        buildTwemote('vomiting', `smilies/vomiting.png`),
        buildTwemote('sneezing_face', `smilies/sneezing_face.png`),
        buildTwemote('mask', `smilies/mask.png`),
      ];
    case 'ANIMALS':
      return [
        buildTwemote('dog', `animals/dog.png`),
        buildTwemote('cat', `animals/cat.png`),
        buildTwemote('mouse', `animals/mouse.png`),
        buildTwemote('hamster', `animals/hamster.png`),
        buildTwemote('rabbit', `animals/rabbit.png`),
        buildTwemote('fox', `animals/fox.png`),
        buildTwemote('bear', `animals/bear.png`),
        buildTwemote('panda', `animals/panda.png`),
        buildTwemote('polar_bear', `animals/polar_bear.png`),

        buildTwemote('koala', `animals/koala.png`),
        buildTwemote('tiger', `animals/tiger.png`),
        buildTwemote('lion', `animals/lion.png`),
        buildTwemote('cow', `animals/cow.png`),
        buildTwemote('pig', `animals/pig.png`),
        buildTwemote('pig_nose', `animals/pig_nose.png`),
        buildTwemote('frog', `animals/frog.png`),
        buildTwemote('monkey', `animals/monkey.png`),
        buildTwemote('see_no_evil', `animals/see_no_evil.png`),

        buildTwemote('hear_no_evil', `animals/hear_no_evil.png`),
        buildTwemote('speak_no_evil', `animals/speak_no_evil.png`),
      ];
    case 'ACTIVITIES':
      return [
        buildTwemote('soccer', `activities/soccer.png`),
        buildTwemote('american_football', `activities/american_football.png`),
        buildTwemote('basketball', `activities/basketball.png`),
        buildTwemote('baseball', `activities/baseball.png`),
        buildTwemote('tennis', `activities/tennis.png`),
        buildTwemote('volleyball', `activities/volleyball.png`),
        buildTwemote('softball', `activities/softball.png`),
        buildTwemote('rugby_football', `activities/rugby_football.png`),
        buildTwemote('ping_pong', `activities/ping_pong.png`),
        buildTwemote('ice_hockey', `activities/ice_hockey.png`),

        buildTwemote('pc', `activities/pc.png`),
        buildTwemote('switch', `activities/switch.png`),
        buildTwemote('ps5', `activities/ps5.png`),
        buildTwemote('xbox', `activities/xbox.png`),
        buildTwemote('vr', `activities/vr.png`),
        buildTwemote('video_game', `activities/video_game.png`),

        buildTwemote('joystick', `activities/joystick.png`),
        buildTwemote('smartphone', `activities/smartphone.png`),
        buildTwemote('gameboy', `activities/gameboy.png`),
        buildTwemote('arcade', `activities/arcade.png`),
      ];
    case 'SYMBOLS':
      return [
        buildTwemote('heart', `symbols/heart.png`),
        buildTwemote('orange_hear', `symbols/orange_hear.png`),
        buildTwemote('yellow_heart', `symbols/yellow_heart.png`),
        buildTwemote('green_heart', `symbols/green_heart.png`),
        buildTwemote('blue_heart', `symbols/blue_heart.png`),
        buildTwemote('purple_heart', `symbols/purple_heart.png`),
        buildTwemote('brown_heart', `symbols/brown_heart.png`),
        buildTwemote('black_heart', `symbols/black_heart.png`),
        buildTwemote('white_heart', `symbols/white_heart.png`),
        buildTwemote('growing_heart', `symbols/growing_heart.png`),

        buildTwemote('sparkling_heart', `symbols/sparkling_heart.png`),
        buildTwemote('heart_with_ribbon', `symbols/heart_with_ribbon.png`),
        buildTwemote('mending_heart', `symbols/mending_heart.png`),
        buildTwemote('broken_heart', `symbols/broken_heart.png`),
        buildTwemote('beating_heart', `symbols/beating_heart.png`),
        buildTwemote('heart_with_arrow', `symbols/heart_with_arrow.png`),
        buildTwemote('revolving_hearts', `symbols/revolving_hearts.png`),
        buildTwemote('two_hearts', `symbols/two_hearts.png`),
        buildTwemote('heart_exclamation', `symbols/heart_exclamation.png`),

        buildTwemote('pixel_heart', `symbols/pixel_heart.png`),
      ];
    case 'PLANTS':
      return [
        buildTwemote('deciduous_tree', `plants/deciduous_tree.png`),
        buildTwemote('evergreen_tree', `plants/evergreen_tree.png`),
        buildTwemote('palm_tree', `plants/palm_tree.png`),
        buildTwemote('cactus', `plants/cactus.png`),
        buildTwemote('mushroom', `plants/mushroom.png`),
        buildTwemote('herb', `plants/herb.png`),
        buildTwemote('lotus', `plants/lotus.png`),
        buildTwemote('cherry_blossom', `plants/cherry_blossom.png`),
        buildTwemote('tulip', `plants/tulip.png`),
      ];
    case 'FLAGS':
      return [
        buildTwemote('white_flag', `flags/white_flag.png`),
        buildTwemote('black_flag', `flags/black_flag.png`),
        // buildTwemote('chequered_flag', `flags/chequered_flag.png`),
        // buildTwemote('triangular_flag', `flags/triangular_flag.png`),
        // buildTwemote('crossed_flags', `flags/crossed_flags.png`),
        buildTwemote('pirate_flag', `flags/pirate_flag.png`),
        buildTwemote('rainbow_flag', `flags/rainbow_flag.png`),
        buildTwemote('transgender_flag', `flags/transgender_flag.png`),
        buildTwemote('kek_flag', `flags/kek_flag.png`),

        buildTwemote('anarchocapitalism_flag', `flags/anarchocapitalism_flag.png`),
        buildTwemote('communism_flag', `flags/communism_flag.png`),
        buildTwemote('antifa_flag', `flags/antifa_flag.png`),
        buildTwemote('gadsden_flag', `flags/gadsden_flag.png`),
      ];
  }
};

/* missing
- exhaling
- face_in_clouds
- hugging
- yawning
- spiral_eyes
*/

export const EMOTES_24px = getEmotes('24%20px', '');
export const EMOTES_36px = getEmotes('36px', '%401.5x');
export const EMOTES_48px = getEmotes('48%20px', '%402x');
export const EMOTES_72px = getEmotes('72%20px', '%403x');
export const TWEMOTES = {
  SMILIES: getTwemotes('SMILIES'),
  ANIMALS: getTwemotes('ANIMALS'),
  ACTIVITIES: getTwemotes('ACTIVITIES'),
  SYMBOLS: getTwemotes('SYMBOLS'),
  PLANTS: getTwemotes('PLANTS'),
  FLAGS: getTwemotes('FLAGS'),
};
