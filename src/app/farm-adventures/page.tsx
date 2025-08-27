"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './farm-adventures.module.scss';

export default function FarmAdventuresPage() {


  type Group = {
    title: string;
    sols: Record<string, string>;
    correct?: string[];
  };

  const farmSolutions: Group[] = [
    // Sisters Supply Store
    {
      title: "Sisters Supply Store",
      sols: {
        "Lock Picking Kit": "Can open the cabin door",
        "Deck of Cards": "Can play games with the farmer or show him a magic trick!",
        "Picnic Mat": "Comes in handy in the forest, and unlocks a cute scene with the farmer",
        "Camera": "Can document the whole journey",
        "Balloons": "Make balloon animals and cheer the farmer up",
        "Uno": "UNO REVERSE CARD BABY (can be used up to four times)",
        "Colouring Book + Crayons": "Allows you to speak to the farmer and comes in handy in the forest",
        "Lip Gloss": "Who doesn't wanna look good?",
        "German to English Dictionary": "It won't hurt to have one! (just in case)",
        "STEMM Sticker": "If you say a specific word with this on, the cows will find their leader",
        "Github Account": "Climbing skills unlocked",
        "Mirror": "You never know when you'll need to reflect!"
      }
    },
    // Paths: Cabin
    {
      title: "Paths: Cabin",
      sols: {
        "Lock Picking Kit": "Get Diary Entry",
        "Camera": "Take a picture of the plushie",
        "None": "Find plushie and accidentally kill farmer"
      },
      correct: [
        "Lock Picking Kit",
        "Camera"
      ]
    },
    // Paths: Forest
    {
      title: "Paths: Forest",
      sols: {
        "Picnic Mat": "Relax with elves and they help you out",
        "Colouring Book + Crayons": "Save an elf from choking so they help you out",
        "None": "A troll will help you out after hours of searching"
      },
      correct: [
        "Picnic Mat",
        "Colouring Book + Crayons"
      ]
    },
    // Rock Climbing Wall
    {
      title: "Paths: Rock Climbing Wall",
      sols: {
        "GitHub Account": "You become a typical coder and can climb",
        "Camera": "You take a picture so nice that the publicity team saves you",
        "None": "Fall and get rescued by outreach team"
      },
      correct: [
        "GitHub Account",
        "Camera"
      ]
    },
    // Troll Numbers
    {
      title: "Troll's Numbers",
      sols: {
        "88": "You can only speak to the cows in reverse because 88 is a palindrome. Maybe a reflective surface will help?",
        "45": "You can only speak to the cows in German. A German/English Dictionary might be handy for this!",
        "16": "Correct",
        "23": "Correct",
        "97": "The troll keeps only one cow because 97 is a prime number. There is no way to reverse this",
        "36": "The cows become minecraft cows because 36 is a square number. There is no way to escape this"
      },
      correct: [
        "16",
        "23"
      ]
    },
    // Farmer Interaction: Turn One
      {
        title: "Farmer Interaction: Turn One",
        sols: {
          "Play Cards": "You show him a magic trick and impress him, but still not enough to convince him to let you through",
          "Picnic": "He goes and gets some potatoes, you share it in silence",
          "Selfie": "You take a selfie together, he sees he has a slight smile after so long of not smiling. This makes him feel more at e",
          "Make Balloon Animals": "He loves his balloon dog and starts smiling",
          "Investing Advice": "If you give him more than £5 he will get convinced and leave",
          "Diary Entry": "He will reflect on his life and realize he doesn't care about the cows anymore",
          "Plushie": "You convince him after the first attempt but the plushie gives him a virus that ends up killing him"
        },
        correct: [
          "Investing Advice",
          "Diary Entry"
        ]
      },
      // Farmer Interaction: Turn Two
      {
        title: "Farmer Interaction: Turn Two",
        sols: {
          "Play Cards": "You play cambio and let him win. He gets super happy- but not enough to convince him to let you through",
          "Picnic": "He goes and gets your favorite potatoes, you share it. This starts a conversation where he reflects on his life and decides to let you talk to the cows",
          "Selfie": "You take a selfie together, he sees he has a slight smile after so long of not smiling. This makes him feel more at ease",
          "Make Balloon Animals": "He loves his balloon dog and starts smiling",
          "Investing Advice": "If you give him more than £5 he will get convinced and leave"
        },
        correct: [
          "Investing Advice",
          "Picnic"
        ]
      },
      // Farmer Interaction: Turn Three
      {
        title: "Farmer Interaction: Turn Three",
        sols: {
          "Play Cards": "You play heart attack. He ends up getting so into the game that he screams. The cows don't copy him and he realizes he's free.",
          "Picnic": "He goes and gets your favorite potatoes, you share it. This starts a conversation where he reflects on his life and decides to let you talk to the cows",
          "Selfie": "You take a selfie together, he sees he has a big smile after so long of not smiling. This makes him realize human connection is more important.",
          "Make Balloon Animals": "He loves his balloon dog and lets you through.",
          "Investing Advice": "If you give him more than £5 he will get convinced and leave"
        },
        correct: [
          "Play Cards",
          "Investing Advice",
          "Picnic",
          "Selfie",
          "Make Balloon Animals"
        ]
      },
      {
        title: "Slang",
        sols: {
          "Bare": "They learn what bare means and figure out they've experienced \"Bare Animal Rights Violations\". Animal Farm Unfolds",
          "Cheeky Nandos": "Animalism. The chickens hate the cows because the cows found out they're food.",
          "Shut up Fatty": "Moozempic.",
          "Butters": "The cows find out what butter is and buy the production rights. Now all the butter in the town is produced by them.",
          "Sicko": "You start something called the \"Sicko Cow Trials\" if you don't pick 97.",
          "Having Beef": "Animal Farm + Vegan Movement",
          "Mad": "If you're not wearing the STEMM Sticker, the cows will learn how to express their feelings. If you are wearing it they will find their leader."
        }
      }
  ];

  const getImageForGroup = (groupTitle: string): string | undefined => {
    const title = groupTitle.toLowerCase();
    if (title.includes('sisters') || title.includes('store')) return '/store.jpg';
    if (title.includes('cabin')) return '/cabin.jpeg';
    if (title.includes('forest')) return '/mountains.jpg';
    if (title.includes('rock')) return '/rock_climb.png';
    if (title.includes('troll')) return '/troll_img.jpg';
    if (title.includes('slang')) return '/cow_cute.png';
    if (title.includes('farm')) return '/farm.jpg';
    return undefined;
  };

  // type defined above

  // Component: one mini slider per group
  const GroupSection: React.FC<{ group: Group }> = ({ group }) => {
  const options = useMemo(() => Object.entries(group.sols), [group.sols]);
    const [idx, setIdx] = useState(0);
    const startX = useRef<number | null>(null);
    const deltaX = useRef(0);
  const img = getImageForGroup(group.title);
  const hasCorrect = Array.isArray(group.correct);
  const [sliderH, setSliderH] = useState<number | undefined>(undefined);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const measure = () => {
      const heights = slideRefs.current
        .filter((el): el is HTMLDivElement => !!el)
        .map((el) => el.offsetHeight);
      if (heights.length) setSliderH(Math.max(...heights));
    };
    // Measure after paint
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', measure);
    };
  }, [options.length]);

  // Re-measure when index changes to accommodate different slide heights
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = slideRefs.current[idx];
      if (el) setSliderH(el.offsetHeight);
    });
    return () => cancelAnimationFrame(id);
  }, [idx]);

    const prevLocal = () => setIdx((i) => (i - 1 + options.length) % options.length);
    const nextLocal = () => setIdx((i) => (i + 1) % options.length);

    const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
      startX.current = e.touches[0].clientX;
      deltaX.current = 0;
    };
    const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
      if (startX.current == null) return;
      deltaX.current = e.touches[0].clientX - startX.current;
    };
    const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
      if (Math.abs(deltaX.current) > 50) {
        deltaX.current > 0 ? prevLocal() : nextLocal();
      }
      startX.current = null;
      deltaX.current = 0;
    };

    return (
  <section className={`${styles.section} ${group.title.toLowerCase().includes('slang') ? styles.slang : ''}`}>
        <h2 className={styles.sectionTitle}>{group.title}</h2>
  <div className={styles.miniSlider} style={sliderH ? { height: sliderH } : undefined} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <button className={`${styles.miniNavBtn} ${styles.left}`} onClick={prevLocal} aria-label={`Previous ${group.title} option`}>
            <span aria-hidden>‹</span>
          </button>
          <button className={`${styles.miniNavBtn} ${styles.right}`} onClick={nextLocal} aria-label={`Next ${group.title} option`}>
            <span aria-hidden>›</span>
          </button>

          <div className={styles.miniTrack} style={{ transform: `translate3d(-${idx * 100}%, 0, 0)` }}>
            {options.map(([option, desc], i) => {
              const isCorrect = hasCorrect && (group.correct as string[]).includes(option);
              return (
                <div className={styles.miniSlide} key={`${group.title}-${option}-${i}`} ref={(el) => { slideRefs.current[i] = el; }}>
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span className={styles.group}>{group.title}</span>
                      {hasCorrect && (
                        <span className={`${styles.badge} ${isCorrect ? styles.correct : styles.wrong}`}>
                          {isCorrect ? 'Correct' : 'Try again'}
                        </span>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.media}>
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="scene" decoding="async" loading="eager" />
                        ) : (
                          <div className={styles.placeholder} aria-hidden />
                        )}
                      </div>
                      <div className={styles.content}>
                        <h3 className={styles.option}>{option}</h3>
                        <p className={styles.desc}>{desc}</p>
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.progress}>
                        <span>
                          {idx + 1}/{options.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.miniDots}>
            {options.map((_, i) => (
              <button
                key={i}
                className={`${styles.miniDot} ${i === idx ? styles.active : ''}`}
                aria-label={`Go to ${group.title} slide ${i + 1}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Farm Adventures</h1>
      <div className={styles.sections}>
        {farmSolutions.map((g) => (
          <GroupSection key={g.title} group={g} />
        ))}
      </div>
    </div>
  );
}