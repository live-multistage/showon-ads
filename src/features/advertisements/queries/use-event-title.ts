'use client';

import { useQuery } from '@tanstack/react-query';
import { eventsService } from '../services/events.service';

// Título do evento de destino. Se o evento não carregar, quem usa cai no
// rótulo genérico "Evento" — o nome é só conforto, nunca bloqueia a tela.
export function useEventTitleQuery(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', 'title', eventId ?? ''],
    queryFn: () => eventsService.getTitle(eventId!),
    enabled: Boolean(eventId),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
