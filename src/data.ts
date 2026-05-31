import { Book, Video, BlogPost, Review } from './types';

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'demons-head',
    title: "The Demon's Head",
    author: 'Blacky',
    coverImage: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=600&auto=format&fit=crop',
    tags: ['Dark Romance', 'Thriller', 'Action', 'Lagos Underworld'],
    progress: 0,
    currentChapter: 0,
    bookmarks: [],
    isPremium: false,
    notes: [],
    rating: 4.9,
    content: [
      `CHAPTER ONE: THE PREDATOR'S LOUNGE

The scent of expensive oud, aged bourbon, and the metallic tang of hidden intentions always hung heavy in the air of The Obsidian Bar & Lounge—the most exclusive sanctuary on Victoria Island, Lagos.

At the center of this web sat Precious, famously known as Madam Precious. To the politicians and celebrities, she was a goddess of hospitality who knew everyone's name and how they liked their poison. Her emerald green slip dress clung to her curves, but strapped to her thigh was a ceramic blade.

Her second device displayed a high-priority contract:
TARGET: Luhan Ojo.
STATUS: High Priority Extraction.

Luhan was the heir to Ojo Logistics, the backbone of the West African trade. But Precious knew the tankers carried more than petrol; they carried synthetic narcotics.

"He's here," whispered her bartender, Tunde. Luhan walked in with a sharp, tailored black suit and a magnetic pull she despised.

"I thought I'd have to travel back to Europe to see you," Luhan whispered.
Their private dinner overlook was supposed to be the "kill zone." But the romance was cut short as three tactical shooters swarmed the terrace. Unflinching, Precious flipped the heavy table, retrieved her concealed Glock 17, and neutralized them in a quick, lethal blur.

Luhan stood frozen, staring at his beautiful companion turned apex assassin.`,

      `CHAPTER TWO: THE PRICE OF A SECRET

"You... you're not just a bar owner," Luhan whispered.
Precious wiped a speck of blood from her cheek. "I am the Head of the Demon's Clan. We write the intelligence and provide solutions for people too powerful for the law to touch."

She couldn't tell him that her agency had accepted the bounty to end him, only that she had just killed three of her own men to save his life. "Someone paid a king's ransom for your head, Luhan. Tonight, I chose you over my allegiance."

Instead of running, Luhan pulled her close, kissing her passionately—a kiss of two predators on the edge of a cliff. He pressed his heavy gold Ojo signet ring into her palm. "If you are in trouble, show this to the docks. They'll die for you because they fear my father, but they'll kill for you because of me."

Precious returned to The Obsidian to claim an outside ambush had occurred, but her scarred second-in-command, Kalu, was already suspicious.

"The team says the Head went soft," Kalu grunted.
"I did not go soft, Kalu. I go deep," Precious snapped. But driving through rain-slicked Lekki that night, she knew she was chasing his pulse.`,

      `CHAPTER THREE: THE VELVET NOOSE

They met at Luhan’s brutalist glass-and-steel villa on the Lekki beach.
"You are a job, Luhan. A complication I should have ended," Precious whispered, backing him against the door.
"Then end it," he challenged. "Kill me, or kiss me."

Their embrace was explosive. Luhan lifted her, and she wrapped around him as her red satin gown pooled at their feet. They fell together on silk sheets under the silver tropical moonlight, forgetting the dark contracts.

But the silence was broken by her encrypted phone vibrating.
FROM: KALU
MESSAGE: I know where you are. The Demons are inbound. If you won't finish the contract, we will.

Within seconds, searchlight lasers pierced the window panes. Precious rolled off the bed, pulling Luhan downward as the glass shattered. "Viper Strike formation," she muttered. She slipped into the dark hallway, neutralizing three oncoming agents with fluid, non-lethal strikes.

"They are my family, Luhan. But the house is divided," she said.
Kalu was staging a coup. He hired a rogue white-haired sniper named Cosmo, an elite freelance "Eraser."`,

      `CHAPTER FOUR: THE CRIMSON TRAJECTORY

An encrypted drive delivered by Tunde revealed the mastermind behind Luhan's contract: Desmond Ojo, Luhan's envious cousin who wanted the logistics crown for himself.

Precious rode her motorcycle to Desmond's underground den, 'The Gambit'. She slammed her ceramic knife through Desmond's hand, pinning it to the desk. "The contract is over, Desmond. Touch him again, and I'll dismantle your entire bloodline."

As she walked out into the Lekki smog, a red laser point settled on her chest.
On a rusted billboard overhead, Cosmo held her cheek weld on a .338 Lapua. "Target acquired," Cosmo hummed.

CRACK!
The bullet shattered the concrete inches from Precious's cheek. She threw a magnesium flare to blind Cosmo's thermal scopes, jumped on her bike, and roared into the Lagos traffic to find Luhan.

"Desmond has Kalu and Cosmo," she told Luhan at the safehouse. "They are coming to erase us."
Luhan's eyes hardened into pure, murderous fury. "Then we give them a war Lagos will never forget."`,

      `CHAPTER FIVE: THE ALAFIN'S BLESSING

They traveled to the heavily guarded ancestral Ojo Estate in Ikoyi.
The patriarch, Femi Ojo, sat on an ebony throne holding a silver leopard-head cane.

As Precious began the Yoruba halfway kneel of respect—the dobale—Femi caught her arms, pulling her up. He gently raised her hand to his lips. "The Demon's Head," Femi murmured with deep respect. "I have survived forty years in the West African shadows, hearing whispers of the woman commanding ghosts. I never thought I would see the face of the legend in my home."

Luhan declared their alliance. "Her intelligence, our logistics. We bypass the brokers. We own the entire chain."
Femi's eyes gleamed. "The old ways are dead. Information is the true currency. But first, we remove the rot. My brother Adeyemi and his son Desmond must be harvested."

That night, Cosmo cut the balcony screen. Precious engaged Cosmo in a fierce, bleeding knife duel. Cosmo was faster, but Precious was a technician of pain. She drove her spade deep into Cosmo's shoulder and fired two rounds into her waist. Cosmo tripped a flashbang, escaping down the balcony, leaving a trail of blood.`,

      `CHAPTER SIX: THE NEW ARCHITECTURE

Precious rode to the clinic in Surulere, leaving Kalu's failed guards on the floor. She confronted the bleeding Cosmo on a gurney. "Kalu left you to die. I leave you with your breath so you can tell him I'm coming."

Meanwhile, Luhan led a tactical siege against The Gambit, crippling Desmond's enforcers. In the chaos of a security smoke screen, a mysterious syndicate extracted the wounded Desmond.

Precious entered Kalu's server room. Kalu stood waiting, massive and powerful, throwing her through the glass partitions. But Precious rolled, using a sharp shard to slice Kalu’s knee tendons, then pinned him to the floor. "You sold our family to a coward," she hissed, stripping the Demon's patch from his vest. She tightened her grip on his windpipe until his struggle ceased.

A week later, Lagos was theirs. On the penthouse terrace, Precious let her burgundy robe pool, stepping into the warm rain-shower with Luhan. Their bodies tangled in silk and triumph under the dark skyline.

But across the city, Desmond sat in a wheelchair, his arm severed, alongside the scarred Cosmo. A masked man with a black signet ring placed a matte-black robotic arm on the table.

"They celebrate in the palace," Desmond spat.
"Let them build their throne higher," the leader said. "The higher they are, the harder they will crash."`
    ]
  }
];

