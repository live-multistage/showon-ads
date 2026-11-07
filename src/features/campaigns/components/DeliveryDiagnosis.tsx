import Link from 'next/link';
import { Banner, type BannerTone } from '@/shared/components/Banner';
import { DELIVERY_DISPLAY, deliveryLabel, type Delivery } from '../utils/derive-delivery';

interface Copy {
  title?: string;
  text: string;
}

// Texto de apoio por situação: o que está acontecendo e o que fazer.
const COPY: Record<Delivery, Copy | null> = {
  ok: { title: 'Entregando normalmente', text: 'Sem nenhuma ação necessária: a campanha está sendo exibida.' },
  nofunds: {
    title: 'Parada: a carteira está sem saldo',
    text: 'Ao adicionar créditos, a campanha volta na hora, sem nova análise.',
  },
  daily: {
    text: 'A campanha volta a ser exibida quando o dia virar. O limite do dia protege seu orçamento.',
  },
  limit: {
    text: 'A campanha chegou ao limite total. Pause, aumente o limite total e reative para voltar a ser exibida.',
  },
  scheduled: { text: 'Aprovada. Entra no ar no início do período, se houver saldo.' },
  expired: { text: 'O período da campanha acabou. Para continuar, crie uma nova campanha ou ajuste as datas.' },
  review: { text: 'A equipe da showon confere o criativo e o destino. A análise costuma sair no mesmo dia útil.' },
  rejected: { text: 'A equipe pediu um ajuste. Edite a campanha e reenvie para análise.' },
  paused: { text: 'Você pausou esta campanha. Reative quando quiser voltar a ser exibida.' },
  ended: { text: 'Esta campanha foi encerrada e não volta a ser exibida.' },
  draft: { text: 'Esta campanha ainda não foi enviada para análise.' },
  novideo: { title: 'Falta enviar o vídeo', text: 'Sem o arquivo do vídeo a campanha não pode ser enviada para análise.' },
};

const TONE: Record<'ok' | 'warn' | 'err' | 'off', BannerTone> = { ok: 'ok', warn: 'warn', err: 'err', off: 'info' };

interface Props {
  delivery: Delivery;
  startsAt: string;
  rejectionReason?: string | null;
}

// Diagnóstico de entrega no topo do detalhe: por que a campanha está (ou não)
// sendo exibida, derivado de status, datas, carteira e gasto do dia.
export function DeliveryDiagnosis({ delivery, startsAt, rejectionReason }: Props) {
  const copy = COPY[delivery];
  if (!copy) return null;
  const { tone } = DELIVERY_DISPLAY[delivery];
  const title = copy.title ?? deliveryLabel(delivery, startsAt);

  return (
    <Banner
      tone={TONE[tone]}
      title={title}
      action={
        delivery === 'nofunds' ? (
          <Link href="/billing" data-testid="diagnosis-action">
            Adicionar créditos
          </Link>
        ) : undefined
      }
    >
      {delivery === 'rejected' && rejectionReason ? `${copy.text} Motivo: ${rejectionReason}` : copy.text}
    </Banner>
  );
}
