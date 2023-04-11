// @flow
import { VJS_EVENTS } from 'constants/player';
import { platform } from 'util/platform';

const CHAPTERS__USE_CLIP_PATH = true;

// For Safari and iOS, you need to delay before adding cue points or they don't
// get added. This is because the player uses native, asynchronous tracks in the
// Safari browser and on iOS.
const REQUIRED_DELAY_FOR_IOS_MS = 10;

const MIN_SECONDS_BETWEEN_CHAPTERS = 10;
const MIN_CHAPTERS = 3;

type TimestampData = Array<{ seconds: number, label: string }>;

function isValidTimestamp(str: string) {
  let isValidTimestamp;
  switch (str.length) {
    case 4: // "9:59"
      isValidTimestamp = /^[0-9]:[0-5][0-9]$/.test(str);
      break;
    case 5: // "59:59"
      isValidTimestamp = /^[0-5][0-9]:[0-5][0-9]$/.test(str);
      break;
    case 7: // "9:59:59"
      isValidTimestamp = /^[0-9]:[0-5][0-9]:[0-5][0-9]$/.test(str);
      break;
    case 8: // "99:59:59"
      isValidTimestamp = /^[0-9][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(str);
      break;
    default:
      // Reject
      isValidTimestamp = false;
      break;
  }
  return isValidTimestamp;
}

function timestampStrToSeconds(ts: string) {
  const parts = ts.split(':').reverse();
  let seconds = 0;

  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];
    const parsed = parseInt(part);
    if (!isNaN(parsed)) {
      seconds += parsed * Math.pow(60, i);
    }
  }

  return seconds;
}

function parse(claim: StreamClaim) {
  // - Must have at least 3 timestamps.
  // - First one must be 0:00.
  // - Chapters must be at least 10 seconds apart.
  // - Format: one per line, "0:00 Blah..."

  const description = claim?.value?.description;
  if (!description) {
    return null;
  }

  const lines = description.split('\n');
  const timestamps = [];

  lines.forEach((line) => {
    if (line.length > 0) {
      const splitIndex = line.search(/[ |\t]/);
      if (splitIndex >= 0 && splitIndex < line.length - 2) {
        const ts = line.substring(0, splitIndex);
        const label = line.substring(splitIndex + 1);

        if (ts && label && isValidTimestamp(ts)) {
          const seconds = timestampStrToSeconds(ts);

          if (timestamps.length !== 0) {
            const prevSeconds = timestamps[timestamps.length - 1].seconds;
            if (seconds - prevSeconds < MIN_SECONDS_BETWEEN_CHAPTERS) {
              return null;
            }
          } else {
            if (seconds !== 0) {
              return null;
            }
          }

          timestamps.push({ seconds, label });
        }
      }
    }
  });

  return timestamps.length >= MIN_CHAPTERS ? timestamps : null;
}

function load(player: any, timestampData: TimestampData, duration: number) {
  player.one('loadedmetadata', () => {
    const textTrack = player.addRemoteTextTrack({ kind: 'chapters' }).track;

    setTimeout(() => {
      const values = Object.values(timestampData);
      values.forEach((ts, index) => {
        // $FlowIssue: mixed
        const start = ts.seconds;
        // $FlowIssue: mixed
        const end = index === values.length - 1 ? duration : values[index + 1].seconds;
        // $FlowIssue: mixed
        textTrack.addCue(new window.VTTCue(start, end, ts.label));
      });

      addMarkersOnProgressBar(
        // $FlowIssue: mixed
        values.map((v) => v.seconds),
        duration
      );

      const chaptersButton = player?.controlBar?.chaptersButton;
      if (chaptersButton) {
        chaptersButton.update();
      }
    }, REQUIRED_DELAY_FOR_IOS_MS);
  });

  player.on(VJS_EVENTS.SRC_CHANGE_CLEANUP, () => {
    delete player.chaptersInfo;
    // $FlowIssue
    player?.controlBar?.getChild('ChaptersButton')?.hide();
    removeMarkersOnProgressBar();
  });
}

