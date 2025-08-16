'use client';

import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import adventureData from "../../json_files/adventure.json";

type PersonAdventure = {
    items: string[];
    path: number | string;
    guess: number;
    actions: string[];
    slang: string;
};

export default function PersonAdventurePage() {
    const params = useParams();
    const person = params.person as string;
    
    // Check if the person exists in the adventures data
    const adventures = adventureData.adventures as unknown as Record<string, PersonAdventure>;
    if (!adventures || !(person in adventures)) {
        notFound();
    }
    
    const personAdventure = adventures[person];
    
    // Check if the person has complete data
    if (!personAdventure.items || !personAdventure.actions) {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h1>{person}'s Farm Adventure</h1>
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1.5rem', 
                    borderRadius: '8px',
                    lineHeight: '1.6'
                }}>
                    <p>Adventure data not available for {person}.</p>
                </div>
            </div>
        );
    }
    
    const paths = adventureData.paths;
    const itemPrices = adventureData.item_prices as Record<string, number>;
    
    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>{person}'s Farm Adventure</h1>
            <div style={{ 
                background: '#f8f9fa', 
                padding: '1.5rem', 
                borderRadius: '8px',
                lineHeight: '1.6'
            }}>
                <div style={{ marginBottom: '1rem' }}>
                    <h3>Path Chosen:</h3>
                    <p>
                        {typeof personAdventure.path === 'number' 
                            ? paths[personAdventure.path] 
                            : personAdventure.path
                        }
                    </p>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                    <h3>Items Brought:</h3>
                    <ul>
                        {personAdventure.items.map((item: string, index: number) => (
                            <li key={index}>
                                {item} (${itemPrices[item] || 0})
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                    <h3>Actions Taken:</h3>
                    <ul>
                        {personAdventure.actions.map((action: string, index: number) => (
                            <li key={index}>{action}</li>
                        ))}
                    </ul>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                    <h3>Guess:</h3>
                    <p>{personAdventure.guess}</p>
                </div>
                
                <div>
                    <h3>Slang:</h3>
                    <p>"{personAdventure.slang}"</p>
                </div>
            </div>
        </div>
    );
}
