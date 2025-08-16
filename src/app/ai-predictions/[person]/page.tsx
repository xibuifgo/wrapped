'use client'

import { useParams } from 'next/navigation';
import aiPred from "../../json_files/ai.json";
import styles from "./prediction.module.scss"
import { useEffect } from 'react';

export default function PersonAIPredictionsPage() {
    const params = useParams();
    const person = params.person as string;

    // Define unique gradient colors for each person
    const personGradients: Record<string, { start: string; end: string }> = {
        
        // carbs–chaos–Shrek; playful “swamp → sunshine”
        Nour:   { start: '#79C000', end: '#FFD166' }, // lively green → warm amber

        // princess-gremlin; sparkly + watery, cute but punchy
        Aiza:   { start: '#FF7EB3', end: '#7EF0FF' }, // candy pink → aqua

        // dependable but dramatic/aesthetic; soft warmth with a hint of whimsy
        Anica:  { start: '#FFD6A5', end: '#CDB4DB' }, // peach → lavender

        // lovable menace / main-character; bold, high-contrast “pop”
        Aliyah: { start: '#FF4D6D', end: '#4DABF7' }, // hot pink → electric blue

        // sarcastic “meh” commentator; cool, muted, understated
        Bilgesu:{ start: '#94A3B8', end: '#E2E8F0' }, // slate → light slate

        // glitter + shade; schemer w/ glam—keep regal purple → pink
        Khadeja:{ start: '#A18CD1', end: '#FBC2EB' }, // violet → blush

        // chaotic sparkle, fire outside / soft uwu inside
        Madiha: { start: '#FF6B6B', end: '#FFD6E7' }, // hot coral → soft blush

        // unpredictable/cowboy-chaos; fiery to punchy neon-violet
        Rameen: { start: '#FF7F50', end: '#6C63FF' }, // coral → indigo-violet

        // airy, aesthetic, emergent-layer; breezy pastels fit perfectly
        Safaa:  { start: '#84FAB0', end: '#8FD3F4' }, // mint → sky

        // queen-bee drama; luxe pop—keep pink → gold
        Salma:  { start: '#FA709A', end: '#FEE140' }, // rose → sunflower

        // undercover menace; bold, mischievous
        Samiya: { start: '#7B2CBF', end: '#FF6B6B' }, // royal purple → hot coral

        // lovable chaos, uwu-bear core; fresh, playful
        Suweda: { start: '#90F7EC', end: '#ABECD6' }, // aqua → mint

        // emo-romantic goblin-core; moody → soft
        Zainab: { start: '#6A00F4', end: '#FFAFCC' }  // deep plum → rosy pink
    };


    useEffect(() => {
        const gradient = personGradients[person] || personGradients['Nour'];
        document.documentElement.style.setProperty('--person-gradient-start', gradient.start);
        document.documentElement.style.setProperty('--person-gradient-end', gradient.end);
    }, [person]);

    console.log("URL person:", person);
    console.log("Available people:", Object.keys(aiPred));
    console.log("Person exists?", person in aiPred);

    const predictions = aiPred as unknown as Record<string, string>;
    if (!predictions || !(person in predictions)) {
        return (
            <div className={styles.cont}>
                <h1>Person Not Found</h1>
                <div className={styles.card}>
                    <p>Looking for: <strong>{person}</strong></p>
                    <p>Available people:</p>
                    <ul>
                        {Object.keys(aiPred).map(name => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    const personPrediction = predictions[person];
    // Check if the person has complete data
    if (!personPrediction) {
        return (
            <div className={styles.cont}>
                <h1>{person}'s AI Predictions</h1>
                <div className={styles.card}>
                    <p>AI prediction data not available for {person}.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.cont}>
            <h1>{person}'s AI Personality Prediction</h1>
            <div className={styles.card}>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                    {personPrediction.split('\n\n').map((paragraph, index) => (
                        <p key={index} style={{ marginBottom: '1rem', animationDelay: `${index * 0.2}s` }}>
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}