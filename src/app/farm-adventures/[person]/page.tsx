'use client';

import { useParams } from 'next/navigation';
// import { notFound } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, captureOwnerStack } from 'react';
import adventureData from "../../json_files/adventure.json";
import styles from "./farm-preson.module.scss";
import polls from "../../json_files/polls.json";

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
    const personAdventure: PersonAdventure | undefined = 
        adventures && (person in adventures) 
        ? (adventures[person] as PersonAdventure) 
        : undefined;

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

    const fav_potato = polls.polls["What is your way to consume a potato"];
    type potatoKey = keyof typeof fav_potato;

    let potato: potatoKey | 'pass' = 'pass';

    for (const [potato_type, data] of Object.entries(fav_potato) as [potatoKey, { voters: string[] }][]) {
        if (data.voters.includes(person)) {
            potato = potato_type;
            break;
        }
    }

    const tech = person === "Suweda" && personAdventure?.items?.includes("GitHub Account");

    // Only calculate change on client to avoid hydration mismatch
    const items = personAdventure?.items ?? [];
    const change = isClient
    ? Math.floor(
        20 -
        items
            .filter(item => !(person === "Suweda" && item === "GitHub Account"))
            .reduce((total, item) => total + (itemPrices[item] || 0), 0)
        )
    : 0;

    // Calculate farmer convincing logic progressively - this hook must be called for all cases
    const isFarmerConvinced = useMemo(() => {
        if (!personAdventure?.actions || !isClient) {
            return { afterTurnOne: false, afterTurnTwo: false, afterTurnThree: false };
        }

        // Check Turn One
        const turnOneAction = personAdventure.actions[0] || bender;
        
        // Special case: If player chose cabin path and has lock picking kit (gets diary entry), farmer is convinced after Turn One
        if (personAdventure.path === 1 && personAdventure.items.includes("Lock picking kit")) {
            return { afterTurnOne: true, afterTurnTwo: true, afterTurnThree: true };
        }

        if (personAdventure.path === 1 && !personAdventure.items.includes("Lock picking kit") && !personAdventure.items.includes("Camera")) {
            return { afterTurnOne: false, afterTurnTwo: true, afterTurnThree: true };
        }
        
        if (turnOneAction === "Investing Advice" && change > 5) {
            return { afterTurnOne: true, afterTurnTwo: true, afterTurnThree: true };
        }
        if (turnOneAction === "Picnic") {
            return { afterTurnOne: true, afterTurnTwo: true, afterTurnThree: true };
        }

        if ( personAdventure.guess === 97 ) {
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

        if (turnTwoAction === "Colour together" && personAdventure.items.includes("Coloring Book + Crayons")) {
            return { afterTurnOne: false, afterTurnTwo: true, afterTurnThree: true };
        }

        if (turnTwoAction === "Selfie" && !personAdventure.items.includes("Camera")) {
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
                    <div className={styles.journalPage}>
                        <p>You were handling the finances at the Sister Supply Store all day.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (person === "Nour") {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>{person}&apos;s Farm Adventure</h1>
                <div className={styles.journalContainer}>
                    <div className={styles.journalPage}>
                        <div className={styles.storyText}>
                            <p>You hid behind a <i>LOG</i> and <i>TROLLED</i> everyone on comm.</p>
                            <br></br>
                            <p className={styles["troll-points-txt"]}><i><b>8 points for Nour</b></i></p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Check if the person has complete data
    if (!personAdventure?.items || !personAdventure?.actions) {
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

    // Robust scroll to top function for mobile compatibility
    function scrollToTop() {
        // Store current scroll position to detect if scroll actually happened
        const initialScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        
        // Immediate scroll attempt
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            // Fallback for older browsers
            window.scrollTo(0, 0);
        }
        
        // Additional mobile-specific fixes with multiple timeouts
        // This helps with iOS Safari and other mobile browsers that can be delayed
        setTimeout(() => {
            try {
                // Check if we need to force scroll
                const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                if (currentScrollTop > 50) { // If we're still significantly scrolled down
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                }
            } catch (error) {
                // Final fallback
                window.scrollTo(0, 0);
            }
        }, 10);
        
        // Extra timeout for stubborn mobile browsers
        setTimeout(() => {
            const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            if (currentScrollTop > 10) { // Force scroll if still not at top
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }
        }, 100);
    }

    function handlePrevClick() {
        setCurrentPage(prevPage => Math.max(0, prevPage - 1));
        scrollToTop();
    }

    function handleNextClick() {
        setCurrentPage(prevPage => Math.min(journalPages.length - 1, prevPage + 1));
        scrollToTop();
    }

    function handlePageJump(pageNumber: number) {
        if (pageNumber >= 1 && pageNumber <= journalPages.length) {
            setCurrentPage(pageNumber - 1); // Convert to 0-based index
            scrollToTop();
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

                html += "<p>You decide to document this mysterious place. You take several photos of the cabin's exterior, capturing its weathered wood. You decide to scout the perimeter. At a distance you can see sections blocked off by fences, it looks farm-like, you think. You decide to take a picture of it, intrigued by the stillness of what you believe used to be a vibrant farm.</p>";

                html += "<p> You walk towards the back of the cabin and find a plushie. You can't make out what animal it's supposed to be as it has been left in the dirt for so long it's starting to decompose. You decide to take a picture of that as well.  </p>";

                html += "<p> Still curious, you peer into one of the windows. The sunlight perfectly strikes a photo sitting on a desk. It's a picture of  a troll with a baby cow. &quot;Is that the farmer's cow?&quot; you think. You decide to snap a photo. </p>";

                html += "<p> Satisfied with the three photos and the stories you might unravel, you decide to continue your adventure. </p>";

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
                html += "<p>&quot;Hiya friend! Can me and my friends sit with ya?&quot; Their voice sounds familiar, making you feel strangely at home. You sit up and brush the mat, gesturing them to take a seat. A dozen elves come flocking onto the mat, staring all wide eyed and smiley at you. </p>";
                html += "<p> You feel a bit uneasy as these elves have a bit of a familiar look to them. &quot;Sorry but what do you guys do?&quot; you ask. </p>"
                html += "<p> &quot;We're the elves of this mountain! We maintain balance in the ecosystem by helping anyone that needs it!&quot; </p>";
                html += "<p>Thats when it clicks. These elves look like Zainab and Aliyah! This is your chance to escape this forest</p>";
                html += "<p>&quot;Wait so if I need help getting out of this forest can you help me?&quot;</p>";
                html += "<p>&quot;We sure can! Just follow me!&quot; </p>";
                html += "<p>And just like that, with the snap of the elf's finger you find yourself standing in front of the forest. You thank all twelve of the elves and continue on your journey. </p>";
            } else if (personAdventure.items.includes("Coloring Book + Crayons")) {
                html += "<p>&quot;I'll figure this out in a bit,&quot; you think to yourself. You take out your " + (movie !== 'pass' ? movie : "Spiderman") + " colouring book and start badly colouring ";

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
                html += "<p>Hello there friend! Can me and my other friend sit with ya?&quot; Their voice sounds familiar, making you feel strangely at home. You look up from your colouring book and hand one of them a green crayon. They all gather round the chosen elf, staring at the crayon in amazement. </p>";
                html += "<p> &quot;This is a crayon! It's used -&quot; </p>";
                html += "<p> But just as you're about to finish your sentence you watch the elf shove the crayon in their mouth.  </p>";

                if (person === "Aliyah" ) {
                    html += "<p> Next thing you know, the elf grabbing at it's neck and gasping for air, their friend is screaming and running in circles. While you look at this disaster unfold, you can't help but see the elves resemblance to Zainab and yourself. But just as you're about to mention it the gravity of the situation hits you. </p>";
                } else if (person === "Zainab") {
                    html += "<p> Next thing you know, the elf grabbing at it's neck and gasping for air, their friend is screaming and running in circles. While you look at this disaster unfold, you can't help but see the elves resemblance to yourself and Aliyah. But just as you're about to mention it the gravity of the situation hits you. </p>";
                }

                html += "<p> &quot;You're choking!&quot; you say </p>";
                html += "<p> You get up and perform the heimlich on the choking elf. After what feels like forever you see a crayon fly across the forest. </p>";
                html += "<p> &quot;Phew&quot; the elf exclaims. &quot;How can I repay you?&quot; </p>";
                html += "<p> &quot;Can you help me get out of this forest?&quot; you ask </p>";
                html += "<p> &quot;Sure I can!&quot; </p>";

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
                html += "<p>You pull out your camera and start taking pictures of the wall. &quot;Imagine telling people I cleared this,&quot; you think to yourself. The very idea of being able to brag about it fills you with energy. </p>";
                html += "<p>You tackle the wall with renewed vigor, your enhanced energy helping you power through the challenging sections with surprising ease.</p>";
                html += "<p>As you reach the top, fatigue starts to strike. You stop for a bit to try and catch your breath and make the mistake of looking down. A fall from here can kill you. Panic starts to set in. You shakily continue the climb. </p>";
                html += "The end is drawing near. The anticipation of relief is just enough to keep you going. You reach the final hold and get ready to push yourself up onto the flat terrain. ";
                html += "<p> But you can't do it. Your remaining energy is being spent on trying to keep you still. Thats when you feel a force pull you up. As you lay on your back, you are sheilded from the sun by Khadeja and Rameen. </p>";
                html += "<p> &quot;Did you actually think we'd let you die with an insane picture like that?&quot; they say </p>";
                html += "<p> Just as you're about to respond, they disappear. Too tired to process what happened, you choose to ignore the whole situation. </p>";
                html += "<p>&quot;I cant wait to post this on my " + content + "&quot;, you say through panting breaths. <p> But before you do that you remembered you need to reach the farm. "
                return html;
            } else {
                // AIZA AND SAMIYA COMING TO HELP YOU CUZ THEYRE OUTREACH
                // Should we make it only if you have the STEMM Sticker?
                html += "<p>Without anything to help you, you decide to attempt a free climb. You make it partway up using just your hands and determination.</p>";
                html += "<p>Eventually your arms start to get shaky. You look down and realize you're quite high up. A fall from here would be deadly. Panic sets in. Your hands start to slip. You scream for help only to be met with your own echo. &quot;I'm not going to die like this&quot; you think and gather all your strength to complete the climb. Alas! The end is in sight. You extend your arm to grasp the last hold, the thought of relief pushing you forwards.</p>";
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

        html += "<p> All of a sudden a troll spawns from every log in the forest. There were 228 trolls to be exact. WHY DO ALL THESE TROLLS LOOK THE SAME? </p>";

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

        html += "<p> You're aware that the cows are near, so you refrain from speaking in case the cows pick up what you say. Everything must be done in silence </p>";

        html += "<p> You raise your arms as the farmer approaches you and place your index finger to your lips, signalling that you will not speak. ";

        if ( personAdventure.guess === 36 ) {
            html += "He is still charging towards you. He looks really distressed. </p>";

            html += "<p> &quot;M-my cows&quot; he says between deep breaths. &quot;They're not right.. somethings wrong they're different&quot; </p>";

            html += "<p> &quot;Of course they're different&quot; you think. &quot;They speak English!&quot; </p>";

            html += "<p> You conclude that he's just old and has memory issues, so you try and calm him down. </p>";

        } else if (personAdventure.guess === 97) {

            html += "As he runs towards you his voice gets clearer. &quot;They're all gone!&quot; he shouts. &quot;All but one! I'm free! I'm free!&quot; </p>";

            html += "<p> &quot;Excuse me sir! What is going on?&quot; </p>";

            html += "<p> &quot;My cows&quot; he says, a massive grin on his face. &quot;I don't know how but they're all gone! Did a troll ask you to guess a number?&quot; </p>";

            html += "<p> &quot;Yes&quot; you say </p>";

            html += "<p> &quot;Oh thank god! You guessed wrong! This must be one of the trolls punishments! I've been waiting for this day! Thank you! Thank you!&quot; he shouts. He's practically ripping his hair out from happiness </p>";

            html += "<p> You realize the farmer is too euphoric to even notice you anymore. He's begun kissing the floor and crying uncontrollably on his knees. Seeing your opportunity you slip past him and enter the farm. </p>";

            return html

        } else {
            html += "The farmer relaxes and places his shovel down. Now is your time to make your move. "
        }

        const turn = 0;
        const action = personAdventure.actions[turn] ? personAdventure.actions[turn] : bender;

        if (inventory.includes("Diary Entry")) {
            html += "<p> You pull out the diary entry you found in the cabin and show it to the farmer. His eyes widen as he recognizes the handwriting. &quot;This... this is my writing,&quot; he whispers, a mix of shock and sorrow in his voice. &quot;To think I once dreamed of the life I have, just for me to hate it now.&quot; </p>";
            html += "<p> The farmer's expression softens as he looks at you with a newfound understanding. &quot;You found this in the cabin, didn't you? I haven't been back there in years. Thank you for bringing this to me. It means more than you know.&quot; </p>";
            html += "<p> You nod, feeling a sense of accomplishment. &quot;I just wanted to help. Animal Farm is fiction, your cows won't turn on you. Not if I talk to them for you,&quot; you say, pointing at the cows. The farmer chuckles softly, a genuine smile breaking through his weathered face. &quot;Maybe you're right. Maybe it's time I stop fearing what I don't understand.&quot; </p>";

            html += "<p> &quot;It's time&quot; he says. &quot;I've been running away from the inevitable. Silence doesn't sit well with the mind. I was so expressive then, now I'm just a soulless vessel. What is life without connection? Go do it. Talk to the cows. Let them connect the way we just did. Let them learn the value of expression. A value I've failed to recognize.&quot; </p>";

            html += "<p> &quot;Thank you&quot; he mutters, a sad smile on his face.</p>";

            html += "<p> And with that, the farmer clutches his diary entry, gives you a slight nod and heads back into his shed. </p>";

        } else if ( action === "Play cards" || action === "Cards" ) {
            if ( inventory.includes("Deck of Cards") ) {
                html += "<p> For your first attempt, you decide to pull out a deck of cards. You shuffle them and fan them out, gesturing the farmer to pick one. The farmer thinks for a bit and picks a card near the middle of the deck. </p>";
                html += "<p> You hand him back the deck and allow him to place the card wherever he wants. You take it back and perform some impressive riffle shuffles and deck cuts. The farmer can't help but smile at this impressive display of dexterity. </p>";
                html += "<p> Now is the real showstopper moment, you take the top card out of the deck and show the farmer. You see a frown creep up on his face. </p>";
                html += "<p> He thinks you messed up the trick. </p>";
                html += "<p> You smile and flick your wrist. Just like that the King of Hearts is staring back at the farmer as he stares back at you in awe. </p>";
            } else {
                html += "<p> You reach into your backpack trying to feel for your deck of cards. After minutes of searching your heart drops as you realize you forgot to buy cards. In a moment of desperation, you pull out nothing and decide to improvise and mime shuffling the deck. You hand the invisible deck to the farmer and he stares at you in confusion. Your right hand remains in a dealers grip, you stare at him manically and point at your empty hand with your left hand, mouthing pick one. </p>";

                html += "<p> The farmer hesitantly picks a card from the invisible deck. He pretends to pensively look at the card and memorize it. You take it back and perform some impressive invisible riffle shuffles and deck cuts. The farmer watches and smiles, as his eyes show increasing concern for your mental wellbeing. </p>";

                html += "<p> You pretend to pull out a card and start cheering as if you got the card correct. The farmer is starting too look scared. &quot;Who is this freak he thinks to himself&quot;. You see a frown creep up on his face. </p>";
            }
        } else if (action === "Investing Advice" ) {
            if (change > 5) {
                html += "<p> &quot;I'm here to give you something&quot; you whisper. &quot;A new beginning&quot; </p>";
                html += "<p> You pull out your " + change + " pounds of leftover cash and hand it to the farmer. He looks at you stunned. &quot;What on earth am I going to do with " + change + " pounds?&quot; he whispers angrily. </p>";
                html += "&quot;Invest it.&quot; you say, with a grin. ";

                html += "<p> &quot;Investing? Isn't that just some new generation BS?&quot;  </p>";

                html += "<p> &quot;No it's very controlled&quot; you say. &quot;In today's day and age you can take this cash and turn it into as much as you want. There are whole mathematical models that predict the markets nowadays.&quot; </p>";

                html += "<p> His eyes light up. &quot;Mathematical you say? Well I do enjoy math. Thank you, I'll look into this. And you're sure it will make me rich?&quot; </p>";

                html += "<p> &quot;Positive&quot; you say </p>";

                html += "<p> &quot;Okay then. Who needs a farm then? I'm going to buy some investing equipment!&quot; And with that the farmer leaves his farm behind, on the search for investing equipment (a laptop). </p>";

                // Don't call setNotConvinced here during render
            } else {
                html += "<p> He throws it in your face </p>";
            }
        } else if ( action === "Balloon Animals" ) {
            if (inventory.includes("Balloons") ) {
                html += "<p> You rummage through your bag again. &quot;Please tell me I have balloons&quot;. Just then you feel a bit of friction as you try to move your hand. &quot;Bingo! I have balloons&quot;. You yank a green one out with excitement and begin to fill it up with air.  </p>";

                html += "<p> The farmer turns around at the sound of you wheezing into the balloon. His eyes begin to light up more and more as the balloon gets fuller.  He walks closer, intrigued at what you're about to do.  </p>";

                html += "<p> You tie the balloon and begin to pinch a small section near the opening. You then twist it. You then fold the balloon over and make an even bigger section, the two sides of the balloon are touching now. You twist that off as well. You repeat this a few more times, taking care not to make it pop.  </p>";

                html += "<p> You finally finish and hand the farmer your creation with the biggest smile.  </p>";

                html += "<p> &quot;Is this mine?&quot; he asks innocently </p>";

                html += "<p> &quot;Yes! All yours!&quot; you reply </p>";

                html += "<p> He begins to tear up as he mouths thank you. You can see it in his eyes that he's hurt. He stares at the balloon dog and reflects deeply. </p>";

                html += "<p> &quot;I lost everything for nothing.&quot; he whispers.  &quot;I wish I could go back in time and reverse this. If someone would have come and spoken to me sooner, maybe I would have realized my mistake much earlier. But I'm too far gone now.&quot;  </p>";
            }

        } else if ( action === "Selfie" ) {
            if ( personAdventure.path === 1 ) {
                html += "<p> You take pic -> looks at camera roll and finds his old house, starts crying and goes back </p>";
            } else {
                html += "<p> You give the farmer a warm smile and rummage through your backpack for your camera. You timidly pull it out and wave him over. You turn the lens towards you, and smile a big warm smile. The farmer standing nearby. Click! </p>";

                if (person === "Aliyah") {

                    html += "<p> You load up the picture and hand the camera to the old man. He first looks at the picture, then  at you, then back at the picture, then you. &quot;Elf&quot; he whispers, pointing at you in the picture.</p>";

                    html += "<p> &quot;No, I'm not an elf. I met them though, they're really nice.&quot; you whisper back.   </p>";

                }

                html += "<p> You load up the picture and hand the camera to the farmer. </p>";

                html += "<p> He turns his attention to himself. He looks visibly disturbed, it's very clear that the isolation has taken a toll on him both physically and mentally. It seems he's just now seeing the physical effect. His lip quivers as he looks up to the sky trying to compose himself. </p>";

                html += "<p> In a bout of rage he throws your camera on the floor. You pick it up and put it back in your backpack. </p>";
            }
        } else if ( action === "Colour together" ) {
            if ( inventory.includes("Coloring Book + Crayons") ) {
                if ( personAdventure.path === 2 ) {
                    // Either he goes to get the green crayon or uses yellow and blue
                    html += "<p> You sit down on the grass and gesture him to sit with you. You then pull out a colouring book and hand take a red crayon. You hand him the box. His hand hovers over it, as if he's looking for something. After a few minutes he pulls out a black crayon and writes 'Green?' on the first page of the colouring book. </p>";

                    html += "<p> 'Elf lost it' you write back. </p>";

                    if (person === "Aliyah" ) {
                        html += "<p> 'Oh so you lost it?' The farmer writes. He can barely hold it together at his own joke. </p>";

                        html += "<p> 'Haha very funny' you write back. </p>";
                    }

                    html += "<p> The farmer chuckles at the thought. </p>";

                    html += "<p> The farmer grabs the box again and takes out blue and yellow. With a blue crayon in his left, and a yellow crayon in his right, he scribbles all over the page in his makeshift green. </p>";

                } else {
                    html += "<p> Takes out green colour and just wholesome moment idk </p>";
                }
            } else {
                html += "<p> You decide an arts bonding session would be nice, so you look through your backpack for your colouring book and crayons. </p>";

                html += "<p> &quot;Uh oh&quot; you think. &quot;I forgot to buy a colouring book&quot;  </p>";

                html += "<p> It's too late to do anything now! So you dedicate to the bit. You sit down, pick up a stick and start aggressively scribbling on the grass. The farmer looks at you confused. He slowly approaches you, his concern increasing with each step. You look up and notice him towering above you, like a worried parent. You gesture at him to come sit down with you. </p>";

                html += "<p> He shakes his head and walks away. </p>";
            }
        } else if ( action === "Picnic") {
            if (inventory.includes("Picnic Mat")) {
                html += "<p> You lay the picnic mat out and brush the dirt off. You take a seat and gesture him to do the same. </p>";

                html += "<p> His eyes light up and he runs back to his shed. He comes back with a massive tray wrapped in tin foil and places it in the middle of the picnic mat. He carefully peels off the tin foil and both of you get hit with a cloud of smoke. </p>";

                html += "<p> After the smoke clears you notice the farmer prepared himself some " + potato + ". </p>";

                html += "<p> &quot;These are my favorite&quot; he says. &quot;I thought you might like some too!&quot; </p>";

                html += "<p> &quot;Are you kidding me?!&quot; you say. &quot;This is MY WAY to consume a potato!&quot;";

                html += "<p> You sit in silence enjoying the meal. </p>";

                html += "<p> &quot;I don't know why you're here &quot; the farmer starts, &quot;but I don't think I care. I just wanted to say thank you for shring this meal with me. It's been a while since I've done that with someone. And to think I've been doing this all because of some cows?!&quot; he laughs at the absurdity of his own sentence. "

                html += "<p> &quot;I don't think I want to live like this anymore&quot; he continues. &quot;Thank you for making me realize that. The cows are all yours, ";

                if ( personAdventure.guess === 36 ) {
                    html += "even though there's something not right with them. I dont even think I can milk them anymore. Maybe I'm just hallucinating, you know how old age is. But go crazy!&quot; he says. He slowly gets up from the picnic mat, takes his tray and returns to his shed. ";
                } else {
                    html += "do whatever you want with them.&quot; he says with a smile. &quot;I'm done&quot;";

                    html += "He picks himself up off the picnic might with great difficulty due to his age. He then picks up his tray and heads back to his shed.";
                }

            } else {
                html += "<p> You try to mime having a picnic but the farmer looks at you like you're crazy </p>";
            }
        }

        return html
    }

    function turnTwo(personAdventure: PersonAdventure, change: number): string {
        const feel = personAdventure.guess === 36 ? "distressed" : "unconvinced";

        let html = "<p>The farmer still looks " + feel + ". You realize you need to try a different approach. Your second attempt begins...</p>";

        const turn = 1;
        const action = personAdventure.actions[turn] ? personAdventure.actions[turn] : bender;

        if ( inventory.includes("Plushie") ) {

            html += "<p> Suddenly you remember about the plushie in your bag. You kneel down and open your bag and frantically search through it. This has got to mean something you think. The farmer looks at you in shock. 'Where did she get all this energy from' he thinks. </p>";

            html += "<p> Suddenly you feel fur brush against your fingers. You grab the object and yank it out of your bag, exposing it to the outside world. You lift it high above your head, showing the farmer what you found.  </p>";

            html += "<p> He stares a long pensive stare. His face begins to distort in shock. &quot;My Shami&quot; he whispers, tears welling up in his tired eyes. &quot;Where did you find her?&quot; "

            html += "<p> &quot;I passed by a cabin on my way here and found her in the backyard.&quot; you say";

            html += "<p> &quot;Shami was my very first love.&quot; he explains. &quot;She's the reason I wanted to become a farmer. My dad bought her for me so that I could understand his work. He was a farmer too you see, but not as intense as me. She's the reason I love cows, Shami's always been my favorite cow.&quot; </p>";

            html += "<p> He starts hugging and kissing Shami. You look away because Shami's really dirty and you don't even wanna imagine what diseases this guy is gonna get. </p>";

            html += "<p> &quot;Thank you.&quot; he says. &quot;I didn't even get to say bye to my parents. Can you believe that?&quot; his voice cracks. </p>";

            html += "<p> &quot;All because of these cows! So what if animal farms happens? I treated my animals well, just like my dad did. I let go of what was most important to me all because of a delusion. I can't do this anymore.&quot; </p>";

            html += "<p> &quot;Go do it.&quot; he says </p>";

            html += "<p> &quot;Do what?&quot; you ask </p>";

            html += "<p> &quot;Just rip the bandaid off, I need this phase of my life over with. Go expose the cows to our language. Let them share our tongue. To hell with the consequences. I'm done&quot; he says and walks off into the distance, clutching Shami tight as tears silently stream down his face. ";


        } else if ( action === "Play cards" || action === "Cards" ) {
            if ( inventory.includes("Deck of Cards") ) {
                html += "<p> For your second attempt, you decide to pull out a deck of cards. You shuffle them and fan them out, gesturing the farmer to pick one. The farmer thinks for a bit and picks a card near the middle of the deck. </p>";
                
            } else {
                html += "<p> You reach into your pocket and pull out nothing. Realizing you forgot to buy cards you decide to improvise and mime shuffling the deck. You hand the invisible deck to the farmer and he stares at you in confusion. Your right hand remains in a dealers grip, you stare at him manically and point at your empty hand with your left hand, mouthing pick one. </p>";
                html += "<p> The farmer hesitantly picks a card from the invisible deck. He pretends to pensively look at the card and memorize it. You take it back and perform some impressive invisible riffle shuffles and deck cuts. The farmer watches and smiles, as his eyes show increasing concern for your mental wellbeing. </p>";
            }
        } else if (action === "Investing Advice" ) {
            if (change > 5) {
                html += "<p> You give the money and some investing advice and then he gets convinced and leaves </p>";
                // Don't call setNotConvinced here during render
            } else {
                html += "<p> He throws it in your face </p>";
            }
        } else if ( action === "Balloon Animals" ) {
            if (inventory.includes("Balloons") ) {
                html += "<p> You rummage through your bag again. &quot;Please tell me I have balloons&quot;. Just then you feel a bit of friction as you try to move your hand. &quot;Bingo! I have balloons&quot;. You yank a green one out with excitement and begin to fill it up with air.  </p>";

                html += "<p> The farmer turns around at the sound of you wheezing into the balloon. His eyes begin to light up more and more as the balloon gets fuller.  He walks closer, intrigued at what you're about to do.  </p>";

                html += "<p> You tie the balloon and begin to pinch a small section near the opening. You then twist it. You then fold the balloon over and make an even bigger section, the two sides of the balloon are touching now. You twist that off as well. You repeat this a few more times, taking care not to make it pop.  </p>";

                html += "<p> You finally finish and hand the farmer your creation with the biggest smile.  </p>";

                html += "<p> &quot;Is this mine?&quot; he asks innocently </p>";

                html += "<p> &quot;Yes! All yours!&quot; you reply </p>";

                html += "<p> He begins to tear up as he mouths thank you. You can see it in his eyes that he's hurt. He stares at the balloon dog and reflects deeply. </p>";

                html += "<p> &quot;I lost everything for nothing.&quot; he whispers.  &quot;I wish I could go back in time and reverse this. If someone would have come and spoken to me sooner, maybe I would have realized my mistake much earlier. But I'm too far gone now.&quot;  </p>";
            }
        } else if ( action === "Selfie" ) {
            if ( personAdventure.path === 1 ) {
                html += "<p> You take pic -> looks at camera roll and finds his old house, starts crying and goes back </p>";
            } else {
                html += "<p> Once again, you reach into your backpack and rummage through it trying to find your camera. After a few minutes of searching you realize you didn't buy a camera. </p>";

                html += "<p> &quot;What is wrong with me today?&quot; you think to yourself </p>";

                html += "<p> &quot;Oh well, here we go again&quot; </p>";

                html += "<p> You look up at the farmer with the same maniacal smile and create a rectangle with your hands, trying to mime a camera.  </p>";

                html += "<p> &quot;Picture?&quot; you mouth </p>";

                html += "<p> The farmer fearfully shakes his head no. You start aggressively waving your hand, gesturing to him to come over to you. When he refuses you go to him instead, still smiling that same intense smile. </p>";

                html += "<p> &quot;Listen, M-Miss. I don't know if you just escaped a mental hospital or what, but I'm really not comfortable being around you. Are you here for my cows? W-Will they m-make you feel better? Y-You c-can go to them if you'd l-like. P-Please just l-leave me a-alone.&quot; </p>";

                html += "<p> The farmer slowly backs up, and as soon as he gets far enough from you he starts running (as fast as an old man can) towards the shed.  </p>";
            }
        } else if ( action === "Colour together" ) {
            if ( inventory.includes("Coloring Book + Crayons") ) {
                if ( personAdventure.path === 2 ) {
                    // Either he goes to get the green crayon or uses yellow and blue
                    html += "<p> You sit down on the grass and gesture him to sit with you. You then pull out a colouring book and take a red crayon. You hand him the box. His hand hovers over it, as if he's looking for something. After a few minutes he pulls out a black crayon and writes 'Green?' on the first page of the colouring book. </p>";

                    html += "<p> He turns the book towards you, awaiting your response. </p>";

                    html += "<p> &quot;Elf lost it&quot; you write back.</p>";

                    if (person === "Aliyah" ) {
                        html += "<p> He turns the book towards him. &quot;Oh so you lost it?&quot; The farmer writes. He can barely hold it together at his own joke. </p>";

                        html += "<p> You take the book. &quot;Haha very funny&quot; you write back. </p>";
                    }

                    html += "<p> The farmer chuckles at the thought. </p>";

                    html += "<p> He grabs the box again and takes out blue and yellow. With a blue crayon in his left, and a yellow crayon in his right, he scribbles all over the page in his makeshift green. </p>";

                    html += "<p> &quot;You like green?&quot; you write and turn the book.</p>";

                    html += "<p> &quot;I love it, it reminds me of my father. He was a farmer too.&quot; he wrote.</p>";

                    html += "<p> &quot;Is it cuz green is nature?&quot; </p>";

                    html += "<p> &quot;No it's the colour of the trolls. They grew up with me, they're actually the reason my cows can talk. It's a long story, but I'm not mad at them. They were only trying to make me happy and it was a long time ago, back then there were only 78 of them. &quot;</p>";

                    html += "<p> &quot;78?? Aren't there like 220 now?&quot; you scribble. </p>";

                    html += "<p> &quot;Yes. 228 to be exact. I helped them figure out their reproduction equation. Did you know it's logarithmic?! I've never seen that before. I tend to see how well my animals reproduce and it's usually exponential. &quot; </p>";

                    html += "<p> &quot;Ya, troll told me. So weird&quot; </p>";

                    html += "<p> &quot;Do you wanna know the equation? It is [INSERT EQUATION HERE]. Solve this to find my age :)&quot; he jotted. </p>";

                    html += "<p> &quot;Haha, I'm sure you're no older than 30.&quot;</p>";

                    html += "<p> He looks at you with a deep sadness. He takes the colouring book and flips to a new page. He writes and writes for what feels like ages. Taking breaks in between to fully articulate what he wants to say. After a while he hands you the book, gets up and walks back to his shed, leaving the shovel behind. </p>";

                    html += "<p> &quot;I'm not that young though, I appreciate the flattery but it is very apparent that my life is nearing its end. You have made me reflect though. After decades without any form of connection, you've shown me the value of interaction. Who am I to deprive any living creature of such a gift. I hope all my animals will be able to have an interaction resembling ours. You can go on and talk to them. I wouldn't want anyone else to do the honour. Thank you for coming to see me, it means more than you'll ever know.&quot; </p>";

                } else {
                    html += "<p> Takes out green colour and just wholesome moment idk </p>";
                }
            } else {
                html += "<p> You try to mime colouring. </p>";
            }
        } else if ( action === "Picnic") {
                html += "<p> You lay the picnic mat out and brush the dirt off. You take a seat and gesture him to do the same. </p>";

                html += "<p> His eyes light up and he runs back to his shed. He comes back with a massive tray wrapped in tin foil and places it in the middle of the picnic mat. He carefully peels off the tin foil and both of you get hit with a cloud of smoke. </p>";

                html += "<p> After the smoke clears you notice the farmer prepared himself some " + potato + ". </p>";

                html += "<p> &quot;These are my favorite&quot; he says. &quot;I thought you might like some too!&quot; </p>";

                html += "<p> &quot;Are you kidding me?!&quot; you say. &quot;This is MY WAY to consume a potato!&quot; </p>";

                html += "<p> You sit in silence enjoying the meal. </p>";

                html += "<p> &quot;I don't know why you're here &quot; the farmer starts, &quot;but I don't think I care. I just wanted to say thank you for sharing this meal with me. It's been a while since I've done that with someone. And to think I've been doing this all because of some cows?!&quot; he laughs at the absurdity of his own sentence. "

                html += "<p> &quot;I don't think I want to live like this anymore&quot; he continues. &quot;Thank you for making me realize that. The cows are all yours, ";

                if ( personAdventure.guess === 36 ) {
                    html += "even though there's something not right with them. I dont even think I can milk them anymore. Maybe I'm just hallucinating. You know how old age is.&quot; he gives a weak laugh. </p> <p> But go crazy!&quot; he says. He slowly gets up from the picnic mat, takes his tray and returns to his shed. </p>";
                } else {
                    html += "do whatever you want with them.&quot; he says with a smile. &quot;I'm done&quot; </p>";

                    html += "He picks himself up off the picnic might with great difficulty due to his age. He then picks up his tray and heads back to his shed.";
                }
            // Don't call setNotConvinced here during render
        }

        return html
    }

    function turnThree(personAdventure: PersonAdventure, change: number): string {
        let html = "<p>You're so close. You can tell he just needs one more push. You take a deep breath and prepare for your last attempt...</p>";

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
                html += "<p> You lay the picnic mat out and brush the dirt off. You take a seat and gesture him to do the same. </p>";

                html += "<p> His eyes light up and he runs back to his shed. He comes back with a massive tray wrapped in tin foil and places it in the middle of the picnic mat. He carefully peels off the tin foil and both of you get hit with a cloud of smoke. </p>";

                html += "<p> After the smoke clears you notice the farmer prepared himself some " + potato + ". </p>";

                html += "<p> &quot;These are my favorite&quot; he whispers. &quot;I thought you might like some too!&quot; </p>";

                html += "<p> &quot;Are you kidding me?!&quot; you whisper back. &quot;This is MY WAY to consume a potato!&quot; </p>";

                html += "<p> You sit in silence enjoying the meal. </p>";

                html += "<p> &quot;I don't know why you're here &quot; the farmer starts, &quot;but I don't think I care. I just wanted to say thank you for sharing this meal with me. It's been a while since I've done that with someone. And to think I've been doing this all because of some cows?!&quot; he laughs at the absurdity of his own sentence. "

                html += "<p> &quot;I don't think I want to live like this anymore&quot; he continues. &quot;Thank you for making me realize that. The cows are all yours, ";

                if ( personAdventure.guess === 36 ) {
                    html += "even though there's something not right with them. I dont even think I can milk them anymore. Maybe I'm just hallucinating. You know how old age is.&quot; he gives a weak laugh. </p> <p> But go crazy!&quot; he says. He slowly gets up from the picnic mat, takes his tray and returns to his shed. </p>";
                } else {
                    html += "do whatever you want with them.&quot; he says with a smile. &quot;I'm done&quot; </p>";

                    html += "<p> He picks himself up off the picnic mat with great difficulty due to his age. He then heads off to the shed, too tired to take his tray. You sit for a bit and admire the tray. The surface is oddly reflective, almost like a mirror. &quot;Why would someone need a tray like this?&quot; you wonder. </p>";
                }
        }

        return html
    }

    function slang(personAdventure: PersonAdventure): string {

        let word = personAdventure.slang;

        if (personAdventure.guess === 88 ) {
            word = word.split('').reverse().join('');
        } else if (personAdventure.guess === 45) {
            word = "Rindfleisch essen";
        }

        let html = "<p> Success!!! You manage to convince the old man to let you into the farm. You walk slowly towards the cows, your hands shaking. Now is the moment you've been waiting for. Deliver your final message!</p>";

        html += "<p> &quot;" + word + "!&quot; you shout </p> ";

        if ( personAdventure.guess === 97 ){
            html += "<p> You see one singular cow staring back at you and chewing the grass, unbothered. </p>";

            html += "<p> You've made it too far to care, &quot;You know what, I'll take it&quot; you whisper under your breath.";

            html += "<p> &quot;" + word + "!&quot; you shout even louder. </p>";

            html += "<p> The cow continues to stare at you blankly. You start to feel a bit silly shouting at a single cow. 'Can this cow not speak english?' you think. You walk away defeated. </p>";

            html += "<p>&quot;" + word + "!&quot;</p>";

            html += "<p> You stop in your tracks. A tear rolls down your face. You did it. </p>";

            html += "<p> You finally did it! </p>";

            html += "<p> You feel yourself ready to explode from excitement. You run down the mountain, eager to share the news with the world. </p>";

            return html
        }

        html += "<p> The cows all stop chewing the grass and look up at you blankly. <p>";

        if ( personAdventure.guess === 36 ) {
            html += "<p> Just then you realize the old man was right. Something is definitely wrong with these cows. They look different. Everything about them is too... square. Almost like they came straight out of Minecraft. </p>";

            html += "<p> &quot;No no no no no&quot; you whisper to yourself. &quot;This can't be happening. There's no way these cows are real. They're not even anatomically correct. Look at their legs! They're all the same length! And their heads! What the heck?!' </p>";

            html += "<p> &quot;Minecraft cows&quot; you mutter. &quot;This is some kind of sick joke. The troll must've done this to me. There's no other explanation.&quot; </p>";

            html += "<p> You think about it for longer. &quot;I'm probably going to make history twice today. First english speaking cows and now they're cube shaped. This is insane!&quot; </p>";

            html += "<p> With renewed excitement you shout again. &quot;" + word + "!&quot; </p>";
        }

        if ( personAdventure.guess === 88 ) {

            if (bender === "Waterbender" ) {
                html += "<p> &quot;Wait a minute&quot;, you think. &quot;This isn't right. Why can't I say...&quot; </p>";

                html += "<p> THAT STUPID TROLL </p>";

                html += "<p> The anger begins to consume you. You clench your fists and feel a surge of energy rush through your veins. Before you know it a dozen droplets of water are floating in front of you. Confused, you move your fists upwards and watch as the water follows. </p>";

                html += "<p> You're water bending! </p>";

                html += "<p> You suddenly wave your arms around, carefully orchestrating the position of each water droplet. You're a natural. The water seems to follow you with no resistance. You form a floating wall of water and place it right in front of your mouth. </p>";

                html += "<p> &quot;" + word + "!&quot; you shout again. </p>";

                html += "<p> You watch as the sound hits the water barrier and bounces off, reversing the effects of your mirrored speech. The cows ears perk up. </p>";

                word = word.split('').reverse().join('');

            } else if (personAdventure.actions[2] === "Picnic") {
                html += "<p> &quot;Why are my words coming out backwards?&quot; you think. You start digging through your memory trying to come up with an answer. Did the farmer poison you? Or was it someone else. </p>";

                html += "<p> THE STUPID TROLL! The realization hits you. You must have guessed the number wrong. You rack your brain for a solution, determined to get your message as intended. Then another realization hits you. The farmer left his tray! ";

                html += "<p> You sprint towards your picnic mat and pick up the tray. You wipe the leftovers and speak into it. Just like that the word seems to revert and reach your ears in its original version: " + personAdventure.slang + " </p>";

                word = word.split('').reverse().join('');

            }

        } else if ( personAdventure.guess === 45 ) {
            html += "<p> You stop in your tracks as well. Did I just speak German? you think. 'Why can't i say", personAdventure.slang+  "' </p>";

            html += "<p> You think about it for a bit and then your stomach drops. </p>";

            html += "<p> THE STUPID TROLLLLLL </p>";

            html += "<p> 'If only I bought that German/English dictionary' you think. But as of now you can't do anything but accept this new found reality. The cows are now German. You laugh at this thought and don't let it deter you. </p>";

            html += "<p> " + word + "! you shout even louder. </p>"
        }

        const extra_text = personAdventure.guess === 36 ? "and a bunch of Minecraft cows no less" : "";

        html += "<p> You wait for a response but none comes. You try again. &quot;" + word + "!&quot; you shout louder this time. </p>";

        html += "<p> The cows continue to stare at you blankly. You start to feel a bit silly shouting at a bunch of cows." + extra_text + " &quot;Can these cows not speak english?&quot; you think. You walk away defeated. </p>";

        html += "<p> &quot;" + word + "!&quot;</p>";

        html += "<p> You stop in your tracks. A tear rolls down your face. You did it. </p>";

        html += "<p> You finally did it! </p>";

        if ( personAdventure.guess === 45 ) {
            html += "<p> It might not have been the outcome you wanted but you still accomplished an amazing feat </p>";
        }

        html += "<p> Suddenly a chorus of cows start chanting your slang. This is the happiest day of your life. </p>";

        if (personAdventure.items.includes("Camera")) {
            html += "<p> You take out your camera and record this historic moment. </p>";
        }

        html += "<p> You feel yourself ready to explode from excitement. You run down the mountain, eager to share the news with the world. </p>";

        return html;
    }

    function afterMath(personAdventure: PersonAdventure): string {
        let html = "<p> A few months pass. You bla bla </p>";

        return html;
    }

    // Create journal pages for the story
    const journalPages = [
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
                            Thank you {person}, for shopping with us!<br/>
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
                    <p>You realized the GitHub account is not on your receipt. But why would it be? You&apos;re tech lead! Of course you have a GitHub Account!</p>
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
                        The cabin looks mysterious, the rock climbing wall challenges your adventurous spirit, and the forest whispers secrets of its own. Which path will you choose?
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

        // FARMER INTERACTION - Turn One
        <div key="page11" className={styles.journalPage}>
            <div className={styles.pageContent}>
                {/* <h2 className={styles.chapterTitle}>Chapter 5: The Adventure Unfolds</h2> */}
                <div className={styles.storyText}>
                    <div dangerouslySetInnerHTML={{ __html: slang(personAdventure as PersonAdventure) }} />
                </div>
            </div>
        </div>,

        // Summary
        <div key="page12" className={styles.journalPage}>
            <div className={styles.pageContent}>
                <h2 className={styles.chapterTitle}>Adventure Summary</h2>
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
                        <p className={styles.trollPointsText}>{personAdventure.guess}</p>
                    </div>
                    
                    <div className={styles.summarySection}>
                        <h3>Slang:</h3>
                        <p>&quot;{personAdventure.slang}&quot;</p>
                    </div>
                </div>
            </div>
        </div>
    ];
    
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
