'use client';

import { useState, type FormEvent } from 'react';
import { Input, SimpleCustomSelect, Skeleton, type SelectOption } from '@live-show/design-system';
import { useActiveAdvertiserAccount } from '../providers/ActiveAdvertiserAccountProvider';
import { InviteMemberModal } from './InviteMemberModal';
import { useAdvertiserMembersQuery } from '@/features/advertisements/queries/use-advertiser-members';
import { useRenameAdvertiserMutation } from '@/features/advertisements/mutations/use-rename-advertiser.mutation';
import { useAdvertiserInvitesQuery } from '@/features/advertisements/queries/use-advertiser-invites';
import { useRevokeInviteMutation } from '@/features/advertisements/mutations/use-revoke-invite.mutation';
import { useSession } from '@/features/auth/hooks/use-session';
import { normalizeError } from '@/shared/api/client';
import type { AdvertiserMemberRole } from '@/features/advertisements/types/advertisement.types';
import styles from './AccountPage.module.scss';

const ROLE_LABEL: Record<AdvertiserMemberRole, string> = {
  OWNER: 'PROPRIETÁRIO',
  MANAGER: 'GERENTE',
};

// Days remaining until expiresAt, floored at 0 (never shows negative days
// for an already-expired invite — the row just won't be in the PENDING list).
function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCreated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/\./g, '')
    .toUpperCase();
}

