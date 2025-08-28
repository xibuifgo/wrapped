import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export interface VoteData {
  upvotes: number;
  downvotes: number;
}

export interface VoteCounts {
  [person: string]: VoteData;
}

// Get votes for a specific person
export async function getVotes(person: string): Promise<VoteData> {
  try {
    const voteDoc = doc(db, 'votes', person);
    const voteSnapshot = await getDoc(voteDoc);
    
    if (voteSnapshot.exists()) {
      return voteSnapshot.data() as VoteData;
    } else {
      // Initialize with zero votes if document doesn't exist
      const initialVotes: VoteData = { upvotes: 0, downvotes: 0 };
      await setDoc(voteDoc, initialVotes);
      return initialVotes;
    }
  } catch (error) {
    console.error('Error getting votes for', person, ':', error);
    
    // Check if it's a Firebase configuration error
    if (error instanceof Error) {
      if (error.message.includes('Firebase App named')) {
        console.error('Firebase not properly initialized. Check your environment variables.');
      } else if (error.message.includes('permission-denied')) {
        console.error('Firestore permission denied. Check your security rules.');
      } else if (error.message.includes('unavailable')) {
        console.error('Firestore service unavailable. Check your internet connection.');
      }
    }
    
    return { upvotes: 0, downvotes: 0 };
  }
}

// Add an upvote for a person (removes downvote if exists)
export async function addUpvote(person: string): Promise<void> {
  try {
    const voteDoc = doc(db, 'votes', person);
    const voteSnapshot = await getDoc(voteDoc);
    
    if (voteSnapshot.exists()) {
      const currentData = voteSnapshot.data() as VoteData;
      // If user previously downvoted, remove that downvote and add upvote
      if (currentData.downvotes > 0) {
        await updateDoc(voteDoc, {
          upvotes: increment(1),
          downvotes: increment(-1)
        });
      } else {
        // Just add upvote
        await updateDoc(voteDoc, {
          upvotes: increment(1)
        });
      }
    } else {
      // Document doesn't exist, create it
      await setDoc(voteDoc, {
        upvotes: 1,
        downvotes: 0
      });
    }
  } catch (error) {
    console.error('Error adding upvote:', error);
    throw error;
  }
}

// Add a downvote for a person (removes upvote if exists)
export async function addDownvote(person: string): Promise<void> {
  try {
    const voteDoc = doc(db, 'votes', person);
    const voteSnapshot = await getDoc(voteDoc);
    
    if (voteSnapshot.exists()) {
      const currentData = voteSnapshot.data() as VoteData;
      // If user previously upvoted, remove that upvote and add downvote
      if (currentData.upvotes > 0) {
        await updateDoc(voteDoc, {
          downvotes: increment(1),
          upvotes: increment(-1)
        });
      } else {
        // Just add downvote
        await updateDoc(voteDoc, {
          downvotes: increment(1)
        });
      }
    } else {
      // Document doesn't exist, create it
      await setDoc(voteDoc, {
        upvotes: 0,
        downvotes: 1
      });
    }
  } catch (error) {
    console.error('Error adding downvote:', error);
    throw error;
  }
}

// Remove an upvote for a person
export async function removeUpvote(person: string): Promise<void> {
  try {
    const voteDoc = doc(db, 'votes', person);
    const voteSnapshot = await getDoc(voteDoc);
    
    if (voteSnapshot.exists()) {
      const currentData = voteSnapshot.data() as VoteData;
      if (currentData.upvotes > 0) {
        await updateDoc(voteDoc, {
          upvotes: increment(-1)
        });
      }
    }
  } catch (error) {
    console.error('Error removing upvote:', error);
    throw error;
  }
}

// Remove a downvote for a person
export async function removeDownvote(person: string): Promise<void> {
  try {
    const voteDoc = doc(db, 'votes', person);
    const voteSnapshot = await getDoc(voteDoc);
    
    if (voteSnapshot.exists()) {
      const currentData = voteSnapshot.data() as VoteData;
      if (currentData.downvotes > 0) {
        await updateDoc(voteDoc, {
          downvotes: increment(-1)
        });
      }
    }
  } catch (error) {
    console.error('Error removing downvote:', error);
    throw error;
  }
}

// Get all votes for all people
export async function getAllVotes(): Promise<VoteCounts> {
  try {
    // For simplicity, we'll get votes for known people
    const knownPeople = [
      'Nour', 'Aiza', 'Anica', 'Aliyah', 'Bilgesu', 'Khadeja', 
      'Madiha', 'Rameen', 'Safaa', 'Salma', 'Samiya', 'Suweda', 'Zainab'
    ];
    
    const votes: VoteCounts = {};
    
    for (const person of knownPeople) {
      votes[person] = await getVotes(person);
    }
    
    return votes;
  } catch (error) {
    console.error('Error getting all votes:', error);
    return {};
  }
}
