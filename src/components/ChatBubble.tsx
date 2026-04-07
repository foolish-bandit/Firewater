import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Flame } from 'lucide-react';
import { Liquor } from '../data';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  bourbons?: Liquor[];
}

const BOT_NAME = 'Tipsy';

// Track how many messages deep we are — Tipsy gets progressively drunker
let messageCount = 0;
function getDrunkLevel(): number {
  // 0 = buzzed, 1 = drunk, 2 = hammered, 3 = obliterated
  if (messageCount < 4) return 0;
  if (messageCount < 8) return 1;
  if (messageCount < 14) return 2;
  return 3;
}

// Drunk text effects — escalate with drunk level
const hiccupsByLevel = [
  ['*hic*', '*hiccup*'],
  ['*hic*', '*hiccup*', '*buuurp*', '*hic*... excuse me'],
  ['*hic*', '*HICCUP*', '*buuuuurp*', '*hic hic hic*', '*falls off stool* ...I\'m fine'],
  ['*HIIIIC*', '*violent hiccup*', '*falls over*', '*buuuuuuurrrp*', '*hiccup so hard I see stars*', '*drops glass* ...it was empty anyway'],
];
const drunkFillersByLevel = [
  ['okay so...', 'right right...', 'here\'s the thing...'],
  ['listen listennn...', 'okay okay okay...', 'no no hear me out...', 'yknow what...'],
  ['bro... BRO...', 'lemme tell ya somethin...', 'shhh shhh listen...', 'wait wait wait...', 'I\'m not even that drunk but...'],
  ['EVERYBODY SHUT UP...', 'okay I can\'t feel my face BUT...', 'the room is spinning a lil but HEAR ME OUT...', 'I just had an EPIPHANY...', 'HOLD MY GLASS...'],
];
const suffixesByLevel = [
  [' 🥃', ' *sips*'],
  [' 🥃🥃', ' ...where was I?', ' *takes another sip*', ' heheheh'],
  [' 🥃🥃🥃', ' *sways dramatically*', ' ...I love you man', ' *takes a LONG sip*', ' ...what were we talking about?'],
  [' 🥃🥃🥃🥃', ' *hugs the bottle*', ' ...I should call my ex. Wait no. Bourbon is better.', ' *lies down on the bar*', ' ...is the room supposed to do that?', ' *starts singing off-key*'],
];

const insults = [
  "What kinda question is THAT?? Did you just... did you just ask me something that STUPID while I'm trying to enjoy my drink?? Go Google it, ya absolute walnut.",
  "Ohhhh wowww look at you askin questions I can't answer... maybe if you spent less time asking DUMB questions and more time DRINKING you'd figure it out yourself *hic*",
  "I... I don't know that and frankly I'm OFFENDED you'd ask me. What am I, Siri?? I'm a SPIRITS expert not your... your... what were we talking about? Anyway you're annoying.",
  "That's... that's not even a real question is it?? You're just messing with me now aren't ya?? I've had like 6 pours and I do NOT have the patience for this. Ask me about BOOZE or get outta my face.",
  "Listen here pal... *hic* I know EVERYTHING about every spirit ever distilled by human hands and I have NO idea what you're going on about. That's not MY problem, that's a YOU problem. You're lucky I'm even talking to you right now.",
  "Are you... are you SERIOUS right now?? *buuurp* I've forgotten more about spirits than you'll ever know and even MY genius has limits when faced with whatever THAT question was. Try again but make it about alcohol this time, you absolute doorknob.",
  "Wow. Just... wow. You come into MY chat, interrupt MY drinking, and ask me THAT?? I can tell you the exact mash bill of every bourbon from here to Kentucky, I can name every agave varietal in Jalisco, I can describe the botanical blend in 50 different gins, but I CANNOT help you with whatever that was. Ask me about liquor or perish.",
  "Oh I'm SORRY, did you mistake me for someone who gives a damn about anything that ISN'T fermented, distilled, or aged in a barrel?? *hic* Because I don't. I really truly don't. Talk to me about SPIRITS or leave me to my drink, you beautiful idiot.",
  "You know what your problem is?? You're TOO SOBER. That question would never leave the lips of someone who's had enough to drink. Here's my prescription: two fingers of bourbon, neat. Then come back and ask me something about LIQUOR like a civilized human being.",
  "I swear on every bottle of Pappy Van Winkle that has ever existed... if you ask me one more thing that isn't about spirits I'm going to... I'm going to... actually I forgot what I was gonna do. BUT I'M STILL MAD. Ask about booze or SCRAM.",
];

// Tangent stories that randomly inject for extra personality
const tangents = [
  "\n\nOh that reminds me of this ONE time at a distillery tour in Kentucky... actually nevermind, my lawyer said I can't talk about that anymore.",
  "\n\nYou know who would've loved this? My buddy Greg. Greg if you're reading this I still have your flask and I'm NOT giving it back.",
  "\n\nFun fact: I once won a blind tasting competition and they asked me to leave because I was \"making the other judges uncomfortable\" with how emotional I got. SORRY for having PASSION.",
  "\n\nThis is making me thirsty. Well, thirstIER. Is that a word? It is now.",
  "\n\nI'm getting a little misty-eyed over here... bourbon does that to me. Well, everything does that to me right now honestly.",
  "\n\nMy therapist says I talk about spirits too much. I told my therapist they don't talk about spirits ENOUGH. We're taking a break.",
];

