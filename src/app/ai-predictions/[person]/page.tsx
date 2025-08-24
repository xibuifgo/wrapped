'use client'

import { useParams } from 'next/navigation';
import aiPred from "../../json_files/ai.json";
import styles from "./prediction.module.scss"
import { useEffect } from 'react';
import VoteButtons from '../../components/VoteButtons';
import { personGradients } from '../../../../lib/gradients';

export default function PersonAIPredictionsPage() {
    const params = useParams();
    const person = params.person as string;

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
                <h1>{person}&apos;s AI Predictions</h1>
                <div className={styles.card}>
                    <p>AI prediction data not available for {person}.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.cont}>
            <h1>{person}&apos;s AI Personality Prediction</h1>
            <div className={styles.card}>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                    {personPrediction.split('\n\n').map((paragraph, index) => (
                        <p key={index} style={{ marginBottom: '1rem', animationDelay: `${index * 0.2}s` }}>
                            {paragraph}
                        </p>
                    ))}
                </div>
                
                <VoteButtons person={person} />
            </div>
        </div>
    );
}