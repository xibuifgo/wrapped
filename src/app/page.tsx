type PollsData = {
  people: string[];
  polls: {
    [key: string]: {
      [key: string]: {
        voters: string[];
      };
    };
  };
}

"use client";

import pollData from "./json_files/polls.json";
import styles from "./index.module.scss";
import { useState, useEffect } from "react";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function mostIndecisive(polls: PollsData): string[] {
  const indecisivePeople: string[] = [];
  const people = polls.people;  
  const pollEntries = Object.entries(polls.polls);
  const pollCount: { [key: string]: number } = {};
  people.forEach(person => {
    pollCount[person] = 0;
  });

  pollEntries.forEach(([pollName, pollDetails]) => {
    Object.entries(pollDetails).forEach(([option, details]) => {
      details.voters.forEach(voter => {
        if (pollCount[voter] !== undefined) {
          pollCount[voter]++;
        }
      });
    });
  });

  const maxVotes = Math.max(...Object.values(pollCount));
  indecisivePeople.push(...Object.keys(pollCount).filter(person => pollCount[person] === maxVotes));
  return indecisivePeople;
}

function rankActivity(polls: PollsData): { [key: string]: number } {
  const people = polls.people;
  const pollEntries = Object.entries(polls.polls);
  const pollCount: { [key: string]: number } = {};
  
  people.forEach(person => {
    pollCount[person] = 0;
  });

  pollEntries.forEach(([pollName, pollDetails]) => {
    const seenInThisPoll = new Set<string>(); // Track who we've seen in this poll
    
    Object.entries(pollDetails).forEach(([option, details]) => {
      details.voters.forEach(voter => {
        if (pollCount[voter] !== undefined && !seenInThisPoll.has(voter)) {
          pollCount[voter]++;
          seenInThisPoll.add(voter); // Mark this person as seen in this poll
        }
      });
    });
  });

  return pollCount;
}

function mostActive(polls: PollsData): string[] {
  const activityRanking = rankActivity(polls);
  const maxVotes = Math.max(...Object.values(activityRanking));
  const activePeople = Object.keys(activityRanking).filter(person => activityRanking[person] === maxVotes);
  return activePeople;
}

function countVotes(polls: PollsData, person: string): number {
  let voteCount = 0;
  const pollEntries = Object.entries(polls.polls);
  pollEntries.forEach(([pollName, pollDetails]) => {
    Object.entries(pollDetails).forEach(([option, details]) => {
      if (details.voters.includes(person)) {
        voteCount++;
      }
    });
  });
  return voteCount;
}

function countPolls(polls: PollsData, person: string): number {
  let pollCount = 0;
  const pollEntries = Object.entries(polls.polls);
  pollEntries.forEach(([pollName, pollDetails]) => {
    const options = Object.keys(pollDetails);
    if (options.some(option => pollDetails[option].voters.includes(person))) {
      pollCount++;
    }
  });
  return pollCount;
}

type SlideContent = {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  showProgressBar?: boolean;
};

