// @flow
import { IMAGE_PROXY_URL, THUMBNAIL_CDN_URL, THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH, THUMBNAIL_QUALITY } from 'config';

type Props = {
  thumbnail: ?string,
  height?: number,
  width?: number,
  quality?: number,
};

export function getThumbnailCdnUrl(props: Props) {
  const { thumbnail, height = THUMBNAIL_HEIGHT, width = THUMBNAIL_WIDTH, quality = THUMBNAIL_QUALITY } = props;
  /*
  if(props.thumbnail.indexOf('b7c8c2f80c184cab231391924a383f41') !== -1){
    console.log('Get Thumbnail Props: ', props.thumbnail)  
    return 'https://i1.kym-cdn.com/photos/images/original/000/682/636/a56.jpg'
  }*/

  if (!THUMBNAIL_CDN_URL || !thumbnail) {
    return thumbnail;
  }

  if (thumbnail.includes(THUMBNAIL_CDN_URL)) {
    return thumbnail;
  }

  if (thumbnail.includes('static.odycdn.com/emoticons/')) {
    return thumbnail;
  }

  if (thumbnail) {
    return `${THUMBNAIL_CDN_URL}s:${width}:${height}/quality:${quality}/plain/${thumbnail}`;
  }
}

export function getImageProxyUrl(thumbnail: ?string) {
  if (
    IMAGE_PROXY_URL &&
    thumbnail &&
    !thumbnail.startsWith(THUMBNAIL_CDN_URL) &&
    !thumbnail.startsWith(IMAGE_PROXY_URL)
  ) {
    return `${IMAGE_PROXY_URL}?${thumbnail}`;
  }
  return thumbnail;
}
