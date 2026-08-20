import { describe, it, expect } from 'vitest';
import {
  acceptedFormatsFor,
  ALL_PLACEMENTS,
  DEFAULT_PLACEMENTS,
  PLACEMENT_ACCEPTED_FORMATS,
  FORMAT_SHORT,
  PLACEMENT_LABEL,
  FORMAT_LABEL,
} from './ad-display';

describe('ad-display', () => {
  describe('acceptedFormatsFor', () => {
    it('PRE_ROLL accepts only VIDEO_16_9', () => {
      expect(acceptedFormatsFor(['PRE_ROLL'])).toEqual(['VIDEO_16_9']);
    });

    it('PRE_ROLL cannot combine with page placements', () => {
      expect(acceptedFormatsFor(['PRE_ROLL', 'FEED'])).toEqual([]);
    });

    it('page placements accept their shared formats', () => {
      expect(acceptedFormatsFor(['FEED', 'EVENT_DETAIL'])).toEqual([
        'HORIZONTAL_728x90',
        'VERTICAL_300x600',
      ]);
    });

    it('PLAYER_PAUSE accepts only WIDE_16_9', () => {
      expect(acceptedFormatsFor(['PLAYER_PAUSE'])).toEqual(['WIDE_16_9']);
    });
  });

  describe('placements', () => {
    it('PRE_ROLL is selectable but not a default placement', () => {
      expect(ALL_PLACEMENTS).toContain('PRE_ROLL');
      expect(DEFAULT_PLACEMENTS).not.toContain('PRE_ROLL');
    });

    it('DEFAULT_PLACEMENTS excludes exclusive placements', () => {
      expect(DEFAULT_PLACEMENTS).not.toContain('PRE_ROLL');
      expect(DEFAULT_PLACEMENTS).not.toContain('PLAYER_PAUSE');
    });
  });

  describe('matrix', () => {
    it('PRE_ROLL -> VIDEO_16_9', () => {
      expect(PLACEMENT_ACCEPTED_FORMATS['PRE_ROLL']).toEqual(['VIDEO_16_9']);
    });

    it('VIDEO_16_9 is only accepted by PRE_ROLL placement', () => {
      const videoAcceptedPlacements = Object.entries(PLACEMENT_ACCEPTED_FORMATS)
        .filter(([_, formats]) => formats.includes('VIDEO_16_9'))
        .map(([placement]) => placement);

      // VIDEO_16_9 is only accepted by PRE_ROLL
      expect(videoAcceptedPlacements).toEqual(['PRE_ROLL']);
    });

    it('WIDE_16_9 is only accepted by PLAYER_PAUSE', () => {
      const wideAcceptedPlacements = Object.entries(PLACEMENT_ACCEPTED_FORMATS)
        .filter(([_, formats]) => formats.includes('WIDE_16_9'))
        .map(([placement]) => placement);

      // WIDE_16_9 is only accepted by PLAYER_PAUSE
      expect(wideAcceptedPlacements).toEqual(['PLAYER_PAUSE']);
    });
  });

  describe('labels', () => {
    it('PRE_ROLL label is "Pre-roll (antes da live)"', () => {
      expect(PLACEMENT_LABEL['PRE_ROLL']).toBe('Pre-roll (antes da live)');
    });

    it('VIDEO_16_9 format label is "Vídeo 16:9"', () => {
      expect(FORMAT_LABEL['VIDEO_16_9']).toBe('Vídeo 16:9');
    });

    it('VIDEO_16_9 format short is "Vídeo"', () => {
      expect(FORMAT_SHORT['VIDEO_16_9']).toBe('Vídeo');
    });

    it('FORMAT_SHORT includes all formats', () => {
      expect(FORMAT_SHORT).toHaveProperty('HORIZONTAL_728x90');
      expect(FORMAT_SHORT).toHaveProperty('VERTICAL_300x600');
      expect(FORMAT_SHORT).toHaveProperty('WIDE_16_9');
      expect(FORMAT_SHORT).toHaveProperty('VIDEO_16_9');
    });
  });
});
