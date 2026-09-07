import type { ReactNode } from 'react';
import styles from './auth.module.css';

export default function AuthShell({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.page} aria-labelledby="auth-title">
      <div className={styles.panel}>
        <header className={styles.heading}>
          <p className={styles.brand}>易凡文化</p>
          <h1 id="auth-title">{title}</h1>
          <p className={styles.description}>{description}</p>
        </header>
        {children}
      </div>
    </section>
  );
}
