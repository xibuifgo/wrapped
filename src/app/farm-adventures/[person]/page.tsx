'use client';

import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, captureOwnerStack } from 'react';
import adventureData from "../../json_files/adventure.json";
import styles from "./farm-preson.module.scss";
import polls from "../../json_files/polls.json";
import { createLocalRequestContext } from 'next/dist/server/after/builtin-request-context';

type PersonAdventure = {
    time: string;
    date: string;
    items: string[];
    path: number;
    guess: number;
    actions: string[];
    slang: string;
};

export default function PersonAdventurePage() {
    const params = useParams();
    const person = params.person as string;
    
    // All hooks must be called before any conditional returns
    const [isClient, setIsClient] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const receiptRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load data before any conditional logic
    const adventures = adventureData.adventures as unknown as Record<string, PersonAdventure>;
    const paths = adventureData.paths;
    const itemPrices = adventureData.item_prices as Record<string, number>;
    
    // Check if the person exists in the adventures data
    if (!adventures || !(person in adventures)) {
        notFound();
    }
    
    const personAdventure = adventures[person];
    
    // Calculate poll data
    const poll = polls.polls["ATLA: What bender would you be?"];
    type BenderKey = keyof typeof poll;

    let bender: BenderKey | 'pass' = 'pass';

    for (const [bender_type, data] of Object.entries(poll) as [BenderKey, { voters: string[] }][]) {
        if (data.voters.includes(person)) {
            bender = bender_type;
            break;
        }
    }

    const movie_poll = polls.polls["Best Comfort Movie"];
    type movieKey = keyof typeof movie_poll;

    let movie: movieKey | 'pass' = 'pass';

    for (const [movie_type, data] of Object.entries(movie_poll) as [movieKey, { voters: string[] }][]) {
        if (data.voters.includes(person)) {
            movie = movie_type;
            break;
        }
    }

    const fav_content = polls.polls["Best short-form content"];
    type contentKey = keyof typeof fav_content;

    let content: contentKey | 'pass' = 'pass';

    for (const [content_type, data] of Object.entries(fav_content) as [contentKey, { voters: string[] }][]) {  
        if (data.voters.includes(person)) {
            content = content_type;
            break;
        }
    }

    const tech = person === "Suweda" && personAdventure.items?.includes("GitHub Account");
    
    // Only calculate change on client to avoid hydration mismatch
    const change = isClient && personAdventure.items ? Math.floor(20 - personAdventure.items
        .filter(item => !(person === "Suweda" && item === "GitHub Account"))
        .reduce((total, item) => total + (itemPrices[item] || 0), 0)) : 0;

    // Calculate farmer convincing logic progressively - this hook must be called for all cases
    const isFarmerConvinced = useMemo(() => {
        if (!personAdventure?.actions || !isClient) {
            return { afterTurnOne: false, afterTurnTwo: false, afterTurnThree: false };
        }

        // Check Turn One
        const turnOneAction = personAdventure.actions[0] || bender;
        if (turnOneAction === "Investing Advice" && change > 5) {
            return { afterTurnOne: true, afterTurnTwo: true, afterTurnThree: true };
        }
        if (turnOneAction === "Picnic") {
            return { afterTurnOne: true, afterTurnTwo: true, afterTurnThree: true };
        }

        // Check Turn Two (only if farmer not convinced after Turn One)
        const turnTwoAction = personAdventure.actions[1] || bender;
        if (turnTwoAction === "Investing Advice" && change > 5) {
            return { afterTurnOne: false, afterTurnTwo: true, afterTurnThree: true };
        }
        if (turnTwoAction === "Picnic") {
            return { afterTurnOne: false, afterTurnTwo: true, afterTurnThree: true };
        }

        // Check Turn Three (only if farmer not convinced after Turn Two)
        const turnThreeAction = personAdventure.actions[2] || bender;
        if (turnThreeAction === "Investing Advice" && change > 5) {
            return { afterTurnOne: false, afterTurnTwo: false, afterTurnThree: true };
        }
        if (turnThreeAction === "Picnic") {
            return { afterTurnOne: false, afterTurnTwo: false, afterTurnThree: true };
        }

        // After Turn Three, farmer is always convinced regardless
        return { afterTurnOne: false, afterTurnTwo: false, afterTurnThree: true };
    }, [personAdventure?.actions, change, isClient, bender]);

    // Function to save receipt as image
    const saveReceiptAsImage = async () => {
        if (!receiptRef.current) return;
        
        try {
            // Dynamically import html2canvas
            const html2canvas = (await import('html2canvas')).default;
            
            const canvas = await html2canvas(receiptRef.current, {
                background: '#ffffff',
                useCORS: true,
                allowTaint: true,
                logging: false
            });
            
            // Create download link
            const link = document.createElement('a');
            link.download = `${person}-farm-adventure-receipt.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('Error saving receipt:', error);
            alert('Sorry, there was an error saving the receipt. Please try again.');
        }
    };

    // Handle special cases after all hooks are called
    if (person === "Bilgesu") {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>{person}&apos;s Farm Adventure</h1>
                <div className={styles.journalContainer}>
                    <p>You were handling the finances at the Sister Supply Store all day.</p>
                </div>
            </div>
        );
    }

    if (person === "Nour") {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>{person}&apos;s Farm Adventure</h1>
                <div className={styles.journalContainer}>
                    <p>You hid behind a <i>LOG</i> and <i>TROLLED</i> everyone on comm.</p>
                </div>
            </div>
        );
    }

    // Check if the person has complete data
    if (!personAdventure.items || !personAdventure.actions) {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>{person}&apos;s Farm Adventure</h1>
                <div className={styles.journalContainer}>
                    <p>Adventure data not available for {person}.</p>
                </div>
            </div>
        );
    }
    
    // Make copy of items array
    const inventory = [...personAdventure.items ];

    function handlePrevClick() {
        setCurrentPage(prevPage => Math.max(0, prevPage - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleNextClick() {
        setCurrentPage(prevPage => Math.min(journalPages.length - 1, prevPage + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handlePageJump(pageNumber: number) {
        if (pageNumber >= 1 && pageNumber <= journalPages.length) {
            setCurrentPage(pageNumber - 1); // Convert to 0-based index
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function handlePageInputSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const pageInput = formData.get('pageNumber') as string;
        const pageNumber = parseInt(pageInput, 10);
        
        if (!isNaN(pageNumber)) {
            handlePageJump(pageNumber);
        }
        
        // Clear the input
        (e.currentTarget.elements.namedItem('pageNumber') as HTMLInputElement).value = '';
    }

    function pathResult(personAdventure: PersonAdventure): string {
        if (!personAdventure.path) return "<p>You didnt go anywhere, you went back home</p>";

        const path = paths[personAdventure.path - 1]; // Convert 1-based to 0-based index
        if (!path) return "<p>You didn't choose a valid path</p>";

        if (path === "Cabin") {
            let html = "<p>You approach the mysterious cabin. The wooden structure creaks in the mountain wind, and you can see a faint light flickering through the windows.</p>";

            if (personAdventure.items.includes("Lock picking kit")) {
                html += "<p>You notice the door is locked, but fortunately you brought your lock picking kit! After a few tense minutes of work, you hear the satisfying click of the lock opening.</p>";
                html += "<p>Inside, you discover an old journal filled with daily diary entries written in a child's handwriting. The pages are yellowed with age, and you can barely make out the words in the dim light. You rip the page and shove it into your bag. This sounds an awful lot like the farmer, you think. Maybe it will be useful when I get there. </p>";
                inventory.push("Diary Entry");
                return html;
            } else if (personAdventure.items.includes("Camera")) {
                // ADD MORE STORY TO THIS
                html += "<p>You decide to document this mysterious place. You take several photos of the cabin's exterior, capturing its weathered wood and mysterious aura.</p>";
                html += "<p>The photos will serve as proof of your incredible journey up the mountain. Each click of the camera feels like you're preserving a piece of history. Jackpot you think, this would make such a good dump. Your excitement pushes you to head for the farm, now with more energy than before. </p>";
                return html;
            } else {
                html += "<p>You try the door handle, but it's locked tight. You peer through the windows but can only make out shadowy shapes inside.</p>";
                html += "<p>Without the right tools, you can only admire the cabin from the outside and wonder what secrets it holds. So you decide to tour the perimeter and see if you can find any clues about its history. There you see a plushie, its white fur now black from the dirt surrounding it. You pick it up from its tail and place it in your backpack. Maybe I can give this to the farmer? you think. What the heck would he do with a dirty plushie though? You decide it won't hurt to try and continue to the farm. </p>";
                inventory.push("Plushie");
                return html;
            }

        } else if (path === "Forest") {
            let html = "<p>For some reason, the tall maze of trees calls out to you. You take a deep breath and head towards the forest.</p>";
            html += "<p>As you draw closer to the trees, you feel your breath get heavy. Your legs ache as you trudge through the steep terrain, but you push on, determined to deliver your message.</p>";
            html += "<p>You finally reach the forest. As far as your eye can see the landscape is covered in trees. You extend your neck trying to look for an exit, but after searching for what feels like hours, you realize there is none.</p>";

            if (personAdventure.items.includes("Picnic Mat")) {
                // Make elves look like GenComm
                html += "<p>Defeated and tired, you take your picnic mat out and lay down. As you rest, you notice the forest seems less threatening. The longer you stare up into the sky, the brighter the cracks in the trees becomes. Suddenly you see a stream of glitter, before you can react an elf pops up in your face. </p>";
                html += "<p>'Hiya friend! Can me and my friends sit with ya?' Their voice sounds familiar, making you feel strangely at home. You sit up and brush the mat, gesturing them to take a seat. A dozen elves come flocking onto the mat, staring all wide eyed and smiley at you. </p>";
                html += "<p> You feel a bit uneasy as these elves have a bit of a familiar look to them. 'Sorry but what do you guys do?' you ask. </p>"
                html += "<p> 'We're the elves of this mountain! We maintain balance in the ecosystem by helping anyone that needs it!' </p>";
                html += "<p>Thats when it clicks. These elves look like Zainab and Aliyah! This is your chance to escape this forest</p>";
                html += "<p>'Wait so if I need help getting out of this forest can you help me?'</p>";
                html += "<p> 'We sure can! Just follow me!' </p>";
                html += "<p>And just like that, with the snap of the elf's finger you find yourself standing in front of the forest. You thank all twelve of the elves and continue on your journey. </p>";
            } else if (personAdventure.items.includes("Coloring Book + Crayons")) {
                html += "<p>'I'll figure this out in a bit,' you think to yourself. You take out your " + (movie !== 'pass' ? movie : "Spiderman") + " colouring book and start badly colouring ";

                if (movie === "Confessions of a Shopaholic") {
                    html += "Rebecca Bloomwood.</p>";
                } else if (movie === "My neighbor Totoro") {
                    html += "Totoro.</p>";
                } else if (movie === "Princess Diaries") {
                    html += "Princess Mia.</p>";
                } else if (movie === "Shrek") {
                    html += "Shrek and Donkey.</p>";
                } else {
                    const spidermanPoll = polls.polls["Best Spiderman"];
                    type SpidermanKey = keyof typeof spidermanPoll;

                    let favSpider: SpidermanKey | "pass" = "pass";

                    for (const [spiderman, data] of Object.entries(spidermanPoll) as [SpidermanKey, { voters: string[] }][]) {
                        if (data.voters.includes(person)) {
                            favSpider = spiderman;
                            break;
                        }
                    }

                    html += (favSpider === "pass" ? "Venom" : favSpider) + ".</p>";
                }
                
                // Add elf interaction
                html += "<p>The simple act of coloring helps calm your nerves and gives you time to think about your situation. Just as you're about to make a move an elf pops up in front of you. </p>";
                html += "<p>'Hello there friend! Can me and my other friend sit with ya?' Their voice sounds familiar, making you feel strangely at home. You look up from your colouring book and hand one of them a green crayon. They all gather round the chosen elf, staring at the crayon in amazement. </p>";
                html += "<p> 'This is a crayon! It's used -' </p>";
                html += "<p> But just as you're about to finish your sentence you watch the elf shove the crayon in their mouth.  </p>";

                if (person === "Aliyah" ) {
                    html += "<p> Next thing you know, the elf grabbing at it's neck and gasping for air, their friend is screaming and running in circles. While you look at this disaster unfold, you can't help but see the elves resemblance to Zainab and yourself. But just as you're about to mention it the gravity of the situation hits you. </p>";
                } else if (person === "Zainab") {
                    html += "<p> Next thing you know, the elf grabbing at it's neck and gasping for air, their friend is screaming and running in circles. While you look at this disaster unfold, you can't help but see the elves resemblance to yourself and Aliyah. But just as you're about to mention it the gravity of the situation hits you. </p>";
                }

                html += "<p> 'You're choking!' you say </p>";
                html += "<p> You get up and perform the heimlich on the choking elf. After what feels like forever you see a crayon fly across the forest. </p>";
                html += "<p> 'Phew' the elf exclaims. 'How can i repay you?' </p>";
                html += "<p> 'Can you help me get out of this forest?' you ask </p>";
                html += "<p> 'Sure I can!' </p>";

                if (person === "Aliyah" || person === "Zainab") {
                    html += "<p>And just like that, with the snap of the elf's finger you find yourself standing in front of the forest. Before you can even begin to process that you have an elf doppleganger, both elves snap their fingers again and disappear. You convince yourself you're hallucinating and continue on your journey. </p>";
                } else {
                    html += "<p>And just like that, with the snap of the elf's finger you find yourself standing in front of the forest. You thank the Zainab and Aliyah look alikes and continue on your journey. </p>";
                }


            } else {
                // Check for earth or wind bending BUT AS AN ELSE IF SO BEFORE THIS ELSE STATEMENT
                if (bender === "Airbender") {
                    html += "<p>As you wander through the forest, you feel a gentle breeze guiding you. You close your eyes and focus on the air around you, using your bending skills to navigate through the dense trees.</p>";
                }

                // Maybe just search for a while <- NOUR spawns to help and leads you straight to the troll line
                // Nour helps by listening to the logs <-- no one picked this so you can code this post-submission
                
                html += "<p>You wander deeper into the forest, using your instincts to navigate. The trees seem to whisper secrets as you pass by.</p>";
                html += "<p>Eventually, you find a small clearing where sunlight breaks through the canopy, giving you hope and a moment of peace.</p>";
            }

            return html;

        } else if (path === "Rock Climbing Wall") {

            const bePoll = polls.polls["Where would you rather be rn"];
            type beKeys = keyof typeof bePoll;

            let favBe: beKeys | "pass" = "pass";

            for (const [be, data] of Object.entries(bePoll) as [beKeys, { voters: string[] }][]) {
                if (data.voters.includes(person)) {
                    favBe = be;
                    break;
                }
            }

            let activity: string;
            
            if (favBe === "pass") {
                activity = "at the farm";
            } else if (favBe === "Theme Park" || favBe === "Beach") {
                activity = "at a " + favBe.toLowerCase();
            } else {
                activity = favBe.toLowerCase();
            }

            let html = "<p>The imposing rock wall stretches high above you, its surface marked with natural handholds and challenging overhangs.</p>";
            html += "<p>You feel your heart racing as you prepare for the climb. I wish I was " + activity + " right now you think to yourself. But you must focus. This is the moment of truth.</p>";

            if (personAdventure.items.includes("GitHub Account")) {
                // ADD MORE STORY TO THIS
                html += "<p>All of a sudden your phone rings. You look down and see a message from Suweda. Leetcode Club today! You clap your hands together and feel a surge of energy run through your veins. It felt like a mixture of red bull, electricity and bad social skills entering your body. Theres no way Im missing leetcode club you think, and with that you grip the holds with all your strength and launch yourself upwards. </p>";
                html += "<p>You make steady progress up the wall, your muscles burning but your determination unwavering. After an intense climb, you reach the top and are rewarded with a breathtaking view of the farm above.</p>";
                return html;

            } else if (personAdventure.items.includes("Camera")) {
                html += "<p>You pull out your camera and start taking pictures of the wall. Imagine telling people I cleared this, you think to yourself. The very idea of being able to brag about it fills you with energy. </p>";
                html += "<p>You tackle the wall with renewed vigor, your enhanced energy helping you power through the challenging sections with surprising ease.</p>";
                html += "<p>As you reach the top, fatigue starts to strike. You stop for a bit to try and catch your breath and make the mistake of looking down. A fall from here can kill you. Panic starts to set in. You shakily continue the climb. </p>";
                html += "The end is drawing near. The anticipation of relief is just enough to keep you going. You reach the final hold and get ready to push yourself up onto the flat terrain. ";
                html += "<p> But you can't do it. Your remaining energy is being spent on trying to keep you still. Thats when you feel a force pull you up. As you lay on your back, you are sheilded from the sun by Khadeja and Rameen. </p>";
                html += "<p> 'Did you actually think we'd let you die with an insane picture like that?' they say </p>";
                html += "<p> Just as you're about to respond, they disappear. Too tired to process what happened, you choose to ignore the whole situation. </p>";
                html += "<p>I cant wait to post this on my " + content + ", you say through panting breaths. <p> But before you do that you remembered you need to reach the farm. "
                return html;
            } else {
                // AIZA AND SAMIYA COMING TO HELP YOU CUZ THEYRE OUTREACH
                // Should we make it only if you have the STEMM Sticker?
                html += "<p>Without anything to help you, you decide to attempt a free climb. You make it partway up using just your hands and determination.</p>";
                html += "<p>Eventually your arms start to get shaky. You look down and realize you're quite high up. A fall from here would be deadly. Panic sets in. Your hands start to slip. You scream for help only to be met with your own echo. 'I'm not going to die like this' you think and gather all your strength to complete the climb. Alas! The end is in sight. You extend your arm to grasp the last hold, the thought of relief pushing you forwards.</p>";
                html += "<p>Then your foot slips.<p>";
                html += "<p>Your heart drops, you scream as you feel yourself get pulled towards the ground. You close your eyes and brace for impact... <p>";
                html += "Nothing happens. You open your eyes and look up. Aiza and Samiya are there <i>reaching out</i>, each of them grabbing one hand. They help you up and before you can thank them, they disappear. You know you're tight on time so decide to deal with this later. You take a deep breath and continue your journey. </p>";
                return html;
            }
        }

        return "<p>Your adventure continues in ways you never expected...</p>";
    }

    function trollDialogue(personAdventure: PersonAdventure): string {
        // Why are there so many of you? Dont worry we reproduce logarithmically and we're nearing our asymptote.
        let html = "<p>As you walk, you see a line of cut logs laid out across the mountain. Without knowing, you cross into the troll line and bump into a troll. You sigh, why does this troll look familiar?</p>";

        html += "<p> All of a sudden a troll spawns from every log in the forest. There were 241 trolls to be exact. WHY DO ALL THESE TROLLS LOOK THE SAME? </p>";

        html += "<p> 'Okay woah there why are there so many of you?' you ask, confused. </p>";

        html += "<p> The trolls face lights up. 'Oh! We actually reproduce logarithmically! But don't worry we're slowing down soon' </p>";

        html += "<p> 'How soon is soon?' you ask </p>";

        html += "<p> 'Around a thousand years' the troll says with a smile. </p>";

        html += "<p> 'WHAT? THATS NOT SOON!' you exclaim </p>";

        html += "<p> 'HEY YOU HAVE NO RIGHT TO SPEAK YOUR BREED PRODUCES EXPONENTIALLY! HOW DID YOU REACH EIGHT BILLION ALREADY?' the troll yells back </p>";

        html += "<p> 'Okay okay chill, I just want to get to the farm' you say. The troll laughs at that. </p>";

        html += "<p> The troll says if you do not guess ONE of the two numbers it's thinking of you will be punished without knowing what the punishment is. </p>";

        if ( personAdventure.items.includes("Uno") ) {
            html += "<p> 'No' you say. </p>";
            html += "<p> 'What do you mean no?' the troll is beginning to look stressed 'I am very powerful in this forest. You don't want to mess with me. '</p>";
            html += "<p> 'Oh ya?' you say pulling out an Uno reverse card. 'How about you guess my number instead?' </p>";
            html += "<p> The troll drops to it's knees. 'I can't believe I got trolled by a human' it says. 'Fine, you win. You can go to the farm now' </p>";
            html += "<p> You walk past the troll line and continue your journey to the farm </p>";
            html += "<p><i> Minus one point for <b>Nour</b></i></p>";
            return html;

        }

        html += "<p>", personAdventure.guess, "you say. The troll laughs and rubs its hands together. </p>";

        html += "<p>", personAdventure.guess, "you say. The troll laughs and rubs its hands together. </p>";

        html += "<p> 'Okay, my guess is " + personAdventure.guess + "!' you say. </p>";

        html += "<p> The troll grins and rubs its hands together. 'Very well then' it says. </p>"

        if (personAdventure.guess === 36 || personAdventure.guess === 97) {
            html += "<p>Just then you hear a faint scream coming from the farm. </p>";
            html += "<p> 'What was that?!' you exclaim </p>";
            html += "<p> 'Idk' the troll says cooly as it shrugs its shoulders. 'But you're free to go now!' </p>";
        } 
        // else if (personAdventure.guess === 88 ) {
        //     html += "<p>  </p>";
        // } else if (personAdventure.guess === 45) {
        //     html += "<p>  </p>";
        // } else {
        //     html += "<p>  </p>";
        // }

        html += "<p> 'Did I get the number correct?' you ask";
        html += "<p> 'There's no way of knowing until you arrive to the farm' the troll says </p>";
        html += "<p> You can barely hide your annoyance. The troll sees this and realizes it succesfully trolled you </p> "
        html += "<p><i>One point for <b>Nour</b></i></p>";

        return html;
    }

    function turnOne(personAdventure: PersonAdventure, change: number): string {
        let html = "<p> You manage to escape the troll with no effect (that you know of) And then you finally reach the farm!!! You see an old man running towards you with a shovel in his hand. You have three tries to convince him that you're a nice and friendly person </p>";

        html += "<p> You're aware that the cows are near, so you refrain from speaking in case the cows pick up what you say. Everything must be done in silence </p>"

        html += "<p> You raise your arms as the farmer approaches you and place your index finger to your lips, signalling that you will not speak. The farmer relaxes and places his shovel down. Now is your time to make your move. "

        const turn = 0;
        const action = personAdventure.actions[turn] ? personAdventure.actions[turn] : bender;

        if ( action === "Play cards" || action === "Cards" ) {
            if ( inventory.includes("Deck of Cards") ) {
                html += "<p> For your first attempt, you decide to pull out a deck of cards. You shuffle them and fan them out, gesturing the farmer to pick one. The farmer thinks for a bit and picks a card near the middle of the deck. </p>";
                html += "<p> You hand him back the deck and allow him to place the card wherever he wants. You take it back and perform some impressive riffle shuffles and deck cuts. The farmer can't help but smile at this impressive display of dexterity. </p>";
                html += "<p> Now is the real showstopper moment, you take the top card out of the deck and show the farmer. You see a frown creep up on his face. </p>";
                html += "<p> He thinks you messed up the trick. </p>";
                html += "<p> You smile and flick your wrist. Just like that the King of Hearts is staring back at the farmer as he stares back at you in awe. </p>";
            } else {
                html += "<p> START MIMING PLAYING CARDS - FARMER STARTS TO GET WORRIED </p>";
            }
        } else if (action === "Investing Advice" ) {
            if (change > 5) {
                html += "<p> You give the money and some investing advice and then he gets convinced and leaves </p>";
                // Don't call setNotConvinced here during render
            } else {
                html += "<p> He throws it in your face </p>";
            }
        } else if ( action === "Balloon Animals" ) {
            html += "<p> Just wholesome story abt making him a balloon animal and his eyes lighting up or smth </p>";
        } else if ( action === "Selfie" ) {
            if ( personAdventure.path === 1 ) {
                html += "<p> You take pic -> looks at camera roll and finds his old house, starts crying and goes back </p>";
            } else {
                html += "<p> ??? </p>";
            }
        } else if ( action === "Colour together" ) {
            if ( inventory.includes("Coloring Book + Crayons") ) {
                if ( personAdventure.path === 2 ) {
                    // Either he goes to get the green crayon or uses yellow and blue
                    html += "<p> Looks for green crayon but not there. </p>";
                } else {
                    html += "<p> Takes out green colour and just wholesome moment idk </p>";
                }
            } else {
                html += "<p> You try to mime colouring. </p>";
            }
        } else if ( action === "Picnic") {
            html += "<p> He gets potatoes for you both and you have a nice time </p>";
            // Don't call setNotConvinced here during render
        }


        return html
    }

    function turnTwo(personAdventure: PersonAdventure, change: number): string {
        let html = "<p>The farmer still looks unconvinced. You realize you need to try a different approach. Your second attempt begins...</p>";

        const turn = 1;
        const action = personAdventure.actions[turn] ? personAdventure.actions[turn] : bender;

        if ( action === "Play cards" || action === "Cards" ) {
            if ( inventory.includes("Deck of Cards") ) {
                html += "<p> For your second attempt, you decide to pull out a deck of cards. You shuffle them and fan them out, gesturing the farmer to pick one. The farmer thinks for a bit and picks a card near the middle of the deck. </p>";
                
            } else {
                html += "<p> START MIMING PLAYING CARDS - FARMER STARTS TO GET WORRIED </p>";
            }
        } else if (action === "Investing Advice" ) {
            if (change > 5) {
                html += "<p> You give the money and some investing advice and then he gets convinced and leaves </p>";
                // Don't call setNotConvinced here during render
            } else {
                html += "<p> He throws it in your face </p>";
            }
        } else if ( action === "Balloon Animals" ) {
            html += "<p> Just wholesome story abt making him a balloon animal and his eyes lighting up or smth </p>";
        } else if ( action === "Selfie" ) {
            if ( personAdventure.path === 1 ) {
                html += "<p> You take pic -> looks at camera roll and finds his old house, starts crying and goes back </p>";
            } else {
                html += "<p> ??? </p>";
            }
        } else if ( action === "Colour together" ) {
            if ( inventory.includes("Coloring Book + Crayons") ) {
                if ( personAdventure.path === 2 ) {
                    // Either he goes to get the green crayon or uses yellow and blue
                    html += "<p> Looks for green crayon but not there. </p>";
                } else {
                    html += "<p> Takes out green colour and just wholesome moment idk </p>";
                }
            } else {
                html += "<p> You try to mime colouring. </p>";
            }
        } else if ( action === "Picnic") {
            console.log("[TURN TWO] Picnic chosen");
            html += "<p> He gets potatoes for you both and you have a nice time </p>";
            // Don't call setNotConvinced here during render
        }

        return html
    }

    function turnThree(personAdventure: PersonAdventure, change: number): string {
        let html = "<p>This is your final chance to convince the farmer. You take a deep breath and prepare for your last attempt...</p>";

        const turn = 2;
        const action = personAdventure.actions[turn] ? personAdventure.actions[turn] : bender;

        if ( action === "Play cards" || action === "Cards" ) {
            if ( inventory.includes("Deck of Cards") ) {
                html += "<p> For your final attempt, you decide to pull out a deck of cards. You shuffle them and fan them out, gesturing the farmer to pick one. The farmer thinks for a bit and picks a card near the middle of the deck. </p>";
            } else {
                html += "<p> START MIMING PLAYING CARDS - FARMER STARTS TO GET WORRIED </p>";
            }
        } else if (action === "Investing Advice" ) {
            if (change > 5) {
                html += "<p> You give the money and some investing advice and then he gets convinced and leaves </p>";
            } else {
                html += "<p> He throws it in your face </p>";
            }
        } else if ( action === "Balloon Animals" ) {
            html += "<p> Just wholesome story abt making him a balloon animal and his eyes lighting up or smth </p>";
        } else if ( action === "Selfie" ) {
            if ( personAdventure.path === 1 ) {
                html += "<p> You take pic -> looks at camera roll and finds his old house, starts crying and goes back </p>";
            } else {
                html += "<p> ??? </p>";
            }
        } else if ( action === "Colour together" ) {
            if ( inventory.includes("Coloring Book + Crayons") ) {
                if ( personAdventure.path === 2 ) {
                    // Either he goes to get the green crayon or uses yellow and blue
                    html += "<p> Looks for green crayon but not there. </p>";
                } else {
                    html += "<p> Takes out green colour and just wholesome moment idk </p>";
                }
            } else {
                html += "<p> You try to mime colouring. </p>";
            }
        } else if ( action === "Picnic") {
            html += "<p> He gets potatoes for you both and you have a nice time </p>";
        }

        html += "<p>After your three attempts, the farmer finally seems to understand your intentions. Whether convinced by your actions or simply worn down by your persistence, he nods and steps aside, allowing you to approach the farm.</p>";

        return html
    }



    // Create journal pages for the story
    const journalPages = useMemo(() => [
        // Page 1: Introduction
        <div key="page1" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 1: The Journey Begins</h2> */}
                <div className={styles.storyText}>
                    <p>
                        You live near mount poll peak. At the top lives a very old farmer, who has not spoken to anyone or anything for the past 30 years. No one dares to enter his farm at the risk of interacting with him.
                    </p>
                    
                    <p>
                        <em>Until today!</em>
                    </p>
                    
                    <p>
                        You heard a rumor that the reason he&apos;s isolated is because his cows have the ability to speak English. This farmer read animal farm and does NOT wanna risk anything.
                    </p>
                    
                    <p>
                        But as an English language enthusiast you decide to set off with £20 in your backpack because you feel like you have a crucial message to deliver.
                    </p>
                </div>
            </div>
        </div>,

        // Page 2: Shopping
        <div key="page2" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 2: Preparations</h2> */}
                <div className={styles.storyText}>
                    <p>
                        You decide to spend the £20, thinking it will help you on your journey. After 30 minutes of hard thinking, you carry your stuff to the cashier.
                    </p>
                    
                    <p>
                        You watch as your things are dragged by the conveyer belt. You and the cashier give each other an awkward look. &quot;Why does the cashier kind of look like Bilgesu?&quot; you think to yourself, but shut the thought down. Its not like shes the treasurer or something.
                    </p>
                    
                    <p>
                        After the brief moment of awkwardness, you get handed your receipt:
                    </p>
                </div>
            </div>
        </div>,

        // Page 3: Receipt
        <div key="page3" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Your Receipt</h2> */}
                <div className={styles.receiptContainer}>
                    <div ref={receiptRef} className={styles.receipt}>
                        <div className={styles.receiptHeader}>
                            <strong>SISTERS SUPPLIES STORE</strong><br/>
                            13 Poll Peak Base Rd<br/>
                            Tel: (555) 123-STEMM
                        </div>
                        
                        <div className={styles.receiptInfo}>
                            Date: {personAdventure.date}<br/>
                            Time: {personAdventure.time}<br/>
                            Cashier: Bilgesu?
                        </div>
                        
                        <div className={styles.receiptItems}>
                            <div className={styles.receiptItemsHeader}>
                                <span><strong>ITEM</strong></span>
                                <span><strong>PRICE</strong></span>
                            </div>
                            {personAdventure.items
                                .filter(item => !(person === "Suweda" && item === "GitHub Account"))
                                .map((item: string, index: number) => (
                                <div key={index} className={styles.receiptItem}>
                                    <span>{item}</span>
                                    <span>${(itemPrices[item] || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.receiptTotal}>
                            <span>TOTAL:</span>
                            <span>${personAdventure.items
                                .filter(item => !(person === "Suweda" && item === "GitHub Account"))
                                .reduce((total, item) => total + (itemPrices[item] || 0), 0).toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.receiptFooter}>
                            Thank you for shopping!<br/>
                            Good luck on your adventure!
                        </div>
                    </div>
                </div>
                
                <button 
                    className={styles.receiptSaveButton}
                    onClick={saveReceiptAsImage}
                    type="button"
                >
                    💾 Save Receipt as Image
                </button>
            
                {tech && (
                    <p>You realized the GitHub account is not on your receipt. But why would it be? You&apos;re tech lead of course you have a GitHub Account!</p>
                )}
        
            </div>
        </div>,

        // Page 4: Leaving the store
        <div key="page4" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 3: The Path Forward</h2> */}
                <div className={styles.storyText}>
                    {isClient && change > 0 && (
                        <p>You pocket your £{change} of change and head out.</p>
                    )}
                    
                    {isClient && change <= 0 && (
                        <p>You leave without any change, you are now one step closer to debt. Your stomach drops. What if you need something else on the journey? YOLO you say and head out.</p>
                    )}
                    
                    <p>
                        Your heart is racing, your palms are sweaty. It&apos;s getting real now. As you walk, the sun that was once shining warmly on your back suddenly disappears.
                    </p>
                    
                    <p>
                        You slowly raise you head up and see something towering above you. You&apos;ve reached the base of the mountain.
                    </p>
                </div>
            </div>
        </div>,

        // Page 5: The path choice
        <div key="page5" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 4: The Choice</h2> */}
                <div className={styles.storyText}>
                    <p>
                        There are three paths ahead of you:
                    </p>
                    
                    <ol>
                        <li>A cabin on the mountain&apos;s left edge.</li>
                        <li>A rock climbing wall on the mountain&apos;s middle.</li>
                        <li>A forest on the mountain&apos;s right edge.</li>
                    </ol>
                    
                    <p>
                        You take a deep breath, feeling the weight of your decision. Each path seems to promise a different adventure, but you know you can only choose one.
                    </p>
                    
                    <p>
                        The cabin looks cozy and inviting, the rock climbing wall challenges your adventurous spirit, and the forest whispers secrets of its own. Which path will you choose?
                    </p>
                    
                    <p className={styles.choice}>
                        <strong>You chose: {typeof personAdventure.path === 'number' 
                            ? paths[personAdventure.path - 1] 
                            : personAdventure.path}</strong>
                    </p>
                </div>
            </div>
        </div>,

        // The path adventure
        <div key="page6" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 5: The Adventure Unfolds</h2> */}
                <div className={styles.storyText}>
                    <div dangerouslySetInnerHTML={{ __html: pathResult(personAdventure as PersonAdventure) }} />
                </div>
            </div>
        </div>,

        // TROLL TIME
        <div key="page7" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 5: The Adventure Unfolds</h2> */}
                <div className={styles.storyText}>
                    <div dangerouslySetInnerHTML={{ __html: trollDialogue(personAdventure as PersonAdventure) }} />
                </div>
            </div>
        </div>,

        // FARMER INTERACTION - Turn One
        <div key="page8" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 5: The Adventure Unfolds</h2> */}
                <div className={styles.storyText}>
                    <div dangerouslySetInnerHTML={{ __html: turnOne(personAdventure as PersonAdventure, change) }} />
                </div>
            </div>
        </div>,

        // FARMER INTERACTION - Turn Two (only if not convinced after Turn One)
        ...(!isFarmerConvinced.afterTurnOne ? [<div key="page9" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 5: The Adventure Unfolds</h2> */}
                <div className={styles.storyText}>
                    <div dangerouslySetInnerHTML={{ __html: turnTwo(personAdventure as PersonAdventure, change) }} />
                </div>
            </div>
        </div>] : []
        ),

        // FARMER INTERACTION - Turn Three (only if not convinced after Turn Two)
        ...(!isFarmerConvinced.afterTurnTwo ? [<div key="page10" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 5: The Adventure Unfolds</h2> */}
                <div className={styles.storyText}>
                    <div dangerouslySetInnerHTML={{ __html: turnThree(personAdventure as PersonAdventure, change) }} />
                </div>
            </div>
        </div>] : []
        ),

        // Summary
        <div key="page11" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Adventure Summary</h2> */}
                <div className={styles.summaryContent}>
                    
                    <div className={styles.summarySection}>
                        <h3>Path Chosen:</h3>
                        <p>
                            {typeof personAdventure.path === 'number' 
                                ? paths[personAdventure.path - 1] 
                                : personAdventure.path
                            }
                        </p>
                    </div>
                    
                    <div className={styles.summarySection}>
                        <h3>Items Brought:</h3>
                        <ul>
                            {personAdventure.items.map((item: string, index: number) => (
                                <li key={index}>
                                    {item} (${itemPrices[item] || 0})
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className={styles.summarySection}>
                        <h3>Actions Taken:</h3>
                        <ul>
                            {personAdventure.actions.map((action: string, index: number) => (
                                <li key={index}>{action}</li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className={styles.summarySection}>
                        <h3>Guess:</h3>
                        <p>{personAdventure.guess}</p>
                    </div>
                    
                    <div className={styles.summarySection}>
                        <h3>Slang:</h3>
                        <p>&quot;{personAdventure.slang}&quot;</p>
                    </div>
                </div>
            </div>
        </div>
    ], [isFarmerConvinced, personAdventure, change, isClient, tech, person, paths, itemPrices, bender]);
    
    return (
        <div className={`${styles.container} ${styles[`page${currentPage + 1}`]} ${styles[`path${personAdventure.path}`]}`}>
            <h1 className={styles.title}>{person}&apos;s Farm Adventure</h1>
            
            <div className={styles.journalContainer}>
                <div className={styles.journalBook}>
                    {journalPages[currentPage]}
                    
                    <div className={styles.pageNavigation}>
                        <button 
                            className={styles.navButton}
                            onClick={handlePrevClick}
                            disabled={currentPage === 0}
                        >
                            ← Previous
                        </button>
                        
                        <div className={styles.pageIndicatorSection}>
                            <span className={styles.pageIndicator}>
                                Page {currentPage + 1} of {journalPages.length}
                            </span>
                            
                            <form onSubmit={handlePageInputSubmit} className={styles.pageJumpForm}>
                                <input
                                    type="number"
                                    name="pageNumber"
                                    min="1"
                                    max={journalPages.length}
                                    placeholder="Go to..."
                                    className={styles.pageInput}
                                />
                                <button type="submit" className={styles.pageJumpButton}>
                                    Go
                                </button>
                            </form>
                        </div>
                        
                        <button 
                            className={styles.navButton}
                            onClick={handleNextClick}
                            disabled={currentPage === journalPages.length - 1}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
