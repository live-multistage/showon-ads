'use client';

import { useSession } from '@/features/auth/hooks/use-session';
import styles from './SettingsPage.module.scss';

// Preferences surface from the Ads Manager design. Profile is read-only (this
// app has no profile-edit endpoint) and notifications are a not-yet-wired
// placeholder — shown as disabled rather than pretending to work.
const NOTIFICATIONS = [
  { label: 'Alertas de performance', desc: 'Avisar quando o CTR cair abaixo do benchmark' },
  { label: 'Relatórios semanais', desc: 'Resumo semanal das campanhas por e-mail' },
  { label: 'Orçamento esgotado', desc: 'Avisar quando o orçamento diário for atingido' },
];

export function SettingsPage() {
  const { user } = useSession();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Configurações</h1>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Perfil</h2>
        <div className={styles.fields}>
          <Field label="NOME" value={user?.displayName ?? '—'} />
          <Field label="EMAIL" value={user?.email ?? '—'} />
        </div>
        <p className={styles.note}>Edição de perfil em breve.</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Notificações</h2>
        <div className={styles.toggles}>
          {NOTIFICATIONS.map((n) => (
            <div key={n.label} className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{n.label}</div>
                <div className={styles.toggleDesc}>{n.desc}</div>
              </div>
              <span className={styles.toggleOff} role="switch" aria-checked="false" aria-disabled="true" />
            </div>
          ))}
        </div>
        <p className={styles.note}>Preferências de notificação em breve.</p>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}
