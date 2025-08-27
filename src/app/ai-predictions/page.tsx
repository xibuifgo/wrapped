"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import pollData from "../json_files/polls.json";
import styles from "./ai-predictions.module.scss";

type PollsData = {
  people: string[];
  honorary: string[];
};

function orderLeaderboard(leaderboard: { name: string; score: number; rank: number }[]) {
    // Sort by score desc, then name asc, and re-number ranks
    const sorted = [...leaderboard].sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name));
    return sorted.map((p, idx) => ({ ...p, rank: idx + 1 }));
}

export default function AIPage() {
    const polls = pollData as PollsData;
    const allPeople = [...polls.people];
    
    // Create leaderboard state with everyone at 0 points
    const [leaderboard, setLeaderboard] = useState(() =>
        orderLeaderboard(
            allPeople.map((person) => ({ name: person, score: 0, rank: 0 }))
        )
    );
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Map of name -> element for FLIP animations
    const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const prevPositionsRef = useRef<Record<string, number> | null>(null);

    // FLIP list animation when order changes
    useLayoutEffect(() => {
        const curPositions: Record<string, number> = {};
        for (const p of leaderboard) {
            const el = rowRefs.current[p.name];
            if (el) curPositions[p.name] = el.getBoundingClientRect().top;
        }

        const prev = prevPositionsRef.current;
        if (prev) {
            for (const p of leaderboard) {
                const name = p.name;
                const el = rowRefs.current[name];
                if (!el) continue;
                const prevTop = prev[name];
                const curTop = curPositions[name];
                if (prevTop != null && curTop != null) {
                    let delta = prevTop - curTop;
                    // If delta is 0 but this was the last updated row, add a tiny nudge
                    if (!delta && lastUpdated === name) delta = -4;
                    if (delta) {
                        el.style.willChange = "transform";
                        el.style.transition = "transform 0s";
                        el.style.transform = `translateY(${delta}px)`;
                        // Force reflow so the starting transform is committed
                        void el.getBoundingClientRect().width;
                        requestAnimationFrame(() => {
                            el.style.transition = "transform 300ms ease";
                            el.style.transform = "";
                            // Cleanup willChange after animation
                            setTimeout(() => { el.style.willChange = ""; }, 350);
                        });
                    }
                }
            }
        }
        prevPositionsRef.current = curPositions;
    }, [leaderboard, lastUpdated]);

    // useEffect(() => {
    //     // Optional: auto-increment a random person every second on the client
    //     const interval = setInterval(() => {
    //         setLeaderboard(prev => {
    //             const person = polls.people[Math.floor(Math.random() * polls.people.length)];
    //             setLastUpdated(person);
    //             const next = prev.map(p => p.name === person ? { ...p, score: p.score + 1 } : p);
    //             return orderLeaderboard(next);
    //         });
    //     }, 1000);
    //     return () => clearInterval(interval);
    // }, [polls.people]);

    const handlePoint = () => {
        setLeaderboard(prev => {
            const person = polls.people[Math.floor(Math.random() * polls.people.length)];
            setLastUpdated(person);
            const next = prev.map(p => p.name === person ? { ...p, score: p.score + 1 } : p);
            return orderLeaderboard(next);
        });
    };

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
                    <a
                        key={player.name + "-link"}
                        href={`/ai-predictions/${player.name}`}
                        className={lastUpdated === player.name ? styles.bump : undefined}
                    >
                        <div
                            ref={(el) => { rowRefs.current[player.name] = el; }}
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
                                <span
                                    className={`${styles.score} ${player.score < 0 ? styles.negativeScore : styles.positiveScore}`}
                                    style={{ color: player.score >= 0 ? '' : 'red' }}
                                >
                                    {player.score}
                                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            <button className={styles.btn} onClick={handlePoint}>Give point</button>
            
            <div className={styles.footer}>
                <p>Scores will be updated as soon as you upvote / downvote someone&apos;s prediction.</p>
            </div>
        </div>
    )
}