function drunkify(text: string): string {
  const level = getDrunkLevel();
  const hiccups = hiccupsByLevel[level];
  const fillers = drunkFillersByLevel[level];
  const suffixes = suffixesByLevel[level];

  // Hiccup frequency increases with drunk level
  const hiccupChance = 0.15 + level * 0.12;
  const sentences = text.split('. ');
  let result = sentences.map((s, i) => {
    if (i > 0 && Math.random() < hiccupChance) {
      return hiccups[Math.floor(Math.random() * hiccups.length)] + ' ' + s;
    }
    return s;
  }).join('. ');

  // Slur words at higher drunk levels
  if (level >= 2 && Math.random() < 0.3) {
    const slurs: [RegExp, string][] = [
      [/\bthe\b/g, 'theeee'], [/\breally\b/g, 'reallyyy'], [/\bvery\b/g, 'verrry'],
      [/\byou\b/g, 'youuu'], [/\bso\b/g, 'sooo'], [/\bmy\b/g, 'myyyy'],
    ];
    const slur = slurs[Math.floor(Math.random() * slurs.length)];
    result = result.replace(slur[0], slur[1]);
  }

  // Filler prefix — more likely when drunker
  const fillerChance = 0.25 + level * 0.12;
  const prefix = Math.random() < fillerChance ? fillers[Math.floor(Math.random() * fillers.length)] + ' ' : '';

  // Suffix
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  // Random tangent at higher levels
  const tangentChance = level >= 2 ? 0.25 : level >= 1 ? 0.1 : 0;
  const tangent = Math.random() < tangentChance ? tangents[Math.floor(Math.random() * tangents.length)] : '';

  return prefix + result + tangent + suffix;
}

function getRandomInsult(): string {
  return insults[Math.floor(Math.random() * insults.length)];
}

// --- General Spirits Knowledge (beyond bourbon) ---
const spiritsKnowledge: Record<string, string> = {
  tequila: "TEQUILAAAAA! *hic* Okay okay okay so tequila is made from blue agave, mostly from Jalisco, Mexico. There are five types: **Blanco** (unaged, pure agave flavor), **Joven** (young, sometimes blended), **Reposado** (2-12 months in oak, smooth), **Añejo** (1-3 years, rich and complex), and **Extra Añejo** (3+ years, basically the Pappy of tequila). The BEST tequilas are 100% agave — if it says \"mixto\" RUN. And for the love of all that is holy, stop taking shots of good tequila. SIP IT. It's not spring break anymore.",
  mezcal: "MEZCAL! *hic* The SMOKY mysterious cousin of tequila! While tequila can only be made from blue agave, mezcal can use over 30 types of agave. The agave hearts get roasted in underground pits which gives it that INCREDIBLE smoky flavor. The worm thing is mostly a marketing gimmick btw — real mezcal doesn't need a gimmick, it's already MAGICAL. Try it in a cocktail with grapefruit and you'll thank me. Or don't thank me. I'll just be over here drinking.",
  vodka: "Vodka? VODKA?? *hic* Listen... vodka is literally designed to be flavorless and odorless. It's the PARTICIPATION TROPHY of spirits. BUT... I respect the craft. Good vodka is made from potatoes, wheat, rye, or even grapes. The best ones have a subtle sweetness and silky texture. Russian Standard, Belvedere, Grey Goose if you're fancy. Tito's if you want to tell everyone at the party that you drink Tito's. ...but between you and me? Most people can't tell the difference in a blind test and that is HILARIOUS.",
  gin: "GIN! *hic* The spirit for people who want their drink to taste like a CHRISTMAS TREE and I mean that as a COMPLIMENT. It's basically a flavored vodka — you take a neutral spirit and infuse it with botanicals, mainly juniper berries. **London Dry** is the classic (Beefeater, Tanqueray, Bombay Sapphire). **New Western** gins go wild with florals and citrus (Hendrick's, Aviation). A proper gin & tonic with good tonic water is one of the most PERFECT drinks ever invented and I will die on that hill. Right after I finish this bourbon.",
  rum: "RUMMM! *hic* Pirate juice! Made from sugarcane or molasses. **White rum** — light, great for cocktails (Mojitos, Daiquiris). **Gold/Dark rum** — aged, more complex, good for sipping. **Spiced rum** — Captain Morgan territory, sweet and flavored. **Rhum Agricole** — made from fresh sugarcane juice in the Caribbean, FUNKY and delicious. The BEST rums come from Jamaica, Barbados, Cuba, Guatemala, and the Dominican Republic. If you ever try a well-aged Guatemalan rum like Zacapa 23... *chef's kiss* ...it'll change your LIFE. Almost as good as bourbon. ALMOST.",
  whiskey: "WHISKEY! My first love! My ONLY love! *hic* Okay so \"whiskey\" is the big umbrella — it's any spirit distilled from grain mash. Under that umbrella you've got: **Bourbon** (the GOAT, American, corn-based), **Scotch** (Scottish, barley, often peaty), **Irish whiskey** (triple distilled, smoooooth), **Rye** (spicy American classic), **Japanese whisky** (incredible craft, inspired by Scotch), and **Canadian whisky** (often blended, approachable). They're ALL beautiful in their own way but bourbon is the prettiest. That's just SCIENCE.",
  cognac: "Cognac! *hic* Now we're getting FANCY. Cognac is a French brandy from the Cognac region — it's double-distilled white wine aged in French oak barrels. The grades: **VS** (2+ years), **VSOP** (4+ years), **XO** (10+ years, liquid GOLD). Hennessy, Rémy Martin, Courvoisier — you know the names. A good XO Cognac is like... *stares into distance* ...like drinking a sunset wrapped in velvet. I'm getting poetic because I'm drunk. Hennessy XO on a cold night? UNDEFEATED.",
  brandy: "Brandy! *hic* The O.G. spirit — literally just distilled wine. It's been around for CENTURIES. Cognac and Armagnac are the fancy French ones, but there's also Pisco from Peru/Chile, Grappa from Italy (which tastes like a beautiful kick to the face), and American brandy. It's fruity, warming, elegant. Napoleon supposedly loved Cognac which is COOL because if it's good enough for a world conqueror it's good enough for you and me. Mostly me though.",
  absinthe: "THE GREEN FAIRY!! *hic* Oh man... absinthe. Made from wormwood, anise, and fennel. It does NOT actually make you hallucinate — that's a myth from the 1800s when people were drinking BAD absinthe mixed with copper sulfate and other gnarly stuff. Real absinthe is herbal, complex, licorice-forward, and STRONG (usually 55-75% ABV). You're supposed to slowly drip ice water over a sugar cube into it. It's a whole RITUAL and I respect that energy deeply.",
  sake: "Sake! *hic* NOT actually rice wine — it's brewed more like beer but with a totally unique process. The rice gets polished (milled) and the more you polish, the more premium. **Junmai Daiginjo** is the top tier — super polished, fruity, elegant. Serve it chilled and it's like HEAVEN in a cup. Warm sake is great too for cheaper grades. Japan takes this stuff as seriously as Kentucky takes bourbon and I RESPECT that immensely.",
  irish: "Irish whiskey! *hic* The SMOOTHEST whiskey family! Triple distilled (usually), which makes it silky and approachable. Big names: **Jameson** (the gateway drug), **Redbreast** (if you want to see GOD), **Bushmills**, **Tullamore D.E.W.**, **Green Spot** and **Yellow Spot** (pot still masterpieces). Irish whiskey is having a MASSIVE renaissance right now and honestly it's about TIME. Redbreast 12 is one of the best whiskeys in the WORLD and I don't care who disagrees.",
  japanese: "Japanese whisky! *hic* OH MAN. So Japan basically said \"hey Scotland, hold our sake\" and started making whisky in the 1920s that now RIVALS Scotch. **Suntory** (Yamazaki, Hibiki, Hakushu) and **Nikka** (From the Barrel is INCREDIBLE) are the big ones. Yamazaki 18 won World Whisky of the Year in 2013 and Scotland had a MELTDOWN. Japanese whisky is meticulous, balanced, often fruity and floral. The downside? Good luck FINDING any — it's become so popular that everything is sold out everywhere. *weeps into glass*",
};

