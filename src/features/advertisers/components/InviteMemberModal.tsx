'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  SimpleCustomSelect,
  type SelectOption,
} from '@live-show/design-system';
import { useCreateInviteMutation } from '@/features/advertisements/mutations/use-create-invite.mutation';
import { normalizeError } from '@/shared/api/client';
import type { AdvertiserMemberRole } from '@/features/advertisements/types/advertisement.types';
import styles from './InviteMemberModal.module.scss';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'OWNER', label: 'Proprietário' },
];

interface InviteMemberModalProps {
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberModal({ accountId, open, onOpenChange }: InviteMemberModalProps) {
  const createInvite = useCreateInviteMutation(accountId);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdvertiserMemberRole>('MANAGER');
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);

  function reset() {
    setEmail('');
    setRole('MANAGER');
    setAcceptUrl(null);
    createInvite.reset();
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    createInvite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (result) => {
          setAcceptUrl(result.acceptUrl);
          toast.success('Convite criado.');
        },
      },
    );
  }

  async function handleCopyLink() {
    if (!acceptUrl) return;
    await navigator.clipboard.writeText(acceptUrl);
    toast.success('Link copiado.');
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            Envie um convite por e-mail para dar acesso a esta conta anunciante.
          </DialogDescription>
        </DialogHeader>

        {acceptUrl ? (
          <div className={styles.result}>
            <span className={styles.resultLabel}>LINK DE CONVITE</span>
            <div className={styles.linkRow}>
              <Input readOnly value={acceptUrl} aria-label="Link de convite" className={styles.linkInput} />
              <button type="button" className={styles.btnPrimary} onClick={handleCopyLink}>
                Copiar link
              </button>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={() => handleOpenChange(false)}>
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="invite-email">
                E-MAIL
              </label>
              <Input
                id="invite-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={createInvite.isPending}
                placeholder="nome@empresa.com"
              />
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>FUNÇÃO</span>
              <SimpleCustomSelect
                value={role}
                onValueChange={(value) => setRole(value as AdvertiserMemberRole)}
                options={ROLE_OPTIONS}
                disabled={createInvite.isPending}
              />
            </div>

            {createInvite.error && (
              <p className={styles.error} role="alert">
                {normalizeError(createInvite.error).message}
              </p>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => handleOpenChange(false)}
                disabled={createInvite.isPending}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={createInvite.isPending}>
                {createInvite.isPending ? 'Enviando…' : 'Enviar convite'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
