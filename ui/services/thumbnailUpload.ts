import { ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { IMG_CDN_PUBLISH_URL } from 'constants/cdn_urls';
import { HYPERBEAM_DEVICE, hyperbeamDeviceBase, hyperbeamDevicePostParams64 } from 'util/hyperbeamDevices';

export default function uploadThumbnail(data: FormData): Promise<any> {
  const node = String(ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');

  if (node && hyperbeamDeviceBase(HYPERBEAM_DEVICE.productEvents)) {
    return uploadThumbnailThroughHyperbeamNode(node, data);
  }

  return fetch(IMG_CDN_PUBLISH_URL, {
    method: 'POST',
    body: data,
  })
    .then((res) => res.text())
    .then(parseUploadResponse);
}

async function uploadThumbnailThroughHyperbeamNode(node: string, data: FormData): Promise<any> {
  const file = data.get('file-input');
  if (!(file instanceof Blob)) {
    throw new Error('Thumbnail upload missing file');
  }

  const request = hyperbeamDevicePostParams64(HYPERBEAM_DEVICE.productEvents, 'thumbnail_upload', {
    filename: file instanceof File ? file.name : 'thumbnail',
    content_type: file.type || 'application/octet-stream',
    content_base64: await blobToBase64(file),
  });
  if (!request) throw new Error('HyperBEAM thumbnail upload device is not configured.');

  return request.then((res) => res.json());
}

function parseUploadResponse(text: string) {
  try {
    return text.length ? JSON.parse(text) : {};
  } catch {
    throw new Error(text);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
    });
    reader.addEventListener('error', () => reject(reader.error || new Error('Failed to read thumbnail')));
    reader.readAsDataURL(blob);
  });
}