export default function Home() {
  const [mostIndecisivePeople, setMostIndecisivePeople] = useState<string[]>([]);
  const [mostActivePeople, setMostActivePeople] = useState<string[]>([]);
  const [activityRanking, setActivityRanking] = useState<{ [key: string]: number }>({});
  const [totalPolls, setTotalPolls] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [mostPopularPerson, setMostPopularPerson] = useState<string>("");
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [nameNotFound, setNameNotFound] = useState<boolean>(false);

  // Calculate proper percentile
  const allScores = Object.values(activityRanking).sort((a, b) => b - a);
  const userScore = activityRanking[userName] || 0;
  const userRank = allScores.indexOf(userScore) + 1;
  const percentile = Math.round((userRank / allScores.length) * 100);

 const slides: SlideContent[] = [
    // Slide 1: Welcome
    {
      title: `Welcome ${userName}!`,
      subtitle: "Your 2025 STEMM Sisters Poll WRAPPED",
      content: <p>Let's see how your group stacked up this year</p>,
      showProgressBar: true
    },
    // Slide 2: Most Indecisive
    {
      title: "🤔 Most Indecisive Person",
      content: (
        <div>
          <p>This person could barely ever choose one option:</p>
          {mostIndecisivePeople.length > 0 ? (
            mostIndecisivePeople.map((person, index) => (
              <p key={index}><strong>{person}</strong></p>
            ))
          ) : (
            <p>Loading...</p>
          )}
        </div>
      ),
      showProgressBar: true
    },
    // Slide 3: Most Active
    {
      title: "⭐ Most Active People",
      content: (
        <div>
          <p>These people participated in the most polls:</p>
          <ol type="1">
            {mostActivePeople.length > 0 ? (
              mostActivePeople.map((person, index) => (
                <li key={index}><strong>{person}</strong></li>
              ))
            ) : (
              <p>Loading...</p>
            )}
          </ol>
        </div>
      ),
      showProgressBar: true
    },
    // Slide 4: Statistics
    {
      title: "📊 Poll Statistics",
      content: (
        <div className={styles.statsSlide}>
          <div className={styles.statItem}>
            <p><strong>Total Polls:</strong> {totalPolls}</p>
          </div>
          <div className={styles.statItem}>
            <p><strong>Total Votes:</strong> {totalVotes}</p>
          </div>
          <div className={styles.statItem}>
            <p><strong>Average Votes per Poll:</strong> {Math.round((totalVotes / totalPolls) * 10) / 10 || 0}</p>
          </div>
        </div>
      ),
      showProgressBar: true
    },

    {
      title: "🤝 Most Evenly Split Poll",
      content: (
        <div>
          <ul>
            <p><b>Zainab</b></p>
          </ul>
          <p>Matcha: Love or Hate?</p>
        </div>
      ),
      showProgressBar: true
    },

    {
      title: "🔎 Now about you!",
      content: (
        <div>
          <p>Let's see how you did, {userName}!</p>
        </div>
      ),
      showProgressBar: true
    },

    {
      title: "🗳️ You Voted...",
      content: (
        <div>
          <ul>
            <p>{countVotes(pollData as PollsData, userName)} times!</p>
          </ul>
          <p>You are in the top {percentile || 0}% of voters</p>
        </div>
      ),
      showProgressBar: true
    },

    {
      title: "📋 You Voted In...",
      content: (
        <div>
          <ul>
            <p>{countPolls(pollData as PollsData, userName)} polls</p>
          </ul>
          <p>That means on average, you picked {Math.round((countVotes(pollData as PollsData, userName) / countPolls(pollData as PollsData, userName)) * 10) / 10 || 0} options per poll</p>
        </div>
      ),
      showProgressBar: true
    },

    // Next slides: Best friend (person you agreed with the most)
    // Arch nemesis (person you disagreed with the most)

    {
      title: "💕 Thank You!",
      content: (
        <div>
          <p>Thanks for participating in the Sisters Poll!</p>
          <p>Hope you enjoyed your wrapped experience! 🎉</p>
        </div>
      ),
      showProgressBar: true // Use old progress bar for final slide
    }
  ];

  const maxSlides = slides.length;

  const handleSlideClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const middleX = rect.width / 2;

    if (clickX > middleX) {
      // Clicked on right side - next slide
      if (currentSlide < maxSlides) {
        setCurrentSlide(currentSlide + 1);
      }
    } else {
      // Clicked on left side - previous slide
      if (currentSlide > 1) {
        setCurrentSlide(currentSlide - 1);
      }
    }
  };

  useEffect(() => {
    const indecisivePeople = mostIndecisive(pollData as PollsData);
    setMostIndecisivePeople(indecisivePeople);

    // Calculate activity ranking first
    const ranking = rankActivity(pollData as PollsData);
    setActivityRanking(ranking);

    // Then get most active people from the ranking
    const activePeople = mostActive(pollData as PollsData);
    setMostActivePeople(activePeople);
    
    // Calculate total polls
    const pollCount = Object.keys(pollData.polls).length;
    setTotalPolls(pollCount);
    
    // Calculate total votes and most popular person
    const voteCount: { [key: string]: number } = {};
    let totalVoteCount = 0;
    
    pollData.people.forEach(person => {
      voteCount[person] = 0;
    });
    
    Object.entries(pollData.polls).forEach(([pollName, pollDetails]) => {
      Object.entries(pollDetails).forEach(([option, details]) => {
        details.voters.forEach(voter => {
          if (voteCount[voter] !== undefined) {
            voteCount[voter]++;
            totalVoteCount++;
          }
        });
      });
    });
    
    setTotalVotes(totalVoteCount);
  }, []);

  // Reusable slide component
  const renderSlide = (slideIndex: number) => {
    const slide = slides[slideIndex - 1];
    if (!slide) return null;

    return (
      <div className={`${styles.slide} ${slideIndex === 1 ? styles.welcomeSlide : ''}`} onClick={handleSlideClick}>
        {/* Progress Bar */}
        {slide.showProgressBar ? (
          <div className={styles.progressBar}>
            {Array.from({length: maxSlides}, (_, index) => (
              <div key={index + 1} className={styles.progressSegment}>
                <div 
                  className={styles.progressSegmentFill}
                  style={{
                    width: index + 1 < currentSlide ? '100%' : 
                           index + 1 === currentSlide ? '100%' : '0%'
                  }}
                ></div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{width: `${(currentSlide / maxSlides) * 100}%`}}
            ></div>
          </div>
        )}

        <h1>{slide.title}</h1>
        {slide.subtitle && <h2 className={styles["subtitle"]}>{slide.subtitle}</h2>}
        {slide.content}
        
        {/* Navigation indicators */}
        <div className={styles.slideNavigation}>
          <div className={styles.navLeft}>
            {currentSlide > 1 && <span>← Previous</span>}
          </div>
          <div className={styles.slideCounter}>
            {currentSlide} / {maxSlides}
          </div>
          <div className={styles.navRight}>
            {currentSlide < maxSlides && <span>Next →</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.main}>
      <div className={styles["logo-div"]}></div>
      <div className={styles["name-title"]}>
        <h1>Enter your name to see your 2025 STEMM Sisters Poll Wrapped!</h1>
        <input 
          type="text" 
          placeholder="Enter your name" 
          className={styles["name-input"]} 
          id="name-input"
          onChange={() => setNameNotFound(false)} // Clear error when user types
        />
        <button
          onClick={() => {
            const input = document.getElementById("name-input") as HTMLInputElement | null;
            if (input && input.value.trim()) {
              const enteredName = input.value.trim();
              // Check if name exists in poll data (case-insensitive)
              const nameExists = pollData.people.some(person => 
                person.toLowerCase() === enteredName.toLowerCase()
              );
              
              if (nameExists) {
                // Find the correctly capitalized name from the data
                const correctName = pollData.people.find(person => 
                  person.toLowerCase() === enteredName.toLowerCase()
                ) || enteredName;
                
                setUserName(correctName);
                setCurrentSlide(1);
                setNameNotFound(false);
              } else {
                setNameNotFound(true);
                setUserName("");
                setCurrentSlide(0);
              }
            }
          }}
          className={styles["go-button"]}
        >Go!</button>
        
        {/* Name not found error message */}
        {nameNotFound && (
          <div className={styles["error-message"]}>
            <p>Name not found! Please check your spelling or try a different name.</p>
          </div>
        )}
      </div>

      {/* Render current slide */}
      {currentSlide > 0 && currentSlide <= maxSlides && renderSlide(currentSlide)}

    </div>
  );
}