export const INITIAL_VIDEOS: Video[] = [
  {
    id: 'the-seer',
    title: "The Seer: The Demon's Head",
    duration: '01:08',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    tags: ['The Seer', 'Demons', 'Lagos Underworld', 'Cinematic'],
    progress: 0,
    isPremium: false,
    description: "Witness the visions of the Seer, Anna Iyare, and face the terror of the Demon's Head. Your greatest nightmares are coming to life in this exclusive atmospheric masterclass."
  }
];

export const INITIAL_BLOGS: BlogPost[] = [
  {
    id: 'underworld-chronicles',
    title: 'Designing the Noir of Lagos Victoria Island',
    date: 'May 26, 2026',
    excerpt: 'Lagos is a city of twin realities: the brilliant golden sun of the Lekki lagoon and the heavy midnight ink of the Victoria Island underground.',
    content: `Lagos at night is a masterclass in atmospheric high-contrast. The oil refineries flare amber against the pitch-black coast while the skyscrapers of Ikoyi cut deep charcoal silhouettes into the humid storm clouds.

To write "The Demon's Head" was to capture this exact duality. Madam Precious represents the hospitality of gold leaf and crystal bottles, while Luhan represents the logistics of iron and oil. When these two collide, the boundaries of romance and crime collapse.

Our design language in the Blackshadow Library mirrors this. Off-black canvases represent the heavy smog of Epe, while the crimson light-accents represent the laser sights of Cosmo’s sniper rifle bouncing off the marble penthouse glass.`,
    readingTime: '3 min read',
    tags: ['Noir', 'Lagos', 'Design']
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    itemType: 'book',
    itemId: 'demons-head',
    itemTitle: "The Demon's Head",
    author: 'ScribeOfLekki',
    rating: 5,
    comment: "An absolute masterclass in African dark romance and espionage! Blacky's depiction of Madam Precious and Luhan is electric. Reading this in charcoal/noir style matches the mood perfectly.",
    date: '2026-05-26',
    likes: 42,
    likedByUser: false
  },
  {
    id: 'rev-2',
    itemType: 'video',
    itemId: 'the-seer',
    itemTitle: "The Seer: The Demon's Head",
    author: 'AnnaFan',
    rating: 5,
    comment: "The visual aesthetic of the Seer, Anna Iyare, is hypnotic! Fantastic soundscape and dark energy. Facing the Demon's Head had me on edge.",
    date: '2026-05-26',
    likes: 29,
    likedByUser: true
  }
];
