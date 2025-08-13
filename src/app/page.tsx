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

function orderDict(dict: {[key: string]: number}, way: string ): { [key: string ]: number } {
  const sorted = Object.fromEntries(
    Object.entries(dict).sort(([,a],[,b]) => way == "d" ? b - a : a - b)
  );
  return sorted;
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

function bestFriend(polls: PollsData, person: string): { [key: string]: number } {
  const ppl = polls.people;
  const agree_count: { [key: string]: number } = {}

  ppl.forEach(person => {
    agree_count[person] = 0;
  })

  const pollEntries = Object.entries(polls.polls);
  pollEntries.forEach(([pollName, pollDetails ]) => {
    Object.entries(pollDetails).forEach(([option, details]) => {
      if (details.voters.includes(person)) {
        for (let voter of details.voters) {
          agree_count[voter]++;
        }
      }
    })
  })

  const ordered = orderDict(agree_count, "d");

  return ordered;
}

function archNemesis(polls: PollsData, person: string): { [key: string]: number } {
  const ppl = polls.people;
  const disagree_count: { [key: string]: number } = {};

  ppl.forEach(p => {
    disagree_count[p] = 0;
  });

  const pollEntries = Object.entries(polls.polls);
  pollEntries.forEach(([pollName, pollDetails]) => {
    // Check if the person voted in this poll
    let personVotedInThisPoll = false;
    const current_poll_count: { [key: string]: number } = {};
    
    // Initialize counts for this poll
    ppl.forEach(p => {
      current_poll_count[p] = 0;
    });

    // Count votes for each person in this poll
    Object.entries(pollDetails).forEach(([option, details]) => {
      if (details.voters.includes(person)) {
        personVotedInThisPoll = true;
      }
      
      // Count votes for other people in options where our person didn't vote
      if (!details.voters.includes(person)) {
        details.voters.forEach(voter => {
          current_poll_count[voter]++;
        });
      }
    });

    // Only count disagreements if the person voted in this poll
    if (personVotedInThisPoll) {
      ppl.forEach(p => {
        disagree_count[p] += current_poll_count[p];
      });
    }
  });

  return orderDict(disagree_count, "d");
}

function trendsetter(polls: PollsData): string {
  const ppl = polls.people;
  let most_votes = 0;
  let most_votes_option = "";

  const trend_count: { [key: string]: number } = {};
  const pollEntries = Object.entries(polls.polls);

  ppl.forEach(person => {
    trend_count[person] = 0;
  });

  pollEntries.forEach(([pollName, pollDetails]) => {
    Object.entries(pollDetails).forEach(([option, details]) => {
      const voteCount = details.voters.length;
      if (voteCount > most_votes) {
        most_votes = voteCount;
        most_votes_option = option;
      }
    });

    if (most_votes_option && pollDetails[most_votes_option] && pollDetails[most_votes_option].voters) {
      pollDetails[most_votes_option].voters.forEach(voter => {
        if (trend_count[voter] !== undefined) {
          trend_count[voter]++;
        }
      });
    }
  });

  const ordered = orderDict(trend_count, "d");

  return Object.keys(ordered)[0]; // Return the person with the most trend votes
}

function rebel(polls: PollsData): string {
  const ppl = polls.people;
  let least_votes = 100;
  let least_votes_option = "";

  const rebel_count: { [key: string]: number } = {};
  const pollEntries = Object.entries(polls.polls);

  ppl.forEach(person => {
    rebel_count[person] = 0;
  });

  Object.entries(polls.polls).forEach(([pollName, pollDetails]) => {
    Object.entries(pollDetails).forEach(([option, details]) => {
      const vote_count = details.voters.length;
      if (vote_count < least_votes) {
        least_votes = vote_count;
        least_votes_option = option;
      }
    });

    if (least_votes_option && pollDetails[least_votes_option] && pollDetails[least_votes_option].voters) {
      pollDetails[least_votes_option].voters.forEach(voter => {
        if (rebel_count[voter] !== undefined) {
          rebel_count[voter]++;
        }
      });
    }

  });

  const ordered = orderDict(rebel_count, "d");

  return Object.keys(ordered)[0]; // Return the person with the most rebel votes

}



type SlideContent = {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  extra?: string;
  showProgressBar?: boolean;
};

export default function Home() {
  const [mostIndecisivePeople, setMostIndecisivePeople] = useState<string[]>([]);
  const [mostActivePeople, setMostActivePeople] = useState<string[]>([]);
  const [activityRanking, setActivityRanking] = useState<{ [key: string]: number }>({});
  const [totalPolls, setTotalPolls] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [nameNotFound, setNameNotFound] = useState<boolean>(false);
  const [honorarySis, setHonorarySis] = useState<boolean>(false);

  // Calculate proper percentile
  const allScores = Object.values(activityRanking).sort((a, b) => b - a);
  const userScore = activityRanking[userName] || 0;
  const userRank = allScores.indexOf(userScore) + 1;
  const percentile = Math.round((userRank / allScores.length) * 100);

  // Random stuff
  const agreement = bestFriend(pollData as PollsData, userName);
  const bff = Object.keys(agreement)[1]; // Cuz 0th person will always be yourself
  const disagreement = archNemesis(pollData as PollsData, userName);
  const enemy = Object.keys(disagreement)[0];

 const slides: SlideContent[] = [
    // Welcome
    {
      title: honorarySis ? `WE MISS YOU ${userName.toUpperCase()}!` : `Welcome ${userName}!`,
      subtitle: honorarySis
      ? "Even though you're not on comm, you'll always be a part of it in my (Nour's) eyes :)"
      : "Your 2025 STEMM Sisters Poll WRAPPED",
      content: (
      <p>
        {honorarySis
        ? "If you wanna continue, you can see the new comms wrapped"
        : "Let's see how your group stacked up this year"}
      </p>
      ),
      showProgressBar: true
    },
    // Most Indecisive
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
    // Most Active
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
    //Trendsetter Slide 
    {
      title: "🌟 Trendsetter",
      content: (
        <div>
          <p>The trendsetter is the person whose choice ends up winning most often:</p>
          <ul>
            <li><strong>{trendsetter(pollData as PollsData)}</strong></li>
          </ul>
        </div>
      ),
      showProgressBar: true
    },
    // Rebel Slide 
    {
      title: "👹 Rebel",
      content: (
        <div>
          <p>The rebel is the person who consistently votes against the majority: </p>
          <ul>
            <li><strong>{rebel(pollData as PollsData)}</strong></li>
          </ul>
        </div>
      ),
      showProgressBar: true
    },
    // Statistics
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
    // Most Evenly Split
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
    // Avatar
    {
      title: "NO ONE WANTS TO BE THE AVATAR",
      subtitle: "Credit: Aiza and her ATLA poll",
      content: (
        <div>
          <ul>
            <p>We have a comm of scaredy cats. Or are we just "a humble lot" as Salma said?</p>
          </ul>
        </div>
      ),
      showProgressBar: true
    },
    // About you
    {
      title: "🔎 Now about you!",
      content: (
        <div>
          <p>Let's see how you did, {userName}!</p>
        </div>
      ),
      showProgressBar: true
    },
    // You Voted...
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
    // You Voted In...
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
    // Best friend
    {
      title: "👯‍♀️ Best Friend",
      content: (
        <div>
          <p>Your best friend is the person you agreed with the most:</p>
          <ul>
            <p>{bff}</p>
          </ul>
        </div>
      ),
      extra: `You two agreed ${agreement[bff]} times!`,
      showProgressBar: true
    },
    // Arch Nemesis
    {
      title: "⚔️ Your Arch Nemesis",
      content: (
        <div>
          <p>Your arch nemesis is the person you disagreed with the most:</p>
          <ul>
            <p>{enemy}</p>
          </ul>
        </div>
      ),
      extra: `You two disagreed ${disagreement[enemy]} times!`,
      showProgressBar: true
    },
    // Thank You
    {
      title: "💕 Thank You!",
      content: (
        <div>
          {!honorarySis && (
            <>
              <p>Thank you {userName} for participating in the Sisters Poll! We really couldn&apos;t have done this without you.</p>
              <p>We hope you enjoyed your wrapped experience! 🎉</p>
              {(userName !== "Madiha" && userName !== "Samiya" && userName !== "Suweda") && <p>If you did, make sure to thank Madiha Suweda and Samiya!</p>}
            </>
          )}
          {honorarySis && (
            <>
              <p>Thanks for always being amazing!</p>
              <p>And thank you for letting me be a part of this society :{')'}</p>
            </>
          )}
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
        <div className={styles["slide-top"]}>
          {/* Exit button */}
          <button 
            className={styles.exitButton}
            onClick={(e) => {
              e.stopPropagation(); // Prevent slide navigation
              setCurrentSlide(0); // Go back to home screen
            }}
          >
            ✕
          </button>

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
        </div>

        <h1>{slide.title}</h1>
        {slide.subtitle && <h2 className={styles["subtitle"]}>{slide.subtitle}</h2>}
        {slide.content}
        {slide.extra && <p>{slide.extra}</p>}
        
        {/* Navigation indicators at bottom */}
        <div className={styles.slideNavigation}>
          <div className={styles.navLeft}>
            {currentSlide > 1 && <span>← Previous</span>}
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
              let nameExists = pollData.people.some(person => 
                person.toLowerCase() === enteredName.toLowerCase()
              );
              if (!nameExists) {
                nameExists = pollData.honorary.some(person => 
                  person.toLowerCase() === enteredName.toLowerCase()
                );
                if (nameExists) {
                  setHonorarySis(true);
                }
              }
              
              if (nameExists) {
                // Find the correctly capitalized name from the data
                const correctName = pollData.people.find(person => 
                  person.toLowerCase() === enteredName.toLowerCase()
                ) || capitalize(enteredName);
                
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