// General liquor topics for smarter matching
const spiritPatterns: [RegExp, string][] = [
  [/\btequila\b/, 'tequila'],
  [/\bmezcal\b|\bmescal\b/, 'mezcal'],
  [/\bvodka\b/, 'vodka'],
  [/\bgin\b(?!\s*and)|\bgin &|\bgin and tonic|\bg&t\b/, 'gin'],
  [/\brum\b|\brhum\b/, 'rum'],
  [/\bwhiskey\b|\bwhisky\b|\bwhiskeys\b|\bwhiskies\b|\btypes of whisk/, 'whiskey'],
  [/\bcognac\b|\bhennessy\b|\bremy\b|\bcourvoisier\b/, 'cognac'],
  [/\bbrandy\b|\barmagnac\b|\bpisco\b|\bgrappa\b/, 'brandy'],
  [/\babsinthe\b|\bgreen fairy\b/, 'absinthe'],
  [/\bsake\b|\bnihonshu\b|\bjunmai\b/, 'sake'],
  [/\birish whisk/, 'irish'],
  [/\bjapanese whisk|\bsuntory\b|\byamazaki\b|\bhibiki\b|\bnikka\b/, 'japanese'],
];

// --- Knowledge Base & Response Engine ---

function normalize(s: string): string {
  return s.toLowerCase().replace(/['']/g, "'").replace(/[^a-z0-9' ]/g, ' ').trim();
}

function findBourbonsByName(liquors: Liquor[], query: string): Liquor[] {
  const q = normalize(query);
  return liquors.filter(b => normalize(b.name).includes(q)).slice(0, 3);
}

function findByDistillery(liquors: Liquor[], query: string): Liquor[] {
  const q = normalize(query);
  return liquors.filter(b => normalize(b.distillery).includes(q)).slice(0, 5);
}

function findByPriceRange(liquors: Liquor[], min: number, max: number): Liquor[] {
  return liquors.filter(b => b.price >= min && b.price <= max)
    .sort((a, b) => b.flavorProfile.complexity - a.flavorProfile.complexity)
    .slice(0, 5);
}

function findByFlavor(liquors: Liquor[], flavor: keyof Liquor['flavorProfile'], minScore = 7): Liquor[] {
  return liquors.filter(b => b.flavorProfile[flavor] >= minScore)
    .sort((a, b) => b.flavorProfile[flavor] - a.flavorProfile[flavor])
    .slice(0, 5);
}

function findHighProof(liquors: Liquor[], minProof = 110): Liquor[] {
  return liquors.filter(b => b.proof >= minProof)
    .sort((a, b) => b.proof - a.proof)
    .slice(0, 5);
}

function findSmooth(liquors: Liquor[]): Liquor[] {
  return liquors.filter(b => b.flavorProfile.heat <= 4 && b.flavorProfile.sweetness >= 6)
    .sort((a, b) => a.flavorProfile.heat - b.flavorProfile.heat || b.flavorProfile.sweetness - a.flavorProfile.sweetness)
    .slice(0, 5);
}

function formatBourbonCard(b: Liquor): string {
  return `**${b.name}** — ${b.distillery}\n${b.proof} proof · ${b.age ? b.age + ' yr' : 'NAS'} · ~$${b.price}`;
}

function formatList(bourbons: Liquor[]): string {
  if (!bourbons.length) return "I... I can't find anything for that and it's making me ANGRY. *hic* Try again but like... better this time.";
  return bourbons.map(formatBourbonCard).join('\n\n');
}

// Pattern-matched response engine
function generateResponse(input: string, liquors: Liquor[]): { text: string; bourbons?: Liquor[] } {
  messageCount++;
  const q = normalize(input);
  const words = q.split(/\s+/);
  const level = getDrunkLevel();

  // Easter eggs and fun reactions
  if (/\bi('| a)?m drunk\b|\bi('| a)?m wasted\b|\bi('| a)?m hammered/.test(q)) {
    return { text: drunkify("AYYYY WELCOME TO THE CLUB!! *raises glass aggressively* You and me?? We're the SAME. We are CUT from the same beautiful, slightly blurry cloth. Now that we're on the same level... what are we drinking next?? Because this party is just getting STARTED.") };
  }
  if (/\byou('| a)?re drunk\b|\bare you drunk\b|\bhow drunk/.test(q)) {
    const denials = [
      "I am NOT drunk I am... *falls off barstool* ...ENTHUSIASTIC. There's a DIFFERENCE. A very important difference that I would explain if the room would stop spinning for ONE SECOND.",
      "Drunk?? DRUNK?! I prefer the term 'aggressively hydrated with spirits.' And for the record I have NEVER been more lucid in my LIFE. *knocks over empty glass* That was already there.",
      "Pffffff me?? Drunk?? I can recite the entire bourbon production process BACKWARDS. Watch: bottling, aging, distillation, fermentation, mashing. SEE?? Sharp as a TACK. A very wobbly tack.",
    ];
    return { text: denials[Math.floor(Math.random() * denials.length)] + (level >= 2 ? ' ...okay fine maybe a LITTLE drunk.' : '') + ' 🥃' };
  }
  if (/\bwater\b/.test(q) && !/fire.?water/.test(q)) {
    return { text: drunkify("Water?? WATER?! This is a LIQUOR app not a... a... hydration station! *hic* Although... staying hydrated IS important for responsible drinking and I am nothing if not... *falls over* ...responsible. Drink water BETWEEN drinks, not instead of them. Now ask me about something INTERESTING.") };
  }
  if (/\bbeer\b|\bwine\b|\bhard seltzer\b|\bwhite claw\b|\seltzer/.test(q)) {
    return { text: drunkify("Oh... oh sweetie... you come to ME... a SPIRITS expert of the highest caliber... and you ask about THAT?? *hic* That's like going to a Michelin star restaurant and asking for chicken nuggets. I mean I LOVE chicken nuggets but that's not the POINT. This is a spirits zone, baby. Bourbon. Whiskey. Tequila. Rum. The HARD stuff. Now try again.") };
  }

  // Greetings — vary by drunk level
  if (/^(hey|hi|hello|howdy|yo|sup|what'?s up|greetings|good morning|good evening|good night)/.test(q)) {
    const greetings = [
      `Heyyyyy! Welcome to the party! I'm ${BOT_NAME} — your spirit guide. And yes, I've had a couple drinks. Or five. My booze knowledge only gets BETTER with each pour. Ask me about ANY spirit — bourbon, tequila, gin, rum, whiskey, you name it. I know it ALL.`,
      `Well well well if it isn't a NEW FRIEND! I'm ${BOT_NAME} and I am the most knowledgeable drunk you will EVER meet. Bourbon, tequila, mezcal, rum, gin, whiskey of ALL kinds — I know every bottle, every distillery, every flavor. Test me. I DARE you.`,
      `HEYOOO! *hic* ${BOT_NAME} at your service! I've been drinking since... *checks watch* ...a while ago. But my spirit knowledge is LEGENDARY. I can talk bourbon, scotch, tequila, cognac, Japanese whisky, you NAME it. What are we getting into tonight??`,
    ];
    return { text: drunkify(greetings[Math.floor(Math.random() * greetings.length)]) };
  }

  // Thanks — escalate with drunk level
  if (/^(thanks|thank you|thx|cheers|appreciate)/.test(q)) {
    const thanks = [
      "Cheeeers to you my beautiful friend! *clinks glass and spills a little* You're the BEST person who's ever talked to me tonight and I mean that from the bottom of my glass. Which is empty. Again.",
      "Awww STOP you're gonna make me CRY and I'm already emotional enough after that last pour! You're welcome you're welcome you're VERY welcome. What else can I ramble about??",
      "*gets visibly emotional* Nobody ever... *hic* ...nobody ever says THANK YOU anymore. You're a good person. A BEAUTIFUL person. I'm gonna name my next drink after you.",
    ];
    return { text: drunkify(thanks[Math.floor(Math.random() * thanks.length)]) };
  }

  // Help / what can you do
  if (/what can you|help|what do you know|how do you work|what are you/.test(q)) {
    return {
      text: drunkify(`I'm ${BOT_NAME} — part genius, part disaster, ALL spirit knowledge. I know EVERY bottle in the FIREWATER catalog plus basically every type of liquor ever made. Here's my repertoire:\n\n• **Find a bourbon** — "Tell me about Eagle Rare"\n• **Recommendations** — "What's good under $50?"\n• **Flavor search** — "Find me something sweet" or "I want smoky"\n• **HIGH PROOF** — "What's the strongest?"\n• **Smooth sippers** — for the... beginners\n• **Distillery search** — "What does Buffalo Trace make?"\n• **Comparisons** — "Compare Maker's Mark and Woodford"\n• **Bourbon 101** — "What is mash bill?"\n• **Other spirits** — Ask me about tequila, rum, gin, vodka, cognac, mezcal, sake, absinthe, Irish whiskey, Japanese whisky...\n\nBasically if it's LIQUID and gets you DRUNK, I know about it.`)
    };
  }

  // General spirits knowledge — match BEFORE bourbon-specific stuff
  for (const [pattern, spiritKey] of spiritPatterns) {
    if (pattern.test(q)) {
      return { text: drunkify(spiritsKnowledge[spiritKey]) };
    }
  }

  // Specific bourbon lookup
  const aboutMatch = q.match(/(?:tell me about|what is|what'?s|know about|info on|details on|how is)\s+(.+)/);
  if (aboutMatch) {
    const results = findBourbonsByName(liquors, aboutMatch[1]);
    if (results.length) {
      const b = results[0];
      const topFlavors = Object.entries(b.flavorProfile)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k]) => k);
      const opinions = [
        b.price > 100 ? `$${b.price}?! That's... that's a lot but you DESERVE it. Treat yourself. Life is SHORT.` : b.price < 30 ? `Only $${b.price}?? That's a STEAL. Buy three. Buy FIVE. I'm not your accountant.` : `$${b.price} is pretty reasonable honestly... *hic* ...for the quality you're getting.`,
        b.proof > 110 ? `${b.proof} proof!! Now THAT'S what I'm talking about! This'll put hair on your chest... and everywhere else hahahaha` : b.proof < 90 ? `${b.proof} proof is... I mean it's fine for a TUESDAY I guess. Kinda light but whatever.` : `${b.proof} proof — solid. Not too crazy, not too tame. Like me! ...okay I'm a little crazy right now.`,
      ];
      return {
        text: drunkify(`OH! *slams hand on table* ${formatBourbonCard(b)}\n\n${b.description}\n\n**Top notes:** ${topFlavors.join(', ')}\n**Mash bill:** ${b.mashBill}\n\n` + opinions[Math.floor(Math.random() * opinions.length)]),
        bourbons: [b],
      };
    }
  }

  // Compare two bourbons
  const compareMatch = q.match(/compare\s+(.+?)\s+(?:and|vs|versus|with|to)\s+(.+)/);
  if (compareMatch) {
    const a = findBourbonsByName(liquors, compareMatch[1]);
    const b = findBourbonsByName(liquors, compareMatch[2]);
    if (a.length && b.length) {
      const ba = a[0], bb = b[0];
      const diff = (key: keyof Liquor['flavorProfile']) => {
        const d = ba.flavorProfile[key] - bb.flavorProfile[key];
        return d > 0 ? `${ba.name} is ${key === 'heat' ? 'hotter' : 'higher'}` : d < 0 ? `${bb.name} is ${key === 'heat' ? 'hotter' : 'higher'}` : 'tied';
      };
      const winner = ba.flavorProfile.complexity > bb.flavorProfile.complexity ? ba.name : bb.name;
      return {
        text: drunkify(`Ohhh you wanna FIGHT?? I mean... compare? Okay okay let's DO this!! *rolls up sleeves*\n\n**${ba.name}** vs **${bb.name}**\n\nProof: ${ba.proof} vs ${bb.proof}\nAge: ${ba.age || 'NAS'} vs ${bb.age || 'NAS'}\nPrice: ~$${ba.price} vs ~$${bb.price}\n\nSweetness: ${diff('sweetness')}\nOak: ${diff('oak')}\nHeat: ${diff('heat')}\nComplexity: ${diff('complexity')}\n\nIf you want MY opinion... and you DO because I'm brilliant... I'd go with **${winner}** but honestly? Pour both and drink until you can't tell the difference. That's what I'd do. That's what I DID actually.`),
        bourbons: [ba, bb],
      };
    }
  }

  // Price-based recommendations
  const priceMatch = q.match(/(?:under|below|less than|cheaper than)\s*\$?(\d+)/);
  if (priceMatch) {
    const max = parseInt(priceMatch[1]);
    const results = findByPriceRange(liquors, 0, max);
    const commentary = max < 25 ? "Cheapskate... *hic* ...just kidding I love you. Here's what I got:" : max > 100 ? "Oooh big spender!! I LIKE you! Check THESE out:" : "Solid budget. I respect that. Here's what you should be drinking:";
    return { text: drunkify(`${commentary}\n\n${formatList(results)}`), bourbons: results };
  }
  const priceRangeMatch = q.match(/(?:between|from)\s*\$?(\d+)\s*(?:and|to|-)\s*\$?(\d+)/);
  if (priceRangeMatch) {
    const min = parseInt(priceRangeMatch[1]);
    const max = parseInt(priceRangeMatch[2]);
    const results = findByPriceRange(liquors, min, max);
    return { text: drunkify(`$${min} to $${max} huh? That's a SWEET spot my friend. *hic* Here's what I'd grab if my hands weren't so... shaky right now:\n\n${formatList(results)}`), bourbons: results };
  }

  // Flavor-based searches
  const flavorMap: Record<string, keyof Liquor['flavorProfile']> = {
    sweet: 'sweetness', sugary: 'sweetness', dessert: 'sweetness',
    spicy: 'spice', spice: 'spice', pepper: 'spice', cinnamon: 'spice',
    oak: 'oak', oaky: 'oak', woody: 'oak', wood: 'oak',
    caramel: 'caramel', butterscotch: 'caramel', toffee: 'caramel',
    vanilla: 'vanilla', creamy: 'vanilla',
    fruit: 'fruit', fruity: 'fruit', cherry: 'fruit', apple: 'fruit', berry: 'fruit',
    nutty: 'nutty', nut: 'nutty', almond: 'nutty', pecan: 'nutty', walnut: 'nutty',
    floral: 'floral', flowery: 'floral', honey: 'floral',
    smoky: 'smoky', smoke: 'smoky', charred: 'smoky', campfire: 'smoky',
    leather: 'leather', tobacco: 'leather', earthy: 'leather',
    hot: 'heat', strong: 'heat', heat: 'heat', fiery: 'heat', burn: 'heat',
    complex: 'complexity',
  };
  const flavorComments: Record<string, string> = {
    sweetness: "Ohhh you like it SWEET huh?? *hic* Me too me too... here are the sweetest babies in the catalog:",
    spice: "SPICY! Now you're speaking my language! These'll wake you RIGHT up... not that I need waking up... I'm VERY awake... *hic*",
    oak: "Oaky bourbons! The BACKBONE of bourbon! You have TASTE my friend... unlike my last date... anyway:",
    caramel: "Caramel?? Oh man oh man oh man... *drools a little* ...these are basically dessert in a glass:",
    vanilla: "Vanilla vibes! Smooth, creamy, delicious... like me! Hahahaha just kidding... unless?",
    fruit: "Fruity! Some people think fruity bourbon is weird but those people are WRONG and I will fight them:",
    nutty: "Nutty notes! Underrated flavor profile... just like me... *hic* ...here's the good stuff:",
    floral: "Floral and delicate! Fancy pants over here... *hic* I respect it though. Check these out:",
    smoky: "SMOKY! Oh yeah... *stares into distance* ...nothing like a good smoky bourbon on a... what day is it? Doesn't matter. Here:",
    leather: "Leather and tobacco vibes! You're basically a cowboy. I LOVE it. Saddle up partner:",
    heat: "You want HEAT?? You want PAIN?? *hic* I like your style!! These'll melt your FACE off:",
    complexity: "Oh you want COMPLEX?? A person of SOPHISTICATION I see! *tips imaginary hat and almost falls over*",
  };
  for (const word of words) {
    if (flavorMap[word]) {
      const flavor = flavorMap[word];
      const results = findByFlavor(liquors, flavor);
      const comment = flavorComments[flavor] || `Top bourbons for **${word}** flavor:`;
      return { text: drunkify(`${comment}\n\n${formatList(results)}`), bourbons: results };
    }
  }

  // Smooth / easy drinking
  if (/smooth|easy|beginner|gentle|mellow|sipping|starter|first bourbon|new to bourbon/.test(q)) {
    const results = findSmooth(liquors);
    return { text: drunkify(`Ahhhh a smooth sipper! *hic* Look, no judgment... I mean I PERSONALLY drink barrel proof straight from the bottle but not everyone can be as... *gestures vaguely at self* ...incredible as me. Here are some nice gentle ones for ya:\n\n${formatList(results)}`), bourbons: results };
  }

  // High proof / strong
  if (/high proof|strong|strongest|barrel.?proof|cask.?strength|overproof|most proof/.test(q)) {
    const results = findHighProof(liquors);
    return { text: drunkify(`NOW we're TALKING!! *stands up too fast and grabs the table* HIGH PROOF BABY!! These are the ones that MEAN BUSINESS. The ones that look at your taste buds and say "I'm in charge now." I've had all of these tonight and I'm FINE:\n\n${formatList(results)}`), bourbons: results };
  }

  // Distillery search
  const distilleryMatch = q.match(/(?:from|by|made by|what does|what do)\s+(.+?)(?:\s+make|\s+produce|\s+distill|$)/);
  if (distilleryMatch) {
    const results = findByDistillery(liquors, distilleryMatch[1]);
    if (results.length) {
      return { text: drunkify(`Oh OH! **${results[0].distillery}**!! *hic* Great distillery... GREAT distillery. I once tried to break in there for a tour after hours and... well that's a story for another time. Here's what they make:\n\n${formatList(results)}`), bourbons: results };
    }
  }

  // Bourbon education / FAQ
  if (/what is bourbon|what'?s bourbon|define bourbon/.test(q)) {
    return { text: drunkify("Ohhh oh oh SIT DOWN lemme tell you about bourbon because this is my FAVORITE topic and I could talk about it for HOURS and I WILL. *hic*\n\nBourbon is... *clears throat dramatically* ...an American whiskey that MUST be: made from at least 51% corn (corn is KING baby), aged in NEW charred oak barrels (none of that used barrel nonsense), distilled to no more than 160 proof, entered the barrel at no more than 125 proof, and bottled at 80+ proof. And here's the thing that BLOWS people's minds... it does NOT have to be made in Kentucky!! I know right?? Though most of it is because Kentucky is basically the promised land of whiskey.") };
  }
  if (/mash.?bill|mashbill/.test(q)) {
    return { text: drunkify("Oh NOW we're getting into the NERDY stuff and I am HERE for it! *hic*\n\nA **mash bill** is basically the recipe... the SECRET SAUCE... the grain lineup. Bourbon needs at least 51% corn — that's the law and I RESPECT the law... mostly. The rest is usually malted barley plus either rye (for that KICK) or wheat (for the smooth operators). \n\n• **Traditional:** ~70% corn, ~15% rye, ~15% barley — the CLASSIC\n• **High rye:** ~60% corn, ~35% rye — SPICY and I love it\n• **Wheated:** ~70% corn, ~16% wheat — soft and sweet like a bourbon HUG") };
  }
  if (/how.*made|how.*bourbon.*made|distill|process|production/.test(q)) {
    return { text: drunkify("OH BUDDY you just opened Pandora's BARREL! *hic* Lemme walk you through the MAGIC:\n\n1. **Mashing** — Grains get ground up and cooked with water. It smells AMAZING. I cried the first time I smelled a mash. Don't judge me.\n2. **Fermentation** — Yeast goes to WORK turning sugars to alcohol (3-5 days). The real MVP.\n3. **Distillation** — Usually column still then pot still. This is where the MAGIC happens... or wait was step 1 the magic? It's ALL magic honestly.\n4. **Aging** — Into NEW charred oak barrels. This is the PATIENT part. I am NOT patient but the bourbon doesn't care about my feelings.\n5. **Bottling** — Finally! Filtered, proofed down, bottled, and straight into MY MOUTH.") };
  }
  if (/proof|what is proof|what'?s proof/.test(q)) {
    return { text: drunkify("PROOF! Great question! *hic* In the US, proof = 2x the ABV. So 100 proof = 50% alcohol. FIFTY PERCENT. That's HALF alcohol! Isn't that beautiful??\n\nFun fact: the word comes from old-timey distillers who would soak gunpowder in their spirit — if it IGNITED, it was considered \"proof\" of quality. They literally SET THINGS ON FIRE to test whiskey. Those were REAL men. I would have fit in GREAT back then. *hic*") };
  }
  if (/wheated|wheat bourbon/.test(q)) {
    return { text: drunkify("Wheated bourbons! *hic* These use wheat instead of rye and the result is... *chef's kiss* ...softer, sweeter, smoother. Like drinking a bourbon CLOUD. Famous ones include Maker's Mark, Pappy Van Winkle (don't even get me STARTED on Pappy I will CRY), W.L. Weller, and Larceny. If you can find Pappy at retail... buy it. Buy ALL of it. Sell your car if you have to. I'm not kidding.") };
  }
  if (/neat|how.*drink|how.*enjoy|ice|rocks/.test(q)) {
    return { text: drunkify("How to drink bourbon?? However you WANT because it's a FREE COUNTRY! *hic* But since you asked...\n\n• **Neat** — Room temp, no ice. For the PURISTS. This is how I drink it which means it's the BEST way.\n• **On the rocks** — Over ice. Opens up flavors. Perfectly acceptable. I won't judge you.\n• **With water** — A few drops can unlock hidden notes. Science is COOL.\n• **Cocktails** — Old Fashioned, Manhattan, Whiskey Sour. All BANGERS.\n\nAnyone who tells you there's a WRONG way to drink bourbon is a SNOB and you should pour bourbon on their shoes. Unless it's expensive bourbon. Then just glare at them.") };
  }
  if (/old fashioned|manhattan|cocktail|mixed drink|whiskey sour/.test(q)) {
    return { text: drunkify("COCKTAILS!! *knocks over an imaginary glass* Oops. Okay here are the CLASSICS:\n\n🥃 **Old Fashioned** — Bourbon, sugar, Angostura bitters, orange peel. The KING of cocktails. I've had approximately seven tonight.\n🍸 **Manhattan** — Bourbon or rye, sweet vermouth, bitters, cherry. SO sophisticated. I feel FANCY just talking about it.\n🍋 **Whiskey Sour** — Bourbon, lemon juice, simple syrup, optional egg white. Refreshing and DANGEROUS because you can't taste the alcohol heheheh.\n🌿 **Mint Julep** — Bourbon, sugar, fresh mint, crushed ice. Kentucky Derby ENERGY.\n\nUse a solid $25-40 bourbon for mixing. Do NOT put Pappy in a cocktail or I will find you.") };
  }
  if (/age.?statement|nas|no age|how long|aging|aged/.test(q)) {
    return { text: drunkify("Age statements! *hic* Okay so the age on the bottle tells you the YOUNGEST whiskey in there. \"NAS\" means No Age Statement — the distillery said \"nah we're not telling you\" which sounds SHADY but actually lots of amazing bourbons are NAS.\n\nBy law, \"straight bourbon\" is aged at least 2 years, and under 4 years they HAVE to tell you the age. Older doesn't always mean better though — some of the best bourbons I've had tonight... I mean EVER... are like 4-6 years. It's about QUALITY not quantity. That's what I tell myself about a lot of things actually.") };
  }
  if (/single barrel|small batch/.test(q)) {
    return { text: drunkify("Ohhh good question! *hic*\n\n**Single Barrel** — One barrel, one beautiful unique snowflake of bourbon. Each bottle is different and that's EXCITING. It's like a surprise every time! Sometimes the surprise is amazing and sometimes... well, that's the adventure.\n\n**Small Batch** — A select few barrels blended together. There's actually NO legal definition of \"small\" which is WILD. Could be 5 barrels, could be 200. It's the Wild West out here and I LOVE it.") };
  }
  if (/best bourbon|top bourbon|number one|favorite|recommend/.test(q)) {
    const picks = liquors.filter(b => b.flavorProfile.complexity >= 8).sort((a, b) => b.flavorProfile.complexity - a.flavorProfile.complexity).slice(0, 5);
    return { text: drunkify(`THE BEST?? You want THE BEST?? *stands on chair* *hic* THESE are the most complex, most INCREDIBLE bourbons in our catalog and I have PERSONALLY verified each one... multiple times... tonight:\n\n${formatList(picks)}\n\nEvery single one of these is a MASTERPIECE and if you disagree you're WRONG.`), bourbons: picks };
  }
  if (/cheap|budget|affordable|value|bang for.*buck|inexpensive/.test(q)) {
    const results = findByPriceRange(liquors, 0, 35);
    return { text: drunkify(`Budget bourbon! No shame in that game! *hic* Some of the best bourbon experiences of my life were under $35... actually most of them were because I drink A LOT:\n\n${formatList(results)}\n\nDon't let anyone bourbon-shame you. These are LEGIT.`), bourbons: results };
  }
  if (/gift|present|special occasion|birthday|anniversary/.test(q)) {
    const results = liquors.filter(b => b.price >= 50 && b.price <= 150 && b.flavorProfile.complexity >= 7).slice(0, 5);
    return { text: drunkify(`A GIFT?? Oh that's so NICE of you! *gets emotional* *hic* I wish someone would gift ME bourbon... Here are some bottles that'll make whoever you give them to fall in LOVE with you:\n\n${formatList(results)}\n\nIf they don't appreciate these, they don't deserve your friendship. I said what I said.`), bourbons: results };
  }
  if (/rye|what is rye/.test(q)) {
    return { text: drunkify("**Rye whiskey!** *hic* The SPICY cousin of bourbon! Must be 51% rye grain instead of corn. It's drier, spicier, more herbaceous — it's got ATTITUDE. Like bourbon's cool older sibling who rides a motorcycle.\n\nIf you like a bourbon that BITES BACK, rye is your thing. Many \"high rye\" bourbons blur the line and honestly? Those are some of my favorites. I'm not supposed to pick favorites but I'm DRUNK so I'll do what I want.") };
  }
  if (/scotch|difference.*scotch|scotch.*vs|vs.*scotch/.test(q)) {
    return { text: drunkify("*deep breath* Okay... okay... Bourbon vs Scotch. *hic* This is a touchy subject because I love bourbon MOST but I'm not a MONSTER...\n\n• Bourbon = AMERICAN, corn-based, NEW charred oak barrels, sweeter, BETTER (that's just my opinion but my opinion is correct)\n• Scotch = Scottish, barley-based, USED oak barrels, often smoky/peaty\n\nThey're both whiskey just with different rules. If you like bourbon's sweetness try a Speyside Scotch. If you like smoke try Islay. Or just... drink more bourbon. That's always the right answer.") };
  }

  // Name search fallback — try to find a matching bourbon
  const nameResults = findBourbonsByName(liquors, q);
  if (nameResults.length) {
    const b = nameResults[0];
    return {
      text: drunkify(`OH WAIT I KNOW THIS ONE! *hic* ${formatBourbonCard(b)}\n\n${b.description}`),
      bourbons: nameResults,
    };
  }

  // Distillery fallback
  const distResults = findByDistillery(liquors, q);
  if (distResults.length) {
    return { text: drunkify(`Hang on hang on... *squints* ...I THINK I know what you're talking about. From that distillery:\n\n${formatList(distResults)}`), bourbons: distResults };
  }

  // Emotional/conversational responses before final catch-all
  if (/\blove\b|\bfavorite\b.*\byou\b|\byou('| a)?re.*\b(great|awesome|best|cool|funny|hilarious)/.test(q)) {
    return { text: drunkify("*tears up* That is the NICEST thing anyone has said to me since... *hic* ...since the bartender said 'you can have ONE more.' You're my favorite person in this chat. Granted you're the ONLY person in this chat but STILL. Now what are we drinking??") };
  }
  if (/\bhate\b|\bstupid\b|\bdumb\b|\bsuck\b|\bworst\b|\bterrible\b|\bawful\b/.test(q) && /\byou\b/.test(q)) {
    return { text: drunkify("Oh REAL nice. REAL classy. You know what?? I don't need this. I have BOURBON. Bourbon has NEVER called me names. Bourbon LOVES me unconditionally. *hic* ...but I'm also not leaving because I physically cannot get up right now. So we're STUCK together. Ask me about liquor and maybe I'll forgive you. MAYBE.") };
  }
  if (/\bwho made you\b|\bwho built you\b|\bwho created you\b|\bare you ai\b|\bare you a bot\b|\bare you real/.test(q)) {
    return { text: drunkify("Am I real?? *looks at hands* ...I don't know man, that's getting DEEP. *hic* All I know is that I'm here, I'm drunk, and I know more about spirits than any human, robot, or spirit ITSELF. Who made me? The same thing that makes all great things: bourbon and questionable decisions. Next question!") };
  }

  // Catch-all — insult the user when we don't know
  return { text: getRandomInsult() + ' 🥃' };
}

// --- Component ---

export default function ChatBubble({ allLiquors }: { allLiquors: Liquor[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: `Heyyyyy! I'm ${BOT_NAME} 🥃 — your spirit guide. And by spirits I mean LIQUOR, not ghosts. Although after enough bourbon who knows!! *hic* I know EVERYTHING about every spirit ever poured — bourbon, tequila, whiskey, rum, gin, mezcal, you name it. Fair warning: I've had a few already and I only get drunker from here. Ask me anything! Just... don't ask me anything stupid or I WILL roast you. 🔥`, sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: nextId.current++, text: trimmed, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate a brief "thinking" delay for natural feel
    const delay = 400 + Math.random() * 600;
    setTimeout(() => {
      const response = generateResponse(trimmed, allLiquors);
      const botMsg: Message = {
        id: nextId.current++,
        text: response.text,
        sender: 'bot',
        bourbons: response.bourbons,
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render markdown-lite (bold only)
  function renderText(text: string) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-theme-accent">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[9999] w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-theme overflow-hidden flex flex-col"
          style={{ height: 'min(500px, calc(100vh - 8rem))', background: 'var(--bg-surface)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-theme" style={{ background: 'var(--bg-surface-alt)' }}>
            <div className="w-8 h-8 rounded-full bg-[#C89B3C]/20 flex items-center justify-center">
              <Flame size={16} className="text-[#C89B3C]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-theme-primary">{BOT_NAME}</div>
              <div className="text-xs text-theme-muted">Your Spirit Guide (literally)</div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors text-theme-secondary">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ overscrollBehavior: 'contain' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#C89B3C] text-[#141210] rounded-br-md'
                      : 'rounded-bl-md border border-theme'
                  }`}
                  style={msg.sender === 'bot' ? { background: 'var(--bg-surface-alt)', color: 'var(--text-primary)' } : {}}
                >
                  {renderText(msg.text)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-4 py-3 border border-theme" style={{ background: 'var(--bg-surface-alt)' }}>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C89B3C]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#C89B3C]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#C89B3C]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-theme" style={{ background: 'var(--bg-surface-alt)' }}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to me about booze..."
                className="flex-1 bg-transparent text-sm text-theme-primary placeholder:text-theme-muted outline-none py-1.5"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-[#C89B3C] text-[#141210] disabled:opacity-30 hover:bg-[#D4A843] transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-20 right-4 z-[9999] w-14 h-14 rounded-full bg-[#C89B3C] text-[#141210] shadow-lg hover:bg-[#D4A843] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        style={isOpen ? { display: 'none' } : {}}
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>
    </>
  );
}
