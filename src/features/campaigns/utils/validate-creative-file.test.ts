import { describe, it, expect } from 'vitest';
import { validateFileBasics, validateMedia } from './validate-creative-file';

const png = { type: 'image/png', name: 'a.png', size: 1000 };
const mp4 = { type: 'video/mp4', name: 'a.mp4', size: 1000 };

describe('validateFileBasics', () => {
  it('accepts a small png for a banner', () => expect(validateFileBasics('HORIZONTAL_728x90', png)).toBeNull());

  it('rejects an image over 2 MB', () =>
    expect(validateFileBasics('HORIZONTAL_728x90', { ...png, size: 2 * 1024 * 1024 + 1 })).toBe('A imagem deve ter no máximo 2 MB.'));

  it('rejects a non-image for banners and pause', () => {
    expect(validateFileBasics('WIDE_16_9', { type: 'application/pdf', name: 'a.pdf', size: 1 })).toBe('Envie uma imagem PNG, JPG ou WEBP.');
  });

  it('rejects a QuickTime .mov for video', () => {
    expect(validateFileBasics('VIDEO_16_9', { type: 'video/quicktime', name: 'making-of.mov', size: 1 })).toBe('Envie um arquivo MP4.');
    expect(validateFileBasics('VIDEO_16_9', { type: '', name: 'making-of.mov', size: 1 })).toBe('Envie um arquivo MP4.');
  });

  it('rejects a video over 50 MB and accepts exactly 50 MB', () => {
    expect(validateFileBasics('VIDEO_16_9', { ...mp4, size: 52_428_801 })).toBe('O vídeo deve ter no máximo 50MB.');
    expect(validateFileBasics('VIDEO_16_9', { ...mp4, size: 52_428_800 })).toBeNull();
  });
});

describe('validateMedia — banner', () => {
  it('accepts the exact size and the 2x retina export', () => {
    expect(validateMedia('HORIZONTAL_728x90', { width: 728, height: 90 })).toBeNull();
    expect(validateMedia('HORIZONTAL_728x90', { width: 1456, height: 180 })).toBeNull();
    expect(validateMedia('VERTICAL_300x600', { width: 600, height: 1200 })).toBeNull();
  });

  it('rejects a square cover', () => {
    expect(validateMedia('HORIZONTAL_728x90', { width: 1080, height: 1080 })).toBe('Este tamanho pede 728×90 e até 2 MB.');
  });

  it('rejects a smaller image of the right shape', () => {
    expect(validateMedia('VERTICAL_300x600', { width: 150, height: 300 })).toBe('Este tamanho pede 300×600 e até 2 MB.');
  });
});

describe('validateMedia — pause', () => {
  it('accepts 1920×1080 and the 1280×720 minimum', () => {
    expect(validateMedia('WIDE_16_9', { width: 1920, height: 1080 })).toBeNull();
    expect(validateMedia('WIDE_16_9', { width: 1280, height: 720 })).toBeNull();
  });

  it('rejects 4:5, small and non-16:9 images', () => {
    const msg = 'A imagem precisa ser 16:9 e ter pelo menos 1280×720.';
    expect(validateMedia('WIDE_16_9', { width: 1080, height: 1350 })).toBe(msg);
    expect(validateMedia('WIDE_16_9', { width: 640, height: 360 })).toBe(msg);
  });
});

describe('validateMedia — video', () => {
  it('accepts 20 s 1080p', () => expect(validateMedia('VIDEO_16_9', { width: 1920, height: 1080, durationSec: 20 })).toBeNull());

  it('rejects a long video', () =>
    expect(validateMedia('VIDEO_16_9', { width: 1920, height: 1080, durationSec: 42 })).toBe('O vídeo tem 42 s. O limite é 30 s.'));

  it('rejects a vertical video', () =>
    expect(validateMedia('VIDEO_16_9', { width: 1080, height: 1920, durationSec: 15 })).toBe('O vídeo é vertical (9:16). Este formato pede 16:9.'));

  it('rejects a video shorter than 1 s', () =>
    expect(validateMedia('VIDEO_16_9', { width: 1920, height: 1080, durationSec: 0.4 })).toBe('O vídeo precisa ter pelo menos 1 s.'));
});
