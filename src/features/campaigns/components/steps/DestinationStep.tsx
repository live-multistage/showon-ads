'use client';

import { useEffect, useState } from 'react';
import { Chip, Input, Label } from '@live-show/design-system';
import { eventsService } from '@/features/advertisements/services/events.service';
import type { EventSearchResult } from '@/features/advertisements/types/event-search.types';
import type { CampaignWizardDraft, DestinationType } from '../../hooks/use-campaign-wizard';
import styles from './DestinationStep.module.scss';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

interface DestinationStepProps {
  draft: CampaignWizardDraft;
  updateDraft: (patch: Partial<CampaignWizardDraft>) => void;
  bannerRequiredWarning: string | null;
}

export function DestinationStep({ draft, updateDraft, bannerRequiredWarning }: DestinationStepProps) {
  const [query, setQuery] = useState(draft.event?.title ?? '');
  const [results, setResults] = useState<EventSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Small local debounce — no new dependency for what a setTimeout covers.
  useEffect(() => {
    const trimmed = query.trim();
    // Skip re-searching right after a pick: query was just set to the picked
    // event's title, so re-firing would only reopen the dropdown on the same term.
    if (draft.destinationType !== 'EVENT' || trimmed.length < MIN_QUERY_LENGTH || trimmed === draft.event?.title) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(() => {
      eventsService
        .search(query.trim())
        .then((response) => {
          if (!cancelled) setResults(response.items);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, draft.destinationType, draft.event?.title]);

  function selectDestinationType(type: DestinationType) {
    if (type === draft.destinationType) return;
    updateDraft({ destinationType: type, event: null, externalUrl: '' });
    setQuery('');
    setResults([]);
  }

  function pickEvent(event: EventSearchResult) {
    updateDraft({ event });
    setQuery(event.title);
    setResults([]);
  }

  return (
    <div className={styles.step}>
      <div className={styles.toggle} role="group" aria-label="Tipo de destino">
        <Chip
          variant={draft.destinationType === 'EVENT' ? 'active' : 'default'}
          onClick={() => selectDestinationType('EVENT')}
        >
          Evento
        </Chip>
        <Chip
          variant={draft.destinationType === 'EXTERNAL_URL' ? 'active' : 'default'}
          onClick={() => selectDestinationType('EXTERNAL_URL')}
        >
          URL externa
        </Chip>
      </div>

      {draft.destinationType === 'EVENT' && (
        <div className={styles.field}>
          <Label htmlFor="event-search">Buscar evento</Label>
          <Input
            id="event-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (draft.event) updateDraft({ event: null });
            }}
            placeholder="Digite o título do evento"
          />
          {isSearching && <p className={styles.hint}>Buscando…</p>}
          {!isSearching && results.length > 0 && (
            <ul className={styles.results}>
              {results.map((result) => (
                <li key={result.id}>
                  <button type="button" className={styles.resultItem} onClick={() => pickEvent(result)}>
                    {result.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {draft.event && <p className={styles.selected}>Selecionado: {draft.event.title}</p>}
        </div>
      )}

      {draft.destinationType === 'EXTERNAL_URL' && (
        <div className={styles.field}>
          <Label htmlFor="external-url">URL de destino</Label>
          <Input
            id="external-url"
            value={draft.externalUrl}
            onChange={(event) => updateDraft({ externalUrl: event.target.value })}
            placeholder="https://exemplo.com/pagina"
          />
        </div>
      )}

      {bannerRequiredWarning && (
        <p className={styles.warning} role="alert">
          {bannerRequiredWarning}
        </p>
      )}
    </div>
  );
}
