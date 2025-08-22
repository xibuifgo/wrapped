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

// helper to set CSS custom property --i safely for JSX/TS
const cssVar = (i: number) => ({ ['--i']: i } as unknown as React.CSSProperties);

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

  return orderDict(pollCount, "d");
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
        for (const voter of details.voters) {
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

function allRounder(polls: PollsData): string {
  const ppl = polls.people;
  const agreement: { [key: string]: number } = {};

  ppl.forEach(person => {
    agreement[person] = 0;
  });

  // For each person, count how many unique people they agreed with across all polls
  ppl.forEach(person => {
    const agreedWith = new Set<string>();

    Object.values(polls.polls).forEach(pollDetails => {
      Object.values(pollDetails).forEach(optionDetails => {
        if (optionDetails.voters.includes(person)) {
          optionDetails.voters.forEach(voter => {
            if (voter !== person) {
              agreedWith.add(voter);
            }
          });
        }
      });
    });

    agreement[person] = agreedWith.size;
  });

  // Return the person who agreed with the most unique people
  const ordered = orderDict(agreement, "d");
  return Object.keys(ordered)[1] || "";
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
  const allScores = rankActivity(pollData as PollsData);
  const userScore = activityRanking[userName] || 0;

  const ppl = Object.keys(allScores)
  const userRank = ppl.indexOf(userName) + 1;
  const percentile = Math.round((userRank / ppl.length) * 100);

  // const scoresArray = Object.values(allScores);
  // const userRank = scoresArray.indexOf(userScore) + 1;
  // const percentile = Math.round((userRank / scoresArray.length) * 100);

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
          <p className={styles["description"]}>This person could barely ever choose one option:</p>
          <ul className={styles["indecisive-result"]}>
            {mostIndecisivePeople.length > 0 ? (
              mostIndecisivePeople.map((person, index) => (
                <li key={index} style={cssVar(index)}><strong>{person}</strong></li>
              ))
            ) : (
              <li>Loading...</li>
            )}
          </ul>
        </div>
      ),
      showProgressBar: true
    },
    // Most Active
    {
      title: "⭐ Most Active People",
      content: (
        <div>
          <p className={styles.description}>These people participated in the most polls:</p>
          <ol type="1">
            {mostActivePeople.length > 0 ? (
              mostActivePeople.map((person, index) => (
                <li key={index} style={cssVar(index)}><strong>{person}</strong></li>
              ))
            ) : (
              <li>Loading...</li>
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
          <p className={styles.description}>The trendsetter is the person whose choice ends up winning most often:</p>
          <ul>
            <li style={cssVar(0)}><strong>{trendsetter(pollData as PollsData)}</strong></li>
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
          <p className={styles.description}>The rebel is the person who consistently votes against the majority: </p>
          <ul>
            <li style={cssVar(0)}><strong>{rebel(pollData as PollsData)}</strong></li>
          </ul>
        </div>
      ),
      showProgressBar: true
    },
    //All Rounded
    {
      title: "🏆 The All-Rounder",
      content: (
        <div>
          <p className={styles.description}>The all-rounder is the person who agrees with the most people across all polls:</p>
          <ul>
            <li style={cssVar(0)}><strong>{allRounder(pollData as PollsData)}</strong></li>
          </ul>
        </div>
      ),
      showProgressBar: true
    },
    {
      title: "🥔 Yummiest Poll",
      content: (
        <ul>
          <li>Salma</li>
        </ul>
      ),
      extra: "You got all of comm excited over potatoes",
      showProgressBar: true
    },
    // Most Evenly Split
    {
      title: "🤝 Most Evenly Split Poll",
      content: (
        <div>
          <ul>
            <li style={cssVar(0)}><b>Zainab</b></li>
          </ul>
          <p>Matcha: Love or Hate?</p>
        </div>
      ),
      showProgressBar: true
    },
    // Most Controversial
    {
      title: "🗣️ Most controversial poll",
      content: (
        <div>
          <p className={styles.description}>This person&apos;s poll caused the biggest argument on the groupchat:</p>
          <ul>
            <li>Samiya</li>
          </ul>
        </div>
      ),
      showProgressBar: true
    },
    // Loves to Draw 
    {
      title: "✏️ Loves to Draw",
      content: (
        <div>
          <p className={styles.description}>This person picked tied options every time:</p>
          <ul>
            <li>Bilgesu</li>
          </ul>
        </div>
      ),
      showProgressBar: true
    },
    // Funniest Poll 
    {
      title: "😂 Funniest Poll",
      content: (
        <div>
          <p className={styles.description}>This person&apos;s poll started the funniest convo:</p>
          <ul>
            <li>Aliyah</li>
          </ul>
        </div>
      ),
      extra: "There's no way some of you actually use LinkedIn Reels",
      showProgressBar: true
    },
    {
      title: "⁉️ Hardest Poll",
      content: (
        <div>
          <p className={styles.description}>This person&apos;s poll was the hardest to answer (also the most cultured):</p>
          <ul>
            <li>Safaa</li>
          </ul>
        </div>
      ),
      extra: "You almost made Nour watch all the Spider-Man movies",
      showProgressBar: true
    },
    // Most Innovative
    {
      title: "🎨 Most innovative poll",
      content: (
        <div>
          <p className={styles.description}>This person changed the way polls were made:</p>
          <ul>
            <li>Rameen</li>
          </ul>
        </div>
      ),
      extra: "You introduced pictures to the game!",
      showProgressBar: true
    },
    // Most catastrophic
    {
      title: "😼 Most CAT-astrophic Poll",
      content: (
        <div>
          <p className={styles.description}>This person&apos;s poll caused a sticker war before it was even released:</p>
          <ul>
            <li>Khadeja</li>
          </ul>
        </div>
      ),
      extra: "Even the admins had to get involved",
      showProgressBar: true
    },
    {
      title: "🥹 Most Wholesome Poll",
      content: (
        <div>
          {/* <p className={styles.description}>This person's poll started the funniest convo:</p> */}
          <ul>
            <li>Suweda</li>
          </ul>
        </div>
      ),
      extra: "No explanation needed",
      showProgressBar: true
    },
    // The Gatherers
    {
      title: "👩🏽‍👩🏽‍👧🏽‍👧🏽 The Gatherers",
      content: (
        <div>
          <p className={styles.description}>These people got everyone on comm to vote on their polls:</p>
          <ul>
            <li>Zainab</li>
            <li>Bilgesu</li>
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
          <div className={`${styles.statItem} ${styles.statItem1}`}>
            <p><strong>Total Polls:</strong> {totalPolls}</p>
          </div>
          <div className={`${styles.statItem} ${styles.statItem2}`}>
            <p><strong>Total Votes:</strong> {totalVotes}</p>
          </div>
          <div className={`${styles.statItem} ${styles.statItem3}`}>
            <p><strong>Average Votes per Poll:</strong> {Math.round((totalVotes / totalPolls) * 10) / 10 || 0}</p>
          </div>
        </div>
      ),
      showProgressBar: true
    },
    // About you
    {
      title: "🔎 Now about you!",
      content: (
        <div>
          <p>Let&apos;s see how you did, {userName}!</p>
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
            <li style={cssVar(0)}>{countVotes(pollData as PollsData, userName)} times!</li>
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
            <li style={cssVar(0)}>{countPolls(pollData as PollsData, userName)} polls</li>
          </ul>
          <p className={styles.lead}>That means on average, you picked {Math.round((countVotes(pollData as PollsData, userName) / countPolls(pollData as PollsData, userName)) * 10) / 10 || 0} options per poll</p>
        </div>
      ),
      showProgressBar: true
    },
    // Best friend
    {
      title: "👯‍♀️ Best Friend",
      content: (
        <div>
          <p className={styles.lead}>Your best friend is the person you agreed with the most:</p>
          <ul>
            <li style={cssVar(0)}>{bff}</li>
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
          <p className={styles.lead}>Your arch nemesis is the person you disagreed with the most:</p>
          <ul>
            <li style={cssVar(0)}>{enemy}</li>
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
      <div key={slideIndex} className={`${styles.slide} ${styles[`slide${slideIndex}`]} ${slideIndex === 1 ? styles.welcomeSlide : ''}`} onClick={handleSlideClick}>
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

        <h1 className={styles.slideTitle}>{slide.title}</h1>
        {slide.subtitle && <h2 className={`${styles["subtitle"]} ${styles.slideSubtitle}`}>{slide.subtitle}</h2>}
        <div className={styles.slideContent}>
          {slide.content}
          {slide.extra && <p>{slide.extra}</p>}
        </div>
        
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