// Short account id for the eyebrow: first block of the UUID, uppercased.
function shortId(id: string): string {
  return `ACC-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

// Account name edit and member invites are OWNER-only actions, gated by
// isOwner (derived from the current user's role in the members list).
export function AccountPage() {
  const { accounts, activeAccountId, setActiveAccountId, isLoading: isAccountsLoading } =
    useActiveAdvertiserAccount();
  const { user } = useSession();

  // Same gap CampaignListPage guards against: accounts resolve before the
  // provider's effect sets activeAccountId.
  const isLoading = isAccountsLoading || (accounts.length > 0 && activeAccountId === null);
  const account = accounts.find((a) => a.id === activeAccountId) ?? null;

  const { data: members = [], isLoading: isMembersLoading } = useAdvertiserMembersQuery(activeAccountId);
  const rename = useRenameAdvertiserMutation(activeAccountId ?? '');
  const { data: invites = [], isLoading: isInvitesLoading } = useAdvertiserInvitesQuery(activeAccountId);
  const revokeInvite = useRevokeInviteMutation(activeAccountId ?? '');

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === 'OWNER';

  const accountOptions: SelectOption[] = accounts.map((a) => ({ value: a.id, label: a.name }));

  function startEditing() {
    setNameDraft(account?.name ?? '');
    setIsEditingName(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nameDraft.trim()) return;
    rename.mutate({ name: nameDraft.trim() }, { onSuccess: () => setIsEditingName(false) });
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton className={styles.skeletonHeader} aria-label="Carregando conta" />
        <Skeleton className={styles.skeletonCard} />
        <Skeleton className={styles.skeletonCard} />
      </div>
    );
  }

  if (!account) {
    return (
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <span>ADS MANAGER</span>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbActive}>CONTA</span>
        </div>
        <div className={styles.emptyCard}>Nenhuma conta de anunciante encontrada.</div>
      </div>
    );
  }

  const isActive = account.status === 'ACTIVE';
  const created = formatCreated(account.createdAt);

  return (
    <div className={styles.page}>
      {/* breadcrumb */}
      <div className={styles.breadcrumb}>
        <span>ADS MANAGER</span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbActive}>CONTA</span>
      </div>

      {/* header */}
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={`${styles.statusPill} ${isActive ? styles.statusOk : styles.statusOff}`}>
            <span className={styles.statusDot} />
            {isActive ? 'CONTA ATIVA' : 'CONTA SUSPENSA'}
          </span>
          <span className={styles.headerId}>
            ID: {shortId(account.id)}
            {created && ` · CRIADA ${created}`}
          </span>
        </div>
        <h1 className={styles.title}>Conta &amp; Organização</h1>
        <p className={styles.subtitle}>
          Gerencie sua conta anunciante, membros e permissões na plataforma LIVESHOW.
        </p>
      </header>

      {/* account switcher */}
      {accounts.length > 1 && (
        <div className={styles.switcher}>
          <div className={styles.switcherLeft}>
            <span className={styles.switcherLabel}>CONTA ATIVA</span>
            <span className={styles.switcherDivider} />
            <span className={styles.switcherAvatar}>{initials(account.name)}</span>
            <span className={styles.switcherName}>{account.name}</span>
            <span className={styles.switcherDot}>·</span>
            <span className={styles.switcherCount}>
              {accounts.length} {accounts.length === 1 ? 'CONTA' : 'CONTAS'}
            </span>
          </div>
          <div className={styles.switcherSelect}>
            <SimpleCustomSelect
              value={activeAccountId ?? undefined}
              onValueChange={setActiveAccountId}
              options={accountOptions}
              placeholder="Trocar"
            />
          </div>
        </div>
      )}

      {/* big account card */}
      <section className={styles.orgCard}>
        <div className={styles.orgGlow} />
        <div className={styles.orgTop}>
          <div className={styles.orgIdentity}>
            <span className={styles.orgAvatar}>{initials(account.name)}</span>
            <div className={styles.orgIdentityText}>
              {isEditingName ? (
                <form onSubmit={handleSubmit} className={styles.nameForm} noValidate>
                  <Input
                    autoFocus
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    disabled={rename.isPending}
                    aria-label="Nome da conta"
                    className={styles.nameInput}
                  />
                  <button type="submit" className={styles.btnPrimary} disabled={rename.isPending}>
                    Salvar
                  </button>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    onClick={() => setIsEditingName(false)}
                    disabled={rename.isPending}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  <div className={styles.orgNameRow}>
                    <h2 className={styles.orgName}>{account.name}</h2>
                    {account.organizationId && (
                      <span className={styles.badgeLinked}>VINCULADA</span>
                    )}
                  </div>
                  <div className={styles.orgSubline}>
                    <span className={styles.orgSubItem}>ID {shortId(account.id)}</span>
                    {created && (
                      <>
                        <span className={styles.orgSubDot}>·</span>
                        <span>CRIADA {created}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {isOwner && !isEditingName && (
            <button type="button" className={styles.btnSecondary} onClick={startEditing}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              EDITAR NOME
            </button>
          )}
        </div>

        {rename.error && (
          <p className={styles.error} role="alert">
            {normalizeError(rename.error).message}
          </p>
        )}

        {/* stats — real data only */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>MEMBROS</div>
            <div className={styles.statValue}>{isMembersLoading ? '—' : members.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>CONTAS ANUNCIANTES</div>
            <div className={styles.statValue}>{accounts.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>STATUS</div>
            <div className={`${styles.statValue} ${isActive ? styles.statOk : styles.statOff}`}>
              {isActive ? 'ATIVA' : 'SUSPENSA'}
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>VÍNCULO</div>
            <div className={styles.statValue}>{account.organizationId ? 'ORG' : 'AVULSA'}</div>
          </div>
        </div>
      </section>

      {/* members */}
      <section className={styles.membersCard}>
        <div className={styles.membersHead}>
          <div className={styles.membersHeadLeft}>
            <span className={styles.sectionTitle}>MEMBROS</span>
            {!isMembersLoading && <span className={styles.countChip}>{members.length}</span>}
          </div>
          {isOwner && (
            <button type="button" className={styles.btnSecondary} onClick={() => setIsInviteModalOpen(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v6M22 11h-6" />
              </svg>
              CONVIDAR
            </button>
          )}
        </div>

        {isMembersLoading && (
          <div aria-label="Carregando membros" className={styles.memberList}>
            <Skeleton className={styles.skeletonRow} />
            <Skeleton className={styles.skeletonRow} />
          </div>
        )}

        {!isMembersLoading && members.length === 0 && (
          <p className={styles.membersEmpty}>Nenhum membro encontrado.</p>
        )}

        {!isMembersLoading && members.length > 0 && (
          <ul className={styles.memberList}>
            {members.map((member) => {
              const name = member.displayName ?? member.userId;
              return (
                <li key={member.userId} className={styles.memberRow}>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberAvatar}>{initials(name)}</span>
                    <div className={styles.memberText}>
                      <span className={styles.memberName}>{name}</span>
                      {member.email && <span className={styles.memberEmail}>{member.email}</span>}
                    </div>
                  </div>
                  <span
                    className={`${styles.roleBadge} ${
                      member.role === 'OWNER' ? styles.roleOwner : styles.roleManager
                    }`}
                  >
                    {ROLE_LABEL[member.role]}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* pending invites — hidden entirely when there's nothing to show */}
      {isInvitesLoading && (
        <section className={styles.membersCard} aria-label="Carregando convites">
          <Skeleton className={styles.skeletonRow} />
        </section>
      )}

      {!isInvitesLoading && invites.length > 0 && (
        <section className={styles.membersCard}>
          <div className={styles.membersHead}>
            <div className={styles.membersHeadLeft}>
              <span className={styles.sectionTitle}>CONVITES PENDENTES</span>
              <span className={styles.countChip}>{invites.length}</span>
            </div>
          </div>

          <ul className={styles.memberList}>
            {invites.map((invite) => (
              <li key={invite.id} className={styles.memberRow}>
                <div className={styles.memberInfo}>
                  <span className={styles.memberAvatar}>{initials(invite.email)}</span>
                  <div className={styles.memberText}>
                    <span className={styles.memberName}>{invite.email}</span>
                    <span className={styles.memberEmail}>EXPIRA EM {daysUntil(invite.expiresAt)}D</span>
                  </div>
                </div>
                <div className={styles.inviteRowRight}>
                  <span
                    className={`${styles.roleBadge} ${
                      invite.role === 'OWNER' ? styles.roleOwner : styles.roleManager
                    }`}
                  >
                    {ROLE_LABEL[invite.role]}
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      className={styles.btnGhost}
                      disabled={revokeInvite.isPending && revokeInvite.variables === invite.id}
                      onClick={() => revokeInvite.mutate(invite.id)}
                    >
                      Revogar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {revokeInvite.error && (
            <p className={styles.error} role="alert">
              {normalizeError(revokeInvite.error).message}
            </p>
          )}
        </section>
      )}

      {activeAccountId && (
        <InviteMemberModal
          accountId={activeAccountId}
          open={isInviteModalOpen}
          onOpenChange={setIsInviteModalOpen}
        />
      )}
    </div>
  );
}
