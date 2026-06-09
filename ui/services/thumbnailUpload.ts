import { ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { IMG_CDN_PUBLISH_URL } from 'constants/cdn_urls';
import { HYPERBEAM_DEVICE, hyperbeamDeviceBase, hyperbeamDeviceUrl } from 'util/hyperbeamDevices';

export default function uploadThumbnail(data: FormData): Promise<any> {
  const node = String(ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');

  if (node) {
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

  const params64 = base64Url(
    JSON.stringify({
      filename: file instanceof File ? file.name : 'thumbnail',
      content_type: file.type || 'application/octet-stream',
      content_base64: await blobToBase64(file),
    })
  );

  const url = hyperbeamDeviceUrl(HYPERBEAM_DEVICE.productEvents, 'thumbnail_upload', { params64 });
  const usePost = url.length > 1800;
  const deviceBase = hyperbeamDeviceBase(HYPERBEAM_DEVICE.productEvents);

  return fetch(usePost ? `${deviceBase}/thumbnail_upload` : url, {
    method: usePost ? 'POST' : 'GET',
    headers: {
      accept: 'application/json',
      ...(usePost ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(usePost ? { body: JSON.stringify({ params64 }) } : {}),
  }).then((res) => res.json());
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

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
