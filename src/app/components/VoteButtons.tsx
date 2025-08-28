'use client'

import { useState, useEffect } from 'react';
import { getVotes, addUpvote, addDownvote, removeUpvote, removeDownvote, VoteData } from '../../../lib/voting';
import { personGradients } from '../../../lib/gradients';
import styles from './VoteButtons.module.scss';

interface VoteButtonsProps {
  person: string;
}

export default function VoteButtons({ person }: VoteButtonsProps) {
  const [votes, setVotes] = useState<VoteData>({ upvotes: 0, downvotes: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    loadVotes();
    loadUserVote();
  }, [person]);

  const loadVotes = async () => {
    try {
      const voteData = await getVotes(person); // function from lib/voting.ts!!
      setVotes(voteData);
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  // Load user's previous vote from localStorage
  const loadUserVote = () => {
    try {
      const storedVote = localStorage.getItem(`vote_${person}`);
      if (storedVote === 'up' || storedVote === 'down') {
        setUserVote(storedVote);
      }
    } catch (error) {
      console.error('Error loading user vote from localStorage:', error);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (voteType === 'up') {
        if (userVote === 'up') {
          // Remove upvote if already voted up
          await removeUpvote(person);
          setVotes(prev => ({ ...prev, upvotes: prev.upvotes - 1 }));
          setUserVote(null);
          localStorage.removeItem(`vote_${person}`);
        } else {
          // Add upvote (new or switching from downvote)
          await addUpvote(person);
          if (userVote === 'down') {
            // Switching from downvote to upvote
            setVotes(prev => ({ 
              upvotes: prev.upvotes + 1, 
              downvotes: prev.downvotes - 1 
            }));
          } else {
            // New upvote
            setVotes(prev => ({ ...prev, upvotes: prev.upvotes + 1 }));
          }
          setUserVote('up');
          localStorage.setItem(`vote_${person}`, 'up');
        }
      } else {
        // voteType === 'down'
        if (userVote === 'down') {
          // Remove downvote if already voted down
          await removeDownvote(person);
          setVotes(prev => ({ ...prev, downvotes: prev.downvotes - 1 }));
          setUserVote(null);
          localStorage.removeItem(`vote_${person}`);
        } else {
          // Add downvote (new or switching from upvote)
          await addDownvote(person);
          if (userVote === 'up') {
            // Switching from upvote to downvote
            setVotes(prev => ({ 
              upvotes: prev.upvotes - 1, 
              downvotes: prev.downvotes + 1 
            }));
          } else {
            // New downvote
            setVotes(prev => ({ ...prev, downvotes: prev.downvotes + 1 }));
          }
          setUserVote('down');
          localStorage.setItem(`vote_${person}`, 'down');
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get person's gradient colors
  const gradient = personGradients[person] || personGradients['Nour'];

  return (
    <div className={styles.voteContainer}>
      <div className={styles.voteSection}>
        <h3 className={styles.voteTitle}>Accurate?</h3>
        <div className={styles.voteButtons}>
          <button
            className={`${styles.voteButton} ${userVote === 'up' ? styles.voted : ''}`}
            onClick={() => handleVote('up')}
            disabled={isLoading}
            aria-label="Upvote this prediction"
            style={{
              '--gradient-start': gradient.start,
              '--gradient-end': gradient.end
            } as React.CSSProperties}
          >
            <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                {/* thumbs up icon!! */}
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
            </svg>
            {votes.upvotes}
          </button>
          
          <button
            className={`${styles.voteButton} ${userVote === 'down' ? styles.voted : ''}`}
            onClick={() => handleVote('down')}
            disabled={isLoading}
            aria-label="Downvote this prediction"
            style={{
              '--gradient-start': gradient.end,
              '--gradient-end': gradient.start
            } as React.CSSProperties}
          >
            <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                {/* thumbs down icon!! */}
              <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
            </svg>
            {votes.downvotes}
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className={styles.loading}>
          Voting...
        </div>
      )}
    </div>
  );
}
