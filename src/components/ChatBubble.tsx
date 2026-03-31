import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Flame } from 'lucide-react';
import { ALL_LIQUORS, BOURBONS } from '../data';
import { Bourbon } from '../bourbonTypes';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  bourbons?: Bourbon[];
}

const BOT_NAME = 'Barrel Bot';

// --- Knowledge Base & Response Engine ---

function normalize(s: string): string {
  return s.toLowerCase().replace(/['']/g, "'").replace(/[^a-z0-9' ]/g, ' ').trim();
}

function findBourbonsByName(query: string): Bourbon[] {
  const q = normalize(query);
  return ALL_LIQUORS.filter(b => normalize(b.name).includes(q)).slice(0, 3);
}

function findByDistillery(query: string): Bourbon[] {
  const q = normalize(query);
  return ALL_LIQUORS.filter(b => normalize(b.distillery).includes(q)).slice(0, 5);
}

function findByPriceRange(min: number, max: number): Bourbon[] {
  return BOURBONS.filter(b => b.price >= min && b.price <= max)
    .sort((a, b) => b.flavorProfile.complexity - a.flavorProfile.complexity)
    .slice(0, 5);
}

function findByFlavor(flavor: keyof Bourbon['flavorProfile'], minScore = 7): Bourbon[] {
  return BOURBONS.filter(b => b.flavorProfile[flavor] >= minScore)
    .sort((a, b) => b.flavorProfile[flavor] - a.flavorProfile[flavor])
    .slice(0, 5);
}

function findHighProof(minProof = 110): Bourbon[] {
  return BOURBONS.filter(b => b.proof >= minProof)
    .sort((a, b) => b.proof - a.proof)
    .slice(0, 5);
}

function findSmooth(): Bourbon[] {
  return BOURBONS.filter(b => b.flavorProfile.heat <= 4 && b.flavorProfile.sweetness >= 6)
    .sort((a, b) => a.flavorProfile.heat - b.flavorProfile.heat || b.flavorProfile.sweetness - a.flavorProfile.sweetness)
    .slice(0, 5);
}

function formatBourbonCard(b: Bourbon): string {
  return `**${b.name}** — ${b.distillery}\n${b.proof} proof · ${b.age ? b.age + ' yr' : 'NAS'} · ~$${b.price}`;
}

function formatList(bourbons: Bourbon[]): string {
  if (!bourbons.length) return "I couldn't find any matches for that. Try being more specific?";
  return bourbons.map(formatBourbonCard).join('\n\n');
}

// Pattern-matched response engine
function generateResponse(input: string): { text: string; bourbons?: Bourbon[] } {
  const q = normalize(input);
  const words = q.split(/\s+/);

  // Greetings
  if (/^(hey|hi|hello|howdy|yo|sup|what'?s up|greetings)/.test(q)) {
    return { text: `Howdy! I'm ${BOT_NAME} 🥃 — your bourbon guide. Ask me anything about whiskey, recommendations, flavor profiles, or specific bottles. What are you sipping on?` };
  }

  // Thanks
  if (/^(thanks|thank you|thx|cheers|appreciate)/.test(q)) {
    return { text: "Cheers! Always happy to talk bourbon. Let me know if you need anything else. 🥃" };
  }

  // Help / what can you do
  if (/what can you|help|what do you know|how do you work|what are you/.test(q)) {
    return {
      text: `I'm ${BOT_NAME} — I know the entire FIREWATER catalog inside and out. Here's what I can help with:\n\n• **Find a bourbon** — "Tell me about Eagle Rare"\n• **Recommendations** — "What's good under $50?"\n• **Flavor search** — "Find me something sweet" or "I want smoky"\n• **High proof** — "What's the strongest bourbon?"\n• **Smooth sippers** — "What's smooth and easy?"\n• **Distillery search** — "What does Buffalo Trace make?"\n• **Comparisons** — "Compare Maker's Mark and Woodford"\n• **Bourbon 101** — "What is mash bill?" or "How is bourbon made?"`
    };
  }

  // Specific bourbon lookup
  const aboutMatch = q.match(/(?:tell me about|what is|what'?s|know about|info on|details on|how is)\s+(.+)/);
  if (aboutMatch) {
    const results = findBourbonsByName(aboutMatch[1]);
    if (results.length) {
      const b = results[0];
      const topFlavors = Object.entries(b.flavorProfile)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k]) => k);
      return {
        text: `${formatBourbonCard(b)}\n\n${b.description}\n\n**Top notes:** ${topFlavors.join(', ')}\n**Mash bill:** ${b.mashBill}`,
        bourbons: [b],
      };
    }
  }

  // Compare two bourbons
  const compareMatch = q.match(/compare\s+(.+?)\s+(?:and|vs|versus|with|to)\s+(.+)/);
  if (compareMatch) {
    const a = findBourbonsByName(compareMatch[1]);
    const b = findBourbonsByName(compareMatch[2]);
    if (a.length && b.length) {
      const ba = a[0], bb = b[0];
      const diff = (key: keyof Bourbon['flavorProfile']) => {
        const d = ba.flavorProfile[key] - bb.flavorProfile[key];
        return d > 0 ? `${ba.name} is ${key === 'heat' ? 'hotter' : 'higher'}` : d < 0 ? `${bb.name} is ${key === 'heat' ? 'hotter' : 'higher'}` : 'tied';
      };
      return {
        text: `**${ba.name}** vs **${bb.name}**\n\n` +
          `Proof: ${ba.proof} vs ${bb.proof}\n` +
          `Age: ${ba.age || 'NAS'} vs ${bb.age || 'NAS'}\n` +
          `Price: ~$${ba.price} vs ~$${bb.price}\n\n` +
          `Sweetness: ${diff('sweetness')}\nOak: ${diff('oak')}\nHeat: ${diff('heat')}\nComplexity: ${diff('complexity')}`,
        bourbons: [ba, bb],
      };
    }
  }

  // Price-based recommendations
  const priceMatch = q.match(/(?:under|below|less than|cheaper than)\s*\$?(\d+)/);
  if (priceMatch) {
    const max = parseInt(priceMatch[1]);
    const results = findByPriceRange(0, max);
    return { text: `Top picks under $${max}:\n\n${formatList(results)}`, bourbons: results };
  }
  const priceRangeMatch = q.match(/(?:between|from)\s*\$?(\d+)\s*(?:and|to|-)\s*\$?(\d+)/);
  if (priceRangeMatch) {
    const min = parseInt(priceRangeMatch[1]);
    const max = parseInt(priceRangeMatch[2]);
    const results = findByPriceRange(min, max);
    return { text: `Best options $${min}–$${max}:\n\n${formatList(results)}`, bourbons: results };
  }

  // Flavor-based searches
  const flavorMap: Record<string, keyof Bourbon['flavorProfile']> = {
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
  for (const word of words) {
    if (flavorMap[word]) {
      const flavor = flavorMap[word];
      const results = findByFlavor(flavor);
      return { text: `Top bourbons for **${word}** flavor:\n\n${formatList(results)}`, bourbons: results };
    }
  }

  // Smooth / easy drinking
  if (/smooth|easy|beginner|gentle|mellow|sipping|starter|first bourbon|new to bourbon/.test(q)) {
    const results = findSmooth();
    return { text: `Smooth, easy-sipping bourbons:\n\n${formatList(results)}`, bourbons: results };
  }

  // High proof / strong
  if (/high proof|strong|strongest|barrel.?proof|cask.?strength|overproof|most proof/.test(q)) {
    const results = findHighProof();
    return { text: `Highest proof bourbons in the catalog:\n\n${formatList(results)}`, bourbons: results };
  }

  // Distillery search
  const distilleryMatch = q.match(/(?:from|by|made by|what does|what do)\s+(.+?)(?:\s+make|\s+produce|\s+distill|$)/);
  if (distilleryMatch) {
    const results = findByDistillery(distilleryMatch[1]);
    if (results.length) {
      return { text: `From **${results[0].distillery}**:\n\n${formatList(results)}`, bourbons: results };
    }
  }

  // Bourbon education / FAQ
  if (/what is bourbon|what'?s bourbon|define bourbon/.test(q)) {
    return { text: "Bourbon is an American whiskey that must be: made from at least 51% corn, aged in new charred oak barrels, distilled to no more than 160 proof, entered the barrel at no more than 125 proof, and bottled at 80+ proof. Despite popular belief, it doesn't have to be made in Kentucky — though most is!" };
  }
  if (/mash.?bill|mashbill/.test(q)) {
    return { text: "A **mash bill** is the recipe of grains used to make whiskey. Bourbon must be at least 51% corn. The rest is usually malted barley plus either rye (for spice) or wheat (for sweetness). Common types:\n\n• **Traditional:** ~70% corn, ~15% rye, ~15% barley\n• **High rye:** ~60% corn, ~35% rye — spicier\n• **Wheated:** ~70% corn, ~16% wheat — softer & sweeter" };
  }
  if (/how.*made|how.*bourbon.*made|distill|process|production/.test(q)) {
    return { text: "Bourbon is made in these steps:\n\n1. **Mashing** — Grains are ground and cooked with water\n2. **Fermentation** — Yeast converts sugars to alcohol (3-5 days)\n3. **Distillation** — Liquid is distilled (usually column + pot still)\n4. **Aging** — Goes into new charred oak barrels (no minimum age for bourbon, but 2+ years for \"straight bourbon\")\n5. **Bottling** — Filtered, proofed down with water, and bottled" };
  }
  if (/proof|what is proof|what'?s proof/.test(q)) {
    return { text: "**Proof** is a measure of alcohol content. In the US, proof = 2× the ABV (alcohol by volume). So 100 proof = 50% ABV. The term comes from early distillers testing spirits by soaking gunpowder — if it still ignited, the spirit was \"proof.\"" };
  }
  if (/wheated|wheat bourbon/.test(q)) {
    return { text: "A **wheated bourbon** uses wheat instead of rye as the secondary grain. This creates a softer, sweeter, smoother profile. Famous examples: Maker's Mark, Pappy Van Winkle, W.L. Weller, and Larceny." };
  }
  if (/neat|how.*drink|how.*enjoy|ice|rocks/.test(q)) {
    return { text: "There's no wrong way to enjoy bourbon! Common ways:\n\n• **Neat** — Room temp, no ice. Best for tasting nuance.\n• **On the rocks** — Over ice. Opens up flavors as it dilutes.\n• **With water** — A few drops can unlock hidden notes.\n• **Cocktails** — Old Fashioned, Manhattan, Whiskey Sour are classics.\n\nStart neat, then add ice/water to find your preference. Higher proof bourbons often benefit from a splash of water." };
  }
  if (/old fashioned|manhattan|cocktail|mixed drink|whiskey sour/.test(q)) {
    return { text: "Classic bourbon cocktails:\n\n🥃 **Old Fashioned** — Bourbon, sugar, Angostura bitters, orange peel\n🍸 **Manhattan** — Bourbon/rye, sweet vermouth, bitters, cherry\n🍋 **Whiskey Sour** — Bourbon, lemon juice, simple syrup, optional egg white\n🌿 **Mint Julep** — Bourbon, sugar, fresh mint, crushed ice\n\nFor mixing, use a solid mid-range bourbon ($25-40). Save the top shelf for sipping!" };
  }
  if (/age.?statement|nas|no age|how long|aging|aged/.test(q)) {
    return { text: "An **age statement** tells you the youngest whiskey in the bottle. \"NAS\" (No Age Statement) means the distillery chose not to disclose it — but that doesn't mean it's bad. Many excellent bourbons are NAS. By law, \"straight bourbon\" is aged at least 2 years, and if under 4 years, the age must be stated." };
  }
  if (/single barrel|small batch/.test(q)) {
    return { text: "**Single Barrel** — Bottled from one individual barrel, so each bottle is unique. Expect more variation and character.\n\n**Small Batch** — Blended from a select number of barrels (no legal definition of \"small\"). Aims for consistency with more personality than standard releases." };
  }
  if (/best bourbon|top bourbon|number one|favorite|recommend/.test(q)) {
    const picks = BOURBONS.filter(b => b.flavorProfile.complexity >= 8).sort((a, b) => b.flavorProfile.complexity - a.flavorProfile.complexity).slice(0, 5);
    return { text: `Here are some of the most complex and highly regarded bourbons in the catalog:\n\n${formatList(picks)}`, bourbons: picks };
  }
  if (/cheap|budget|affordable|value|bang for.*buck|inexpensive/.test(q)) {
    const results = findByPriceRange(0, 35).slice(0, 5);
    return { text: `Great value bourbons under $35:\n\n${formatList(results)}`, bourbons: results };
  }
  if (/gift|present|special occasion|birthday|anniversary/.test(q)) {
    const results = BOURBONS.filter(b => b.price >= 50 && b.price <= 150 && b.flavorProfile.complexity >= 7).slice(0, 5);
    return { text: `Great gift-worthy bourbons ($50–$150):\n\n${formatList(results)}`, bourbons: results };
  }
  if (/rye|what is rye/.test(q)) {
    return { text: "**Rye whiskey** must be made from at least 51% rye grain (instead of corn for bourbon). It tends to be spicier, drier, and more herbaceous. If you like a bourbon with a kick, rye might be your thing. Many \"high rye\" bourbons blur the line between the two styles." };
  }
  if (/scotch|difference.*scotch|scotch.*vs|vs.*scotch/.test(q)) {
    return { text: "**Bourbon vs Scotch:**\n\n• Bourbon = American, corn-based, new charred oak barrels, often sweeter\n• Scotch = Scottish, barley-based, used oak barrels, often smoky/peaty\n\nThey're both whiskey, just with different rules, grains, and traditions. If you like bourbon's sweetness, try a Speyside Scotch. If you like smoke, try Islay." };
  }

  // Name search fallback — try to find a matching bourbon
  const nameResults = findBourbonsByName(q);
  if (nameResults.length) {
    const b = nameResults[0];
    return {
      text: `Found it! ${formatBourbonCard(b)}\n\n${b.description}`,
      bourbons: nameResults,
    };
  }

  // Distillery fallback
  const distResults = findByDistillery(q);
  if (distResults.length) {
    return { text: `Here's what I found from that distillery:\n\n${formatList(distResults)}`, bourbons: distResults };
  }

  // Catch-all
  const fallbacks = [
    `Hmm, I'm not sure about that one. Try asking me about a specific bourbon, a flavor you like, or a price range!`,
    `I didn't quite catch that. I'm best at bourbon recommendations, flavor searches, and whiskey trivia. What can I help with?`,
    `Not sure I follow — but I know bourbon! Try "What's good under $50?" or "Find me something smoky."`,
  ];
  return { text: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
}

// --- Component ---

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: `Hey there! I'm ${BOT_NAME} — your bourbon expert. Ask me about any bourbon, flavor, price range, or whiskey question. What'll it be? 🥃`, sender: 'bot' },
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
      const response = generateResponse(trimmed);
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
              <div className="text-xs text-theme-muted">Bourbon Expert</div>
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
                placeholder="Ask about bourbon..."
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
