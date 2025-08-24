import styles from './farm-adventures.module.scss';

export default function FarmAdventuresPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Farm Adventures</h1>

      <div className={styles.sign} aria-label="Wooden sign with carved text">
        <div className={styles.signInner}>
          <p className={styles.carvedText}>
            Troll Path 88 --&gt; Speak to cows backwards 45 --&gt; Speak to cows in German 16 --&gt; Correct 23 --&gt; Correct 97 --&gt; One cow 36 --&gt; Minecraft Cows
          </p>
        </div>
      </div>
    </div>
  );
}