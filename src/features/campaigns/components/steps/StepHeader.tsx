import styles from './StepHeader.module.scss';

interface Props {
  step: 1 | 2 | 3 | 4;
  title: string;
  lead?: string;
}

// Cabeçalho comum dos quatro passos: "PASSO N DE 4", título e frase de apoio.
export function StepHeader({ step, title, lead }: Props) {
  return (
    <header className={styles.header}>
      <span className={styles.eyebrow}>PASSO {step} DE 4</span>
      <h2 className={styles.title}>{title}</h2>
      {lead && <p className={styles.lead}>{lead}</p>}
    </header>
  );
}
