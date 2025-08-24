'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './awards.module.scss';
import pollData from "../json_files/polls.json";
import confetti from 'canvas-confetti';

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

function orderDict(dict: {[key: string]: number}, way: string ): { [key: string ]: number } {
  const sorted = Object.fromEntries(
    Object.entries(dict).sort(([,a],[,b]) => way == "d" ? b - a : a - b)
  );
  return sorted;
}

function mostIndecisive(polls: PollsData): string[] {
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

    const ordered = orderDict(pollCount, "d");

    return Object.keys(ordered).slice(0, 3);
}

function countPolls(polls: PollsData): { [ key: string ]: number } {
    const pollCount: { [ key: string ]: number } = {};
    const pollEntries = Object.entries(polls.polls);
    const ppl = polls.people;

    ppl.forEach(person => {
        pollCount[person] = 0;

        pollEntries.forEach(([pollName, pollDetails]) => {
            const options = Object.keys(pollDetails);
            if (options.some(option => pollDetails[option].voters.includes(person))) {
            pollCount[person]++;
            }
        });
    })

    return pollCount;
}

function countVotes(polls: PollsData): { [key: string]: number } {
    const voteCount: { [key: string]: number } = {};
    const pollEntries = Object.entries(polls.polls);
    const ppl = polls.people;

    ppl.forEach(person => {
        voteCount[person] = 0;

        pollEntries.forEach(([pollName, pollDetails]) => {
            Object.entries(pollDetails).forEach(([option, details]) => {
            if (details.voters.includes(person)) {
                voteCount[person]++;
            }
            });
        });
    });

    return voteCount;
}

function mostDecisive(polls: PollsData, polls_count: { [key: string]: number }, votes_count: { [key: string]: number }): string[] {
    const decisivePeople: { [key: string]: number } = {};
    const ppl = polls.people;

    ppl.forEach(person => {
        decisivePeople[person] =  votes_count[person] / polls_count[person];
    })

    const ordered = orderDict(decisivePeople, "a");

    return Object.keys(ordered).slice(0, 3);
}

function mostActive(polls: PollsData): string[] {
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

  const ordered = orderDict(pollCount, "d");

  return Object.keys(ordered);
}

function threeActive(polls: PollsData): string[] {
    return mostActive(polls).slice(0, 3);
}

function threeLeastActive(polls: PollsData): string[] {
    return mostActive(polls).reverse().slice(0, 3);
}

function trendsetter(polls: PollsData): string[] {
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

  return Object.keys(ordered).slice(0,3); // Return the person with the most trend votes
}

function rebel(polls: PollsData, trendsetters: string[]): string[] {
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

  return Object.keys(ordered).filter(person => !trendsetters.includes(person)).slice(0, 3); // Return the top 3 people with the most rebel votes

}

function findWinners(awards: Array<{
  title: string;
  winners: {
    first: string;
    second: string;
    third: string;
  };
  extra?: string | React.ReactNode;
}>, polls: PollsData): string[] {

    const ppl = polls.people;
    const points: { [ key: string ]: number } = {};
    const award_count: { [ key: string ]: number } = {};
    const polls_count = countPolls(polls);

    ppl.forEach(person => {
        points[person] = polls_count[person] * 0.3; // Start with points based on polls count
        award_count[person] = 0;
    })

    awards.forEach(award => {

        if (award.title === "Weirdest" || award.title === "Always Awake") {
            points[award.winners.first] -= 10;
            points[award.winners.second] -= 8;
            points[award.winners.third] -= 6;

            award_count[award.winners.first]--;
            award_count[award.winners.second]--;
            award_count[award.winners.third]--;
        }

        else {
            points[award.winners.first] += 3;
            points[award.winners.second] += 2;
            points[award.winners.third] += 1;

            award_count[award.winners.first]++;
            award_count[award.winners.second]++;
            award_count[award.winners.third]++;
        }

    })

    ppl.forEach(person => {
        points[person] += award_count[person];
    })

    const ordered = orderDict(points, "d")

    return Object.keys(ordered).slice(0, 3)
}

