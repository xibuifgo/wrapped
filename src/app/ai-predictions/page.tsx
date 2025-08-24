"use client";

import pollData from "../json_files/polls.json";
import styles from "./ai-predictions.module.scss";

type PollsData = {
  people: string[];
  honorary: string[];
};

export default function AIPage() {
    const polls = pollData as PollsData;
    const allPeople = [...polls.people];
    
    // Create leaderboard with everyone at 0 points for now
    const leaderboard = allPeople.map((person, index) => ({
        name: person,
        score: 0,
        rank: index + 1
    }));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>AI Predictions Leaderboard</h1>
                <p className={styles.subtitle}>Who did AI predict the best?</p>
            </div>
            
            <div className={styles.leaderboard}>
                <div className={styles.leaderboardHeader}>
                    <span className={styles.rankColumn}>Rank</span>
                    <span className={styles.nameColumn}>Name</span>
                    <span className={styles.scoreColumn}>Score</span>
                </div>
                
                {leaderboard.map((player, index) => (
                    <a key={player.name + "-link"} href={`/ai-predictions/${player.name}`}>
                        <div 
                            key={player.name} 
                            className={`${styles.leaderboardRow} ${index < 3 ? styles.topThree : ''}`}
                        >
                            <div className={styles.rankColumn}>
                                <span className={styles.rank}>
                                    {index === 0 && "🥇"}
                                    {index === 1 && "🥈"}
                                    {index === 2 && "🥉"}
                                    {index > 2 && `#${player.rank}`}
                                </span>
                            </div>
                            <div className={styles.nameColumn}>
                                <span className={styles.playerName}>{player.name}</span>
                            </div>
                            <div className={styles.scoreColumn}>
                                <span className={styles.score}>{player.score}</span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
            
            <div className={styles.footer}>
                <p>Scores will be updated as soon as you upvote / downvote someone&apos;s prediction.</p>
            </div>
        </div>
    )
}