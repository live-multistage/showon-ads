'use client';

import { useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  SimpleCustomSelect,
  Skeleton,
  type SelectOption,
} from '@live-show/design-system';
import { useActiveAdvertiserAccount } from '../providers/ActiveAdvertiserAccountProvider';
import { useAdvertiserMembersQuery } from '@/features/advertisements/queries/use-advertiser-members';
import { useRenameAdvertiserMutation } from '@/features/advertisements/mutations/use-rename-advertiser.mutation';
import { useSession } from '@/features/auth/hooks/use-session';
import { normalizeError } from '@/shared/api/client';
import type { AdvertiserMemberRole } from '@/features/advertisements/types/advertisement.types';
import styles from './AccountPage.module.scss';

const ROLE_LABEL: Record<AdvertiserMemberRole, string> = {
  OWNER: 'Proprietário',
  MANAGER: 'Gerente',
};

// V1 members list is read-only (invites out of scope) — only the account
// name can be edited here, and only by an OWNER of the active account.
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

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

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
        <Skeleton className={styles.skeletonCard} aria-label="Carregando conta" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className={styles.page}>
        <Card>
          <CardContent className={styles.empty}>
            <p>Nenhuma conta de anunciante encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {accounts.length > 1 && (
        <SimpleCustomSelect
          value={activeAccountId ?? undefined}
          onValueChange={setActiveAccountId}
          options={accountOptions}
          placeholder="Selecione uma conta"
        />
      )}

      <Card>
        <CardHeader className={styles.accountHeader}>
          {isEditingName ? (
            <form onSubmit={handleSubmit} className={styles.nameForm} noValidate>
              <Input
                autoFocus
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                disabled={rename.isPending}
                aria-label="Nome da conta"
              />
              <Button type="submit" size="sm" disabled={rename.isPending}>
                Salvar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(false)}
                disabled={rename.isPending}
              >
                Cancelar
              </Button>
            </form>
          ) : (
            <div className={styles.nameRow}>
              <CardTitle>{account.name}</CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm" onClick={startEditing}>
                  Editar nome
                </Button>
              )}
            </div>
          )}

          {rename.error && (
            <p className={styles.error} role="alert">
              {normalizeError(rename.error).message}
            </p>
          )}

          <div className={styles.badges}>
            <Badge variant={account.status === 'ACTIVE' ? 'default' : 'destructive'}>
              {account.status === 'ACTIVE' ? 'Ativa' : 'Suspensa'}
            </Badge>
            {account.organizationId && <Badge variant="secondary">Vinculada a uma organização</Badge>}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
        </CardHeader>
        <CardContent>
          {isMembersLoading && (
            <div aria-label="Carregando membros">
              <Skeleton className={styles.skeletonRow} />
              <Skeleton className={styles.skeletonRow} />
            </div>
          )}

          {!isMembersLoading && members.length === 0 && <p>Nenhum membro encontrado.</p>}

          {!isMembersLoading && members.length > 0 && (
            <ul className={styles.memberList}>
              {members.map((member) => (
                <li key={member.userId} className={styles.memberRow}>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.displayName ?? member.userId}</span>
                    {member.email && <span className={styles.memberEmail}>{member.email}</span>}
                  </div>
                  <Badge variant="outline">{ROLE_LABEL[member.role]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