export default function AwardsPage() {

    const trendsetters = trendsetter(pollData);
    const rebels = rebel(pollData, trendsetters);
    const indecisivePeople = mostIndecisive(pollData);
    const decisivePeople = mostDecisive(pollData, countPolls(pollData), countVotes(pollData));
    const activePeople = threeActive(pollData);
    // const mysterious = threeLeastActive(pollData);

    const winnersRef = useRef<HTMLDivElement>(null);
    const podiumContainerRef = useRef<HTMLDivElement>(null);
    const [currentAwardIndex, setCurrentAwardIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'slide-out-left' | 'slide-in-right' | "">('');
    const [showDone, setShowDone] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [animatingWinner, setAnimatingWinner] = useState(-1);
    const [tomatoes, setTomatoes] = useState<Array<{id: number, side: 'left' | 'right'}>>([]);
    const [splats, setSplats] = useState<Array<{id: number, x: number, y: number}>>([]);
    const [isBeingPelted, setIsBeingPelted] = useState(false);

    const scrollToWinners = () => {
        // Play cheer sound immediately when button is clicked
        playCheerSound();
        
    // Mark body as fullscreen awards mode so navbar can hide on mobile
    setBodyAwardsFullscreen(true);
    setIsFullScreen(true);
        setShowDone(true);
        setAnimatingWinner(-1); // Start with all hidden
        
        // Faster staggered winner animations
        setTimeout(() => setAnimatingWinner(2), 400);  // Third place
        setTimeout(() => setAnimatingWinner(1), 700); // Second place  
        setTimeout(() => {
            setAnimatingWinner(0); // First place
        }, 1000);
        
        // Trigger confetti after all winners are revealed
        setTimeout(() => {
            fireConfetti();
        }, 1300);
        
        // After showing the spotlight effect for a few seconds, remove it
        setTimeout(() => {
            setIsFullScreen(false);
            setAnimatingWinner(3); // Show all winners after animation
            // Remove fullscreen flag from body
            setBodyAwardsFullscreen(false);
        }, 4000);
        
        // Scroll to winners section
        setTimeout(() => {
            winnersRef.current?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }, 300);

    };

    // Helper to toggle body attribute used by navbar styles
    function setBodyAwardsFullscreen(flag: boolean) {
        try {
            if (flag) {
                document.body.setAttribute('data-awards-fullscreen', 'true');
            } else {
                document.body.removeAttribute('data-awards-fullscreen');
            }
        } catch (e) {
            // server-side or other environments may not have document
        }
    }

    // Ensure cleanup on unmount in case component is removed while fullscreen
    useEffect(() => {
        return () => {
            try {
                document.body.removeAttribute('data-awards-fullscreen');
            } catch (e) {}
        }
    }, []);

    const playCheerSound = () => {
        try {
            const cheer_sounds = new Audio('/cheer.mp3');

            cheer_sounds.volume = Math.random() * 0.3 + 0.2;
            cheer_sounds.playbackRate = Math.random() * 0.2 + 0.9;
            cheer_sounds.play().catch(() => {});
            
            // Stop the sound after 2 seconds to keep it short
            setTimeout(() => {
                cheer_sounds.pause();
                cheer_sounds.currentTime = 0;
            }, 7000);

        } catch (error) {
            console.log("Audio file not supported or found", error);
        }
    };

    const fireConfetti = () => {
        // Multiple confetti bursts for celebration
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; // High z-index to appear above everything

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            // Launch confetti from left side
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#FFD700', '#C0C0C0', '#CD7F32'] // Gold, Silver, Bronze
            });
            
            // Launch confetti from right side
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#FFD700', '#C0C0C0', '#CD7F32'] // Gold, Silver, Bronze
            });
        }, 250);
    };

    const throwTomatoes = () => {
        setIsBeingPelted(true);
        const tomatoCount = 8; // Number of tomatoes to throw
        
        // Play boo sound effect
        playBooSound();
        
        for (let i = 0; i < tomatoCount; i++) {
            setTimeout(() => {
                const tomatoId = Date.now() + i;
                const side = Math.random() > 0.5 ? 'left' : 'right';
                
                setTomatoes(prev => [...prev, { id: tomatoId, side }]);
                
                // Create splat when tomato hits (80% through the animation)
                setTimeout(() => {
                    const splatId = Date.now() + i + 1000;
                    const splatX = Math.random() * 200 + 100; // Random position on podium
                    const splatY = Math.random() * 100 + 50;  // Random height on podium
                    
                    setSplats(prev => [...prev, { id: splatId, x: splatX, y: splatY }]);
                    
                    // Remove splat after animation completes
                    setTimeout(() => {
                        setSplats(prev => prev.filter(s => s.id !== splatId));
                    }, 2000);
                }, 1200); // 80% of 1.5s animation
                
                // Remove tomato after animation completes
                setTimeout(() => {
                    setTomatoes(prev => prev.filter(t => t.id !== tomatoId));
                }, 1500);
            }, i * 200); // Stagger tomato throws
        }
        
        // Stop shaking after all tomatoes are thrown
        setTimeout(() => {
            setIsBeingPelted(false);
        }, tomatoCount * 200 + 1500);
    };

    const playBooSound = () => {
        try {
            const boo_sounds = new Audio('/boo.mp3');

            setTimeout(() => {
                boo_sounds.volume = Math.random() * 0.3 + 0.2; // Random volume between 0.2 and 0.5
                boo_sounds.playbackRate = Math.random() * 0.2 + 0.9; // Random playback rate between 0.9 and 1.1
                boo_sounds.play().catch(() => {});
            }, 10);
        } catch (error) {
            console.log('Audio not supported or file not found:', error);
        }
    };

    // Check if current award should trigger tomato throwing
    const shouldThrowTomatoes = () => {
        return currentAwardIndex === 7 || currentAwardIndex === 8 || currentAwardIndex === 9; // 8th and 9th awards (0-indexed)
    };

    // Award data
    const awards = [
        // Most Indecisive
        {
            title: "Most Indecisive",
            winners: {
                first: indecisivePeople[0],
                second: indecisivePeople[1],
                third: indecisivePeople[2]
            },
            extra: "Go to these people if you wanna overthink"
        },
        // Most Decisive
        {
            title: "Most Decisive",
            winners: {
                first: decisivePeople[0],
                second: decisivePeople[1],
                third: decisivePeople[2]
            },
            extra: "These are the best people to go to if you need to make a decision"
        },
        // Most Active
        {
            title: "Most Active",
            winners: {
                first: activePeople[0],
                second: activePeople[1],
                third: activePeople[2]
            },
            extra: "If you ever need a quick response, these are the people to ask"
        },
        // Trendsetters
        {
            title: "The Trendsetters",
            winners: {
                first: trendsetters[0],
                second: trendsetters[1],
                third: trendsetters[2]
            },
            extra: "If you ever need to advertise an event you know who to talk to"
        },
        // The Rebels
        {
            title: "The Rebels",
            winners: {
                first: rebels[0],
                second: rebels[1],
                third: rebels[2]
            },
            extra: "Keep an eye on these people, they might be up to something"
        },
        // Most Cultured
        {
            title: "Most Cultured",
            winners: {
                first: "Safaa",
                second: "Aliyah",
                third: "Aiza"
            },
            extra: "If you wanna have a good convo, now you know where to go!"
        },
        // Most Controversial
        {
            title: "Most Controversial",
            winners: {
                first: "Samiya",
                second: "Zainab",
                third: "Safaa"
            },
            extra: "These three probably have the best debate topics"
        },
        // Most Mysterious
        // {
        //     title: "Most Mysterious",
        //     winners: {
        //         first: mysterious[0],
        //         second: mysterious[1],
        //         third: mysterious[2]
        //     },
        //     extra: "Extra points to anyone who can get to know them!"
        // },
        // Weirdest
        {
            title: "Weirdest",
            winners: {
                first: "Madiha",
                second: "Nour",
                third: ""
            },
            extra: (
                <>
                    WHO MAKES FAMILY FANFIC AT 2 AM?<br />
                    <span style={{ color: "red" }}>Sorry Aiza</span>
                </>
            )
        },
        // Always Awake
        {
            title: "Always Awake",
            winners: {
                first: "Samiya",
                second: "",
                third: ""
            },
            extra: "EVERYONE TELL SAMIYA TO GO TO SLEEP"
        },
        // Copilot 
        {
            title: "Most Pages Corrupted",
            winners: {
                first: "Copilot",
                second: "",
                third: ""
            },
            extra: "Copilot corrupted our code FIVE TIMES"
        },
        // Go see overall winners
        {
            title: "Go see overall winners",
            winners: {
                first: "???",
                second: "???",
                third: "???"
            },
            extra: (
                <button className={styles.btn} onClick={scrollToWinners}>Go</button>
            )
        }
    ];

    const winners = findWinners(awards, pollData);

    const currentAward = awards[currentAwardIndex];

    // Trigger tomatoes on initial load if we're on 8th or 9th award
    useEffect(() => {
        if (currentAwardIndex === 7 || currentAwardIndex === 8 || currentAwardIndex === 9 ) {
            setTimeout(() => {
                throwTomatoes();
            }, 1000); // Wait a second after component loads
        }
    }, []); // Only run on mount

    const nextAward = () => {
        setSlideDirection('slide-out-left');
        setTimeout(() => {
            const newIndex = (currentAwardIndex + 1) % awards.length;
            setCurrentAwardIndex(newIndex);
            setSlideDirection('slide-in-right');
            
            // Check if we should throw tomatoes for this award
            if (newIndex === 7 || newIndex === 8 || newIndex === 9) { // 8th, 9th, and 10th awards
                setTimeout(() => {
                    throwTomatoes();
                }, 400); // Match the new animation timing
            }
        }, 200); // Slightly longer to match new transition
    };

    const prevAward = () => {
        setSlideDirection('slide-out-left');
        setTimeout(() => {
            const newIndex = (currentAwardIndex - 1 + awards.length) % awards.length;
            setCurrentAwardIndex(newIndex);
            setSlideDirection('slide-in-right');
            
            // Check if we should throw tomatoes for this award
            if (newIndex === 7 || newIndex === 8 || newIndex === 9) { // 8th, 9th, and 10th awards
                setTimeout(() => {
                    throwTomatoes();
                }, 400); // Match the new animation timing
            }
        }, 200); // Slightly longer to match new transition
    };

    return (
        <div className={styles["awards-page"]}>
            {/* Blur overlay for spotlight effect */}
            {isFullScreen && (
                <div className={styles["blur-overlay"]}></div>
            )}
            
            <div className={styles["awards-header"]}>
                <h1>Awards!</h1>
            </div>
            <div className={`${styles["podium-container"]} ${isBeingPelted ? styles["being-pelted"] : ""}`} ref={podiumContainerRef}>
                <h1 className={`${styles["awards-title"]} ${slideDirection ? styles[slideDirection] : ''}`}>{currentAward.title}</h1>

                {/* Tomatoes */}
                {tomatoes.map(tomato => (
                    <div
                        key={tomato.id}
                        className={`${styles["tomato"]} ${
                            tomato.side === 'left' ? styles["tomato-throw"] : styles["tomato-throw-left"]
                        }`}
                        style={{
                            top: '50%',
                            [tomato.side]: '-50px'
                        }}
                    />
                ))}

                {/* Splats */}
                {splats.map(splat => (
                    <div
                        key={splat.id}
                        className={`${styles["tomato-splat"]} ${styles["splat-animation"]}`}
                        style={{
                            left: `${splat.x}px`,
                            top: `${splat.y}px`
                        }}
                    />
                ))}

                <div className={styles["podium-wrapper"]}>
                    {/* Navigation arrows */}
                    <button 
                        className={`${styles["nav-arrow"]} ${styles["nav-left"]}`}
                        onClick={prevAward}
                        aria-label="Previous award"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    
                    <button 
                        className={`${styles["nav-arrow"]} ${styles["nav-right"]}`}
                        onClick={nextAward}
                        aria-label="Next award"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>

                    {/* Names positioned above podium levels */}
                    <div className={styles["podium-names"]}>
                        <div className={`${styles["name-label"]} ${styles["second-place"]} ${slideDirection ? styles[slideDirection] : ''}`}>{currentAward.winners.second}</div>
                        <div className={`${styles["name-label"]} ${styles["first-place"]} ${slideDirection ? styles[slideDirection] : ''}`}>{currentAward.winners.first}</div>
                        <div className={`${styles["name-label"]} ${styles["third-place"]} ${slideDirection ? styles[slideDirection] : ''}`}>{currentAward.winners.third}</div>
                    </div>
                    
                    {/* Podium SVG */}
                    <svg 
                        width="300" 
                        height="150" 
                        viewBox="0 0 134 69" 
                        className={styles["podium-svg"]}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Second place (left) - Silver */}
                        <rect x="3.15" y="16.15" width="42.7" height="52.7" rx="3.85" fill="#C0C0C0" stroke="black" strokeWidth="0.3"/>
                        <rect x="0.15" y="16.15" width="47.7" height="3.7" fill="#C0C0C0" stroke="black" strokeWidth="0.3"/>
                        
                        {/* Third place (right) - Bronze */}
                        <rect x="88.15" y="26.15" width="42.7" height="42.7" rx="3.85" fill="#CD7F32" stroke="black" strokeWidth="0.3"/>
                        <rect x="88.15" y="25.15" width="45.7" height="3.7" fill="#CD7F32" stroke="black" strokeWidth="0.3"/>
                        
                        {/* First place (center) - Gold */}
                        <rect x="46.15" y="0.15" width="42.7" height="68.7" rx="3.85" fill="#DAA520" stroke="black" strokeWidth="0.3"/>
                        <rect x="42.15" y="0.15" width="52.7" height="3.7" fill="#DAA520" stroke="black" strokeWidth="0.3"/>
                        
                        {/* Add position numbers */}
                        <text x="24.5" y="45" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">2</text>
                        <text x="67.5" y="35" textAnchor="middle" fontSize="20" fontWeight="bold" fill="white">1</text>
                        <text x="109.5" y="50" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">3</text>
                    </svg>

                    <p>{currentAward.extra ? currentAward.extra : ''}</p>

                    <div className={styles["progress-bar"]}>
                    {Array.from({length: awards.length}, (_, index) => (
                        <div key={index + 1} className={styles["progress-segment"]}>
                        <div 
                            className={styles["progress-segment-fill"]}
                            style={{
                            width: index <= currentAwardIndex ? '100%' : '0%'
                            }}
                        ></div>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            <div className={`${styles["winners-container"]} ${isFullScreen ? styles["spotlight"] : ""}`} ref={winnersRef}>
                <h2>Winners</h2>
                {showDone && (
                    <ul className={styles["winners-list"]}>
                        {winners.map((winner, index) => {
                            // Show winners based on their position:
                            // index 0 = first place, index 1 = second place, index 2 = third place
                            // animatingWinner 2 = show only third place (index 2)
                            // animatingWinner 1 = show second + third place (index 1,2)  
                            // animatingWinner 0 = show all three (index 0,1,2)
                            let shouldShow = false;
                            
                            if (animatingWinner >= 3) {
                                shouldShow = true; // Show all after animation
                            } else if (animatingWinner === 2) {
                                shouldShow = index === 2; // Only third place
                            } else if (animatingWinner === 1) {
                                shouldShow = index >= 1; // Second and third place
                            } else if (animatingWinner === 0) {
                                shouldShow = true; // All three places
                            }
                            
                            return (
                                <li 
                                    key={index} 
                                    className={`${styles[`winner-item-1`]} ${
                                        shouldShow ? styles["pop-in"] : styles["hidden"]
                                    }`}
                                >
                                    {winner}
                                </li>
                            );
                        })}
                    </ul>
                )}
                {!showDone && (
                    <ul className={styles["winners-list"]}>
                        {winners.map((winner, index) => (
                            <li 
                                key={index} 
                                className={`${styles[`winner-item-1`]}`}
                            >
                                ???
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {/* Meme section */}
            <div className={styles["meme-header"]}>
                <span className={styles["meme-divider"]}>——————————</span>
                <span className={styles["meme-title"]}>MEME</span>
                <span className={styles["meme-divider"]}>——————————</span>
            </div>
            <div className={styles["meme-cont"]}>
                <img 
                    src="/meme.jpg" 
                    alt="Award Meme" 
                    className={styles["award-meme"]}
                />
            </div>
        </div>
    );
}