export function parseAndLoad(player: any, claim: StreamClaim) {
  console.assert(claim, 'null claim');

  if (platform.isMobile() || platform.isSafari()) {
    return;
  }

  const tsData = parse(claim);
  const duration = claim?.value?.video?.duration || claim?.value?.audio?.duration;

  if (tsData && duration) {
    load(player, tsData, duration);
    player.chaptersInfo = tsData;
  } else {
    delete player.chaptersInfo;
    // $FlowIssue
    player?.controlBar?.getChild('ChaptersButton')?.hide();
  }
}

function addMarkersOnProgressBar(chapterStartTimes: Array<number>, videoDuration: number) {
  const progressControl = document.getElementsByClassName('vjs-progress-holder vjs-slider vjs-slider-horizontal')[0];
  if (!progressControl) {
    console.error('Failed to find progress-control'); // eslint-disable-line no-console
    return;
  }

  if (CHAPTERS__USE_CLIP_PATH) {
    const gapNumPixels = 3;
    const gapWidthPct = (gapNumPixels * 100) / progressControl.clientWidth;

    // The clipping region needs to extend all 4 extremes a little so that the
    // circular progress grabber (vjs-play-progress) won't be clipped.
    const CLIP_PCT = { LEFT: -10, RIGHT: 110, TOP: -500, BOTTOM: 200 };

    let clipRegion = [
      `${CLIP_PCT.LEFT}% ${CLIP_PCT.BOTTOM}%`,
      `${CLIP_PCT.LEFT}% ${CLIP_PCT.TOP}%`,
      `0% ${CLIP_PCT.TOP}%`,
      `0% ${CLIP_PCT.BOTTOM}%`,
      `${CLIP_PCT.LEFT}% ${CLIP_PCT.BOTTOM}%`,
    ];

    for (let i = 0; i < chapterStartTimes.length; ++i) {
      const isLastChapter = i === chapterStartTimes.length - 1;

      let x1 = (chapterStartTimes[i] / videoDuration) * 100 + gapWidthPct;
      let x2 = isLastChapter ? CLIP_PCT.RIGHT : (chapterStartTimes[i + 1] / videoDuration) * 100;

      x1 = x1.toFixed(2);
      x2 = x2.toFixed(2);

      clipRegion = clipRegion.concat([
        `${x1}% ${CLIP_PCT.BOTTOM}%`,
        `${x1}% ${CLIP_PCT.TOP}%`,
        `${x2}% ${CLIP_PCT.TOP}%`,
        `${x2}% ${CLIP_PCT.BOTTOM}%`,
        `${x1}% ${CLIP_PCT.BOTTOM}%`,
      ]);
    }

    // $FlowIssue
    progressControl.style['clipPath'] = `polygon(${clipRegion.join(',')})`;
  } else {
    for (let i = 0; i < chapterStartTimes.length; ++i) {
      const elem = document.createElement('div');
      // $FlowIssue
      elem['className'] = 'vjs-chapter-marker';
      // $FlowIssue
      elem['id'] = 'chapter' + i;
      elem.style.left = `${(chapterStartTimes[i] / videoDuration) * 100}%`;
      progressControl.appendChild(elem);
    }
  }
}

function removeMarkersOnProgressBar() {
  const progressControl = document.getElementsByClassName('vjs-progress-holder vjs-slider vjs-slider-horizontal')[0];
  if (!progressControl) {
    console.error('Failed to find progress-control'); // eslint-disable-line no-console
    return;
  }

  if (CHAPTERS__USE_CLIP_PATH) {
    progressControl.style.removeProperty('clip-path');
  } else {
    const chapterMarkers = progressControl.querySelectorAll('.vjs-chapter-marker');
    for (const marker of chapterMarkers) {
      progressControl.removeChild(marker);
    }
  }
}
