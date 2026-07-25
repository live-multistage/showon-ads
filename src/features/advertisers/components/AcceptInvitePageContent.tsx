'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@live-show/design-system';
import { useInvitePreviewQuery } from '@/features/advertisements/queries/use-invite-preview';
import { useAcceptInviteMutation } from '@/features/advertisements/mutations/use-accept-invite.mutation';
import { useSession } from '@/features/auth/hooks/use-session';
import { normalizeError } from '@/shared/api/client';
import type { AdvertiserInvitePreview, AdvertiserMemberRole } from '@/features/advertisements/types/advertisement.types';
import styles from './AcceptInvitePageContent.module.scss';

const ROLE_LABEL: Record<AdvertiserMemberRole, string> = {
  OWNER: 'PROPRIETÁRIO',
  MANAGER: 'GERENTE',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Preview 404s and non-PENDING statuses all render the same "invalid" card,
// just with a status-specific reason. `null` means the invite is PENDING and
// safe to render an accept flow for.
function getInvalidReason(preview: AdvertiserInvitePreview | undefined, error: unknown): string | null {
  if (error) {
    const normalized = normalizeError(error);
    if (normalized.status === 404) return 'Este convite não existe ou já foi removido.';
    return normalized.message;
  }
  if (!preview) return 'Este convite não existe ou já foi removido.';
  if (preview.status === 'EXPIRED') return 'Este convite expirou. Peça um novo convite.';
  if (preview.status === 'REVOKED') return 'Este convite foi revogado.';
  if (preview.status === 'ACCEPTED') return 'Este convite já foi aceito.';
  return null;
}

// Backend maps: email-mismatch -> 403, expired -> 410, already-not-pending -> 409.
function acceptInviteErrorMessage(error: unknown): string {
  const normalized = normalizeError(error);
  if (normalized.status === 403) return 'Este convite foi enviado para outro endereço de email.';
  if (normalized.status === 410) return 'Este convite expirou.';
  if (normalized.status === 409) return 'Este convite já foi processado.';
  return normalized.message;
}

interface Props {
  token: string;
}

export function AcceptInvitePageContent({ token }: Props) {
  const router = useRouter();
  const { data: preview, isLoading: isPreviewLoading, error: previewError } = useInvitePreviewQuery(token);
  const { user, isAuthenticated, isLoading: isSessionLoading } = useSession();
  const acceptInvite = useAcceptInviteMutation(token);

  if (isPreviewLoading || isSessionLoading) {
    return (
      <div className={styles.page}>
        <Skeleton className={styles.skeletonCard} aria-label="Carregando convite" />
      </div>
    );
  }

  const invalidReason = getInvalidReason(preview, previewError);
  if (invalidReason) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.glow} />
          <p className={styles.eyebrow}>CONVITE</p>
          <h1 className={styles.title}>Convite inválido ou expirado</h1>
          <p className={styles.subtitle}>{invalidReason}</p>
        </div>
      </div>
    );
  }

  // getInvalidReason returned null: preview is defined and status is PENDING.
  const invite = preview as AdvertiserInvitePreview;
  const roleLabel = ROLE_LABEL[invite.role];
  const inviteUrl = `/invite/${token}`;
  const isEmailMatch = isAuthenticated && !!user && user.email.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.glow} />
        <p className={styles.eyebrow}>VOCÊ FOI CONVIDADO</p>

        <div className={styles.identity}>
          <span className={styles.avatar}>{initials(invite.accountName)}</span>
          <div className={styles.identityText}>
            <h2 className={styles.accountName}>{invite.accountName}</h2>
            <span className={styles.roleBadge}>{roleLabel}</span>
          </div>
        </div>

        <p className={styles.inviter}>
          Convidado por <strong>{invite.inviterName}</strong> para o email <strong>{invite.email}</strong>.
        </p>

        {!isAuthenticated && (
          <>
            <h1 className={styles.title}>Aceitar convite</h1>
            <p className={styles.subtitle}>
              Crie uma conta ou entre usando o email <strong>{invite.email}</strong> para aceitar este convite.
            </p>
            <div className={styles.actions}>
              <Link
                href={`/signup?email=${encodeURIComponent(invite.email)}&redirect=${encodeURIComponent(inviteUrl)}`}
                className={styles.btnPrimary}
              >
                Criar conta e aceitar
              </Link>
              <Link href={`/login?redirect=${encodeURIComponent(inviteUrl)}`} className={styles.btnSecondary}>
                Já tenho conta
              </Link>
            </div>
          </>
        )}

        {isAuthenticated && user && !isEmailMatch && (
          <>
            <h1 className={styles.title}>Conta diferente</h1>
            <p className={styles.mismatch}>
              Você está conectado como <strong>{user.email}</strong>, mas este convite é para{' '}
              <strong>{invite.email}</strong>. Saia e entre com a conta correta para aceitar.
            </p>
            <div className={styles.actions}>
              <Link href={`/login?redirect=${encodeURIComponent(inviteUrl)}`} className={styles.btnSecondary}>
                Trocar de conta
              </Link>
            </div>
          </>
        )}

        {isEmailMatch && (
          <>
            <h1 className={styles.title}>Aceitar convite</h1>
            <p className={styles.subtitle}>
              Ao aceitar, você passa a fazer parte de <strong>{invite.accountName}</strong> como{' '}
              {roleLabel.toLowerCase()}.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={acceptInvite.isPending}
                onClick={() => acceptInvite.mutate(undefined, { onSuccess: () => router.push('/account') })}
              >
                {acceptInvite.isPending ? 'Aceitando…' : 'Aceitar convite'}
              </button>
            </div>
            {acceptInvite.error && (
              <p className={styles.error} role="alert">
                {acceptInviteErrorMessage(acceptInvite.error)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
