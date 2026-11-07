import type { AdFormat } from '@/features/advertisements/types/advertisement.types';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 52_428_800;
export const MIN_VIDEO_SEC = 1;
export const MAX_VIDEO_SEC = 30;

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ASPECT_16_9 = 16 / 9;
const ASPECT_TOLERANCE = 0.02;
const WIDE_MIN = { width: 1280, height: 720 };
const BANNER_SIZE: Partial<Record<AdFormat, { width: number; height: number }>> = {
  HORIZONTAL_728x90: { width: 728, height: 90 },
  VERTICAL_300x600: { width: 300, height: 600 },
};

export interface FileFacts {
  type: string;
  name: string;
  size: number;
}

export interface MediaFacts {
  width: number;
  height: number;
  durationSec?: number;
}

const is16by9 = (w: number, h: number) => Math.abs(w / h - ASPECT_16_9) / ASPECT_16_9 <= ASPECT_TOLERANCE;

// Primeira linha de defesa, antes do envio: o que dá para saber só pelo
// arquivo (tipo e tamanho). O backend continua sendo a barreira final.
export function validateFileBasics(format: AdFormat, file: FileFacts): string | null {
  if (format === 'VIDEO_16_9') {
    if (file.type === 'video/quicktime' || /\.mov$/i.test(file.name)) return 'Envie um arquivo MP4.';
    if (file.type !== 'video/mp4') return 'Envie um arquivo MP4.';
    if (file.size > MAX_VIDEO_BYTES) return 'O vídeo deve ter no máximo 50MB.';
    return null;
  }
  if (!IMAGE_TYPES.includes(file.type)) return 'Envie uma imagem PNG, JPG ou WEBP.';
  if (file.size > MAX_IMAGE_BYTES) return 'A imagem deve ter no máximo 2 MB.';
  return null;
}

// Depois de ler as dimensões/duração do arquivo.
export function validateMedia(format: AdFormat, media: MediaFacts): string | null {
  const { width, height } = media;
  if (format === 'VIDEO_16_9') {
    const sec = media.durationSec ?? 0;
    if (sec > MAX_VIDEO_SEC) return `O vídeo tem ${Math.round(sec)} s. O limite é ${MAX_VIDEO_SEC} s.`;
    if (sec < MIN_VIDEO_SEC) return `O vídeo precisa ter pelo menos ${MIN_VIDEO_SEC} s.`;
    if (!is16by9(width, height)) {
      return height > width
        ? 'O vídeo é vertical (9:16). Este formato pede 16:9.'
        : 'O vídeo precisa ser 16:9.';
    }
    return null;
  }
  if (format === 'WIDE_16_9') {
    if (width < WIDE_MIN.width || height < WIDE_MIN.height || !is16by9(width, height)) {
      return 'A imagem precisa ser 16:9 e ter pelo menos 1280×720.';
    }
    return null;
  }
  const target = BANNER_SIZE[format];
  if (!target) return null;
  // Aceita a medida exata ou o dobro (retina), sempre na mesma proporção.
  const scale = width / target.width;
  const sameShape = Number.isInteger(scale) && scale >= 1 && height === target.height * scale;
  return sameShape ? null : `Este tamanho pede ${target.width}×${target.height} e até 2 MB.`;
}

// Lê dimensões (e duração, no vídeo) no navegador. Resolve null se o arquivo
// não abre — aí o backend decide.
export function readMediaFacts(file: File, format: AdFormat): Promise<MediaFacts | null> {
  const url = URL.createObjectURL(file);
  const done = <T,>(value: T) => {
    URL.revokeObjectURL(url);
    return value;
  };

  if (format === 'VIDEO_16_9') {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () =>
        resolve(done({ width: video.videoWidth, height: video.videoHeight, durationSec: video.duration }));
      video.onerror = () => resolve(done(null));
      video.src = url;
    });
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(done({ width: image.naturalWidth, height: image.naturalHeight }));
    image.onerror = () => resolve(done(null));
    image.src = url;
  });
}
