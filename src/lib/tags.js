export const APPROVED_TAGS = [
  "fantasy","dark fantasy","epic fantasy","urban fantasy","high fantasy","low fantasy",
  "sci-fi","hard sci-fi","soft sci-fi","space opera","cyberpunk","steampunk","solarpunk","biopunk",
  "horror","cosmic horror","body horror","psychological horror","gothic horror","survival horror",
  "romance","dark romance","slow burn","enemies to lovers","found family","forbidden love",
  "mystery","noir","detective","cozy mystery","thriller","spy thriller","political thriller",
  "action","adventure","heist","western","historical fiction","alternate history",
  "literary fiction","slice of life","coming of age","character study",
  "comedy","satire","parody","absurdist","tragedy","drama","melodrama","erotica","smut","explicit",
  "short story","novella","novel","anthology","serial","one-shot","ongoing",
  "prose","poetry","script","epistolary","comic","manga","manhwa","webtoon","graphic novel",
  "visual novel","interactive fiction","choose your own adventure",
  "all ages","teen","young adult","mature","adult only",
  "magic","magic system","hard magic","soft magic","time travel","multiverse","alternate universe","AU",
  "post-apocalyptic","dystopian","utopian","artificial intelligence","robots","androids","transhumanism",
  "mythology","folklore","fairy tale","retelling","religion","spirituality","philosophy",
  "war","military","politics","revolution","survival","wilderness","isolation",
  "grief","trauma","mental health","recovery","addiction","identity","gender","sexuality","LGBTQ+","queer",
  "race","culture","diaspora","colonialism","family","parenthood","siblings","friendship","rivalry",
  "power","corruption","morality","ethics","music","art","writing","performance",
  "sports","competition","martial arts","food","cooking","culinary","nature","environment","climate",
  "crime","gangs","underground",
  "school","academy","university","small town","city","rural","suburban",
  "space","space station","colony","alien planet","underwater","underground","forest","desert","arctic",
  "medieval","renaissance","victorian","1920s","1980s","futuristic","far future","real world","earth","secondary world",
  "violence","graphic violence","death","gore","abuse","sexual abuse","domestic abuse","noncon","dubcon",
  "torture","dark themes","trigger warning","suicide","self harm",
  "D&D 5e","D&D 3.5e","pathfinder","pathfinder 2e","starfinder",
  "call of cthulhu","vampire the masquerade","shadowrun","fate","powered by the apocalypse",
  "OSR","OSE","dungeon world","blades in the dark","delta green",
  "adventure","dungeon","hexcrawl","sandbox","one shot","campaign",
  "level 1","level 2","level 3","level 4","level 5","level 6","level 7","level 8",
  "level 9","level 10","level 11","level 12","level 13","level 14","level 15",
  "level 16","level 17","level 18","level 19","level 20",
  "homebrew","official","licensed","system agnostic",
  "monsters","NPCs","maps","tokens","handouts","battle map",
  "fanfic","original fiction","original work",
  "crossover","crack fic","fix-it","canon compliant","canon divergent",
  "angst","fluff","hurt comfort","whump","pwp",
  "completed","abandoned","hiatus","work in progress",
];

export function matchTags(input) {
  if (!input || input.length < 2) return [];
  const q = input.toLowerCase();
  const exact = APPROVED_TAGS.filter(t => t.startsWith(q));
  const fuzzy = APPROVED_TAGS.filter(t => !t.startsWith(q) && t.includes(q));
  return [...exact, ...fuzzy].slice(0, 8);
}
