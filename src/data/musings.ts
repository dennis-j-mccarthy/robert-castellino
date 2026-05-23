export type MusingCategory =
  | "reflections"
  | "light"
  | "land"
  | "locations"
  | "wilderness";

export type Musing = {
  id: string;
  num: string;
  cat: MusingCategory;
  title: string;
  date: string;
  loc?: string;
  img?: string;
  size?: "sm" | "md" | "lg";
  excerpt: string;
  /** Paragraphs may contain inline <em>...</em> HTML — rendered with dangerouslySetInnerHTML. */
  body: string[];
};

export const CAT_META: Record<
  MusingCategory,
  { label: string; color: string; short: string }
> = {
  reflections: { label: "Reflections", color: "#d9c89a", short: "Rf." },
  light:       { label: "Light",       color: "#e8b96c", short: "Lt." },
  land:        { label: "Land",        color: "#c89668", short: "Ld." },
  locations:   { label: "Locations",   color: "#7a8ec4", short: "Lc." },
  wilderness:  { label: "Wilderness",  color: "#7aa088", short: "Wl." },
};

export const MUSINGS: Musing[] = [
  // ───────────── REFLECTIONS (6) ─────────────
  {
    id: "m01", num: "M.001", cat: "reflections",
    title: "Why I Rise Early",
    date: "Spring 2025",
    excerpt: "I have been awake before sunrise on roughly nine thousand mornings, and every one of them has paid back something I would have lost in bed.",
    body: [
      "I have been awake before sunrise on roughly nine thousand mornings &mdash; not because I am virtuous, and not because I sleep poorly, but because the half hour before the world begins is the half hour in which the world is most willing to be looked at. Every one of those nine thousand mornings has paid back something I would have lost in bed.",
      "The early hours are quieter than they have any right to be. The air has not yet been stirred by traffic, the river has the night's cold still in it, and most of what you will photograph is also up early, having reasons of its own. The light, when it arrives, arrives the way light is supposed to: slowly, and from below.",
      "I do not recommend the practice to everyone. I recommend it to anyone who has ever wondered why their photographs feel like everyone else's. They do not feel like everyone else's because, between the hours of nine and four, the world is being seen by everyone. A landscape photographer's only real luxury is being there when no one else is."
    ]
  },
  {
    id: "m02", num: "M.002", cat: "reflections",
    title: "Life Through a Lens",
    date: "Winter 2025",
    excerpt: "A camera is not a way of recording the world. It is, if you let it be, a way of being instructed by it.",
    body: [
      "A camera is not, primarily, a way of recording the world. People who use it that way mostly produce records, which is to say documents of having been somewhere, and documents are a poor substitute for the looking that should have happened on the spot.",
      "A camera is, if you let it be, a way of being instructed by the world &mdash; an instrument that requires you to slow down, to consider edges, to attend to what is at the foreground rather than what is at the postcard. Fifty years of holding one has, I think, taught me more about how to be in the world than any other practice I have undertaken, religious or otherwise.",
      "The instruction is not that the world is beautiful. The instruction is that the world is beautiful only when looked at, and that looking is a discipline most adults have forgotten and a few children have not yet lost."
    ]
  },
  {
    id: "m03", num: "M.003", cat: "reflections",
    title: "Patience as the Whole Practice",
    date: "Autumn 2024",
    excerpt: "Fifty years has not made me a better photographer. It has made me a more patient one. These turn out, in the end, to be the same thing.",
    body: [
      "Fifty years has not made me a better photographer in any of the ways the phrase usually means. I have not, with time, acquired techniques I did not have at thirty. I have not learned secrets the younger version of myself was not also told. The light at sixty-eight does what the light at twenty-eight did. The gear, by and large, is the same gear.",
      "What fifty years has made me is more patient. I will sit on a rock for three hours where the younger man would have moved after thirty minutes. I will return to an overlook for the eleventh time when I would once have given up at the fourth. I will let a photograph fail to materialize without taking it personally.",
      "These turn out, in the end, to be the same thing. Better photographer and more patient photographer are not adjacent qualities; they are the same quality. Whoever told you it was about talent, or about gear, or about being in the right place at the right time, was speaking of a different art."
    ]
  },
  {
    id: "m04", num: "M.004", cat: "reflections",
    title: "The Discipline of Stillness",
    date: "Summer 2024",
    excerpt: "If you cannot sit on a rock for two hours without taking out your phone, you cannot photograph a landscape. The two skills are the same skill.",
    body: [
      "If you cannot sit on a rock for two hours without taking out your phone, you cannot photograph a landscape. The two skills are the same skill, and the skill is not photographic. It is older than photography and will outlast it.",
      "Stillness is unfashionable. We have built a century around its opposite &mdash; constant motion, constant input, constant the next thing. A landscape, by definition, refuses to participate in any of that. A landscape will wait. A landscape will, in some sense, only ever be photographable by someone who has learned to wait alongside it.",
      "Young photographers ask me what to study. I tell them to study sitting. To pick a spot and remain in it without reaching for distraction. The longest minute they will ever spend will be the seventh. The fortieth will pass without their noticing. The hundredth is where the photograph lives."
    ]
  },
  {
    id: "m05", num: "M.005", cat: "reflections",
    title: "What an Unsuccessful Day Teaches",
    date: "Spring 2024",
    excerpt: "I have driven home from more two-thousand-mile trips with no photograph than with one. I do not think of those trips as failures. I think of them as the price.",
    body: [
      "I have driven home from more two-thousand-mile trips with no photograph than with one. The Roan in 2003, the Sangres in 2009, two seasons in northwest Wyoming where the weather, with consistent good humor, refused. A great many empty drives.",
      "I do not think of those trips as failures, and I have stopped letting younger photographers think of theirs that way. The trips are the practice. The trips are how you learn the land &mdash; the back roads, the access, the bad weather pattern, the unmarked turnouts that will, ten years later, produce a frame. None of that is learnable without the empty drives.",
      "I have come, slowly, to believe that the photographs are not the work. The driving home empty is the work. The photographs are the occasional surplus that the practice happens to throw off, and a healthy practice produces them when it produces them and not before."
    ]
  },
  {
    id: "m06", num: "M.006", cat: "reflections",
    title: "What Fifty Years Has Taught Me",
    date: "Winter 2024",
    excerpt: "Three things, and only three: that the light is the subject, that the patience is the work, and that you are very, very lucky to be doing this at all.",
    body: [
      "Fifty years, three lessons. I am suspicious of anyone who has been at any art for that long and claims to have learned more than three things, and equally suspicious of anyone who claims to have learned fewer.",
      "The first: the light is the subject. The mountain is not the subject. The lake is not the subject. The cottonwoods are not the subject. The light that happens to be falling on the mountain, the lake, and the cottonwoods on a particular afternoon in a particular minute &mdash; that is the subject. Everything else is supporting cast.",
      "The second: the patience is the work. Not the gear, not the technique, not the eye for composition. The willingness to wait. The willingness to drive home empty. The willingness to come back. Patience is not a virtue applied to the work; patience is the work, and the rest is decoration.",
      "The third: you are very, very lucky to be doing this at all. The world is staggeringly beautiful, and you are alive in a moment of it, and you have been given a small instrument with which to register your gratitude. Fifty years is not long enough. It will have to be long enough."
    ]
  },

  // ───────────── LIGHT (6) ─────────────
  {
    id: "m07", num: "M.007", cat: "light",
    title: "The Fifty-Second Light",
    date: "Spring 2024", loc: "Independence Pass · CO",
    img: "/assets/mt-yale.jpg", size: "lg",
    excerpt: "Every alpine sunset gives you about fifty seconds of real photograph. The thirty minutes before are a kind of conversation; the fifty seconds are an argument you either win or lose.",
    body: [
      "Fifty years on the same passes have taught me that almost every alpine sunset gives you about fifty seconds of real photograph. Not eight minutes, not three. Fifty seconds. Everything before is a conversation between the light and the land — long, deliberate, often disappointing. The fifty seconds at the end are an argument, and you have to be already set up to win it.",
      "The mistake of younger photographers is to wait for the light to arrive and then begin composing. By then it has begun to leave. You compose for the light that will be there in twelve minutes, not the light that is there now. You meter for snow that will be lit. You frame for clouds that haven't burned yet.",
      "On Independence in October of 2018 the band of last light moved across Mount Champion's east face in exactly thirty-eight seconds. I made seven exposures. Two of them were ruined by a tripod leg I'd left loose. Of the five remaining, one became the cover of the second book. That is roughly the percentage you should expect — and roughly the percentage that has kept me at it for fifty years."
    ]
  },
  {
    id: "m08", num: "M.008", cat: "light",
    title: "On Alpine Glow",
    date: "Winter 2024",
    excerpt: "The pink on the peaks at dusk is the longest-traveled light most of us will ever see. It is also, almost always, photographed badly.",
    body: [
      "The pink on the snowfields at dusk — what the Germans call <em>alpenglühen</em> — is the longest-traveled light most of us are ever going to see. The sun has already set where you are standing; what is reaching the peaks above you has bent through more atmosphere than any other light of the day. It is filtered, exhausted, and somehow patient. It is also, almost always, photographed badly.",
      "Three failures recur. The first is saturation: the temptation to push the pink until it becomes a color that does not exist in nature. The second is contrast: the photograph wants to be high-key, and you keep printing it low. The third is composition: the peak is so beautiful that you forget to give it any companions in the frame, and the result reads as a postcard rather than a photograph.",
      "The discipline is to underexpose by a third, to let the lower world go nearly black, and to give the peak the dignity of being one element among several. Old Mt. Sopris from the south is a fair teacher."
    ]
  },
  {
    id: "m09", num: "M.009", cat: "light",
    title: "The Blue Hour, Properly Observed",
    date: "Autumn 2023",
    img: "/assets/lone-pine.jpg",
    excerpt: "It is not actually an hour, and it is rarely blue. But there are about eighteen minutes of evening when a winter landscape opens itself to a camera in a way it will not do at any other time.",
    body: [
      "It is not actually an hour, and it is rarely blue. But there are about eighteen minutes of evening — varying with latitude, weather, and time of year — when a winter landscape opens itself to a camera in a way it does not do at any other time. The snow turns the color of cold milk. Shadows go cobalt. The sky, just after sunset, lights from below in a way that no daytime sky ever does.",
      "I have been working a single pine tree above Red Mountain Pass for six winters. The same tree, roughly the same hour, when conditions allow. I have made perhaps three photographs of it I would defend. The point is not the tree. The point is that the photograph is being made by the eighteen minutes, and the tree is being kind enough to participate.",
      "If you want to learn the blue hour, pick something — a barn, a bend in a river, a single rock — and visit it twenty times. The twenty-first will teach you what the first nineteen did not."
    ]
  },
  {
    id: "m10", num: "M.010", cat: "light",
    title: "Why I Wait for Storms",
    date: "Summer 2023",
    excerpt: "The five minutes before a storm and the five minutes after are the only weather a serious landscape photographer is really after. The hours in between are for amateurs.",
    body: [
      "The clear day is a tourist's idea of beautiful weather. For a landscape photographer it is, almost without exception, dead light. The shadows are short, the sky has no shape, and the relationship between the land and the air above it has nothing to say.",
      "The five minutes before a storm and the five minutes after are the only weather a serious landscape photographer is really after. The hours in between are for the people inside the lodge. What you want is the moment when the cloud has not quite committed — when light is still pouring through an unclosed door in the sky — and the moment when it has just stopped raining and the world has been washed.",
      "I have driven home from a four-day trip with no photographs because the weather refused to break, and I have stood on the same overlook for two hours waiting for one shaft of light I knew was coming. That second photograph paid for the four-day trip and four more like it."
    ]
  },
  {
    id: "m11", num: "M.011", cat: "light",
    title: "Reflected Light on Snow",
    date: "Winter 2022",
    excerpt: "Snow is a mirror, and mirrors are not subjects. The question is always: what is the snow showing you?",
    body: [
      "A photograph of snow is rarely a photograph of snow. Snow is, optically, a mirror — it reflects whatever is being thrown at it: the warmth of last light, the cobalt of a winter sky, the green of a stand of pines fifty yards uphill. The question for the photograph is never what the snow looks like. It is what the snow is showing you.",
      "On a cold afternoon in 2019 I worked a field below the Maroon Bells for three hours and made one frame. The snow that day was reflecting two things — the late gold light from the west and the deep blue of the eastern shadow — and the photograph is, essentially, a record of those two colors meeting in a place where they are normally not allowed to meet.",
      "Look at the snow, then look up, then look down again. Whatever you are seeing the second time, you were not seeing the first."
    ]
  },
  {
    id: "m12", num: "M.012", cat: "light",
    title: "The Light Before the Light",
    date: "Spring 2022",
    excerpt: "The half-hour before sunrise is the most under-photographed half-hour of the day, for the simple reason that it requires having gotten up an hour earlier than you wanted to.",
    body: [
      "The half-hour before sunrise is the most under-photographed half-hour of the day, for the simple and unromantic reason that it requires having gotten up an hour earlier than you wanted to. The light is cool, the world is empty, and a great many of the photographs that hang in my studio were made in it.",
      "Pre-dawn light is exposure-difficult and color-rare. It is also patient: it does not move as quickly as evening light. A photograph that takes you four minutes to compose at dawn will still be substantially the same photograph when you finally release the shutter. The same compositional luxury is almost never available at dusk.",
      "There is a related, lesser-known phenomenon: the ten minutes immediately following sunrise, when the warmth has arrived but the shadows have not yet learned to point downhill. This is when you photograph rivers."
    ]
  },

  // ───────────── LAND (6) ─────────────
  {
    id: "m13", num: "M.013", cat: "land",
    title: "A Brief Geology of Maroon Lake",
    date: "Autumn 2024",
    img: "/assets/maroon-bells.jpg", size: "lg",
    excerpt: "The Bells are not, technically, the most photogenic peaks in Colorado. They are the most photographed because they are exactly the right distance from a reflecting pond — and because the pond is at the end of a paved road.",
    body: [
      "The Maroon Bells are not, technically, the most photogenic peaks in Colorado. They are the most photographed because they are exactly the right distance from a reflecting pond — about eleven hundred yards — and because the pond is at the end of a paved road. Convenience makes celebrities of mountains, as it does of people.",
      "But the geology of the Bells is more interesting than their celebrity. The maroon color is hematite-rich Maroon Formation mudstone, deposited about three hundred million years ago in shallow seas at the foot of an ancestral range. The rock is famously fragile — climbers call it 'rotten' — and the talus fields below the peaks are, in effect, the mountains slowly returning to the lake.",
      "I photograph the lake when no one is there. This is rarer than you would think. Even at three in the morning in February it is not uncommon to find one or two tripods already planted. They are usually pointed in the same direction. I tend to turn around and photograph the other shore."
    ]
  },
  {
    id: "m14", num: "M.014", cat: "land",
    title: "The Pawnee, A Working Theory",
    date: "Summer 2024",
    img: "/assets/pawnee-buttes.jpg",
    excerpt: "Colorado is famous for its mountains and quietly excellent at its prairies. The Pawnee Buttes are the case in point and the rebuttal at once.",
    body: [
      "Colorado is famous for its mountains and quietly excellent at its prairies. Two-thirds of the state is, technically, the Great Plains, and most of the people who know Colorado primarily as 'mountains' have never driven the seventy-five miles east of Greeley into the grass.",
      "The Pawnee Buttes are the case in point and the rebuttal at once. Two sandstone monoliths, about three hundred feet tall, standing in a sea of short-grass prairie. They are the only vertical thing for a long way in any direction, and the sky above them does work that mountains do not allow it to do.",
      "I have come to think of the Pawnees as Colorado's other Bells — equally photographed by a much smaller community, equally suspect for that reason, and equally rewarding once you stop trying to photograph the buttes themselves and start photographing the grass at their feet."
    ]
  },
  {
    id: "m15", num: "M.015", cat: "land",
    title: "On the Discipline of Foreground",
    date: "Spring 2024",
    excerpt: "Every landscape photograph begins as a portrait of something six feet in front of you. The mountains are background. They have always been background. Treat them that way.",
    body: [
      "Every landscape photograph begins as a portrait of something six feet in front of you — a rock, a clump of paintbrush, a piece of driftwood, a fence post. The mountains, however famous, are background. They have always been background. Treat them that way.",
      "Beginners make the opposite mistake. They drive to a viewpoint and photograph what is on the sign. The result is a record of the sign rather than a photograph of the place. The shutter is pressed before the photographer has decided what is closest.",
      "On a long bench above the Conundrum Valley one September I spent ninety minutes choosing a single piece of granite. The Maroon Bells were doing what the Maroon Bells do behind me. I made one photograph in which the rock is the entire foreground and the Bells are the size of a thumbnail in the upper third. That photograph is in the second book. The other photographs I made that day are in a drawer."
    ]
  },
  {
    id: "m16", num: "M.016", cat: "land",
    title: "The Sopris, Three Times",
    date: "Autumn 2023",
    img: "/assets/mt-sopris.jpg",
    excerpt: "I have made roughly three thousand photographs of Mount Sopris. Three of them are any good.",
    body: [
      "I have made roughly three thousand photographs of Mount Sopris over fifty years — call it seventy-five trips, with a tripod, in every season — and I would defend three of them.",
      "The first is from 1991, when I was thirty-three and did not yet know what I did not know. The second is from 2008, in the spring after my father died. The third is from 2019, the panoramic plate that opens the third section of the new book. Each of these photographs was made under conditions I could not have predicted and would not have requested.",
      "What this tells me, after fifty years, is something I would not have believed at thirty: most of the photograph is showing up. A small percentage of the photograph is talent. None of the photograph is gear."
    ]
  },
  {
    id: "m17", num: "M.017", cat: "land",
    title: "Plains and Prairie, A Distinction",
    date: "Summer 2023",
    excerpt: "The two words are used interchangeably and they should not be. The Plains are a thing geography does. A prairie is a thing the plains can be.",
    body: [
      "The two words are used interchangeably and they should not be. The Plains are a thing geography does — flat ground east of the Rockies, west of the Mississippi, roughly. A prairie is a thing the Plains can be: a particular short-grass or tall-grass ecology, increasingly rare, almost entirely gone where it was once tall-grass, and only locally intact where it was once short.",
      "Almost everything we photograph east of the Front Range and call 'prairie' is in fact former prairie, currently grazing land, in the early stages of a long recovery that may or may not happen. The Pawnee National Grassland is an exception, and it is photographed less than it should be.",
      "I have come, late in life, to photograph the Plains more than the mountains. They are harder. They do not give you a focal point. They make you work to see them."
    ]
  },
  {
    id: "m18", num: "M.018", cat: "land",
    title: "The Architecture of a Cirque",
    date: "Winter 2022",
    excerpt: "A cirque is the building a glacier left behind. Knowing how it was built changes what you photograph in it.",
    body: [
      "A cirque is the building a glacier left behind. The headwall is the vertical face the ice carved as it pulled away from the rock above it. The bowl is the floor the ice plucked out. The tarn, when there is one, is the puddle that filled the bowl after the ice melted.",
      "Knowing how the building was built changes what you photograph in it. The headwall is most photogenic when struck by morning light, because it was carved by light's opposite — pressure and dark. The tarn is most photogenic at dusk, because the same minerals the glacier left in it are what give the water its impossible color.",
      "I have photographed the same cirque north of Aspen four times. The fifth visit will be in the spring, when the bowl is half-full of new snow and half-full of the previous year's, and the two snows will not be the same color."
    ]
  },

  // ───────────── LOCATIONS (6) ─────────────
  {
    id: "m19", num: "M.019", cat: "locations",
    title: "Cottonwood Pass, in October",
    date: "Autumn 2024",
    img: "/assets/hero-zion.jpg",
    excerpt: "Cottonwood is the pass I have driven the most often, the one I know the best, and — by a considerable margin — the one I have failed at the most.",
    body: [
      "Cottonwood is the pass I have driven the most often, the one I know the best, and — by a considerable margin — the one I have failed at the most. The road tops out at 12,126 feet, the air is thin enough to slow you down by a third, and the light at the summit is, on most days, unreasonably good.",
      "And yet for thirty-two of my fifty years I made no photograph of Cottonwood that I would defend. The pass is geographically generous and photographically demanding. It gives you everything and then expects you to choose.",
      "The Mount Yale plate from 2023, the one that became the centerpiece of the new book, was made about a mile and a half east of the summit, on a service spur most drivers never notice. The light lasted thirty-eight seconds. I had been visiting the spot for nine autumns. That is, I think, the right ratio."
    ]
  },
  {
    id: "m20", num: "M.020", cat: "locations",
    title: "Independence, A Long Romance",
    date: "Spring 2024",
    excerpt: "Independence Pass is the second pass in Colorado that you should fail at for a decade before you have the right to photograph it.",
    body: [
      "Independence is the second pass in Colorado that you should fail at for a decade before you have the right to photograph it. Cottonwood is the first. After those two, the rest of the passes will let you in.",
      "The road over Independence has been there since 1881, in one form or another, and the photographs that have been made of it are largely indistinguishable from one another. The summit pull-off, in particular, has produced what may be the most photographed and least successful set of postcards in the state.",
      "The pass is best photographed in the four miles between the summit and Twin Lakes, in the half-hour before the light hits the road, from one of the unsigned turnouts most tourists do not see. The Independence Mine ruin is best ignored. It is a popular subject because it is convenient. It is, photographically, almost a cliché."
    ]
  },
  {
    id: "m21", num: "M.021", cat: "locations",
    title: "Zion in the Off-Season",
    date: "Winter 2023",
    img: "/assets/about-zion.jpg",
    excerpt: "Zion in November is a different park. The cottonwoods have gone gold. The river is glass. The shuttle is not running. The famous overlooks are nearly empty.",
    body: [
      "Zion in November is a different park. The cottonwoods have gone gold and dropped half their leaves. The river is glass. The shuttle is not running. The famous overlooks are nearly empty by mid-afternoon, and the canyon is doing the kind of late-fall work — long shadows, low sun, deep cold pockets — that the summer canyon is incapable of.",
      "The trade-off is light. You have about eight hours of usable light per day, and the best of it is in two narrow windows at the ends. You have to plan a four-day trip as eight separate two-hour photo sessions and accept that the hours in between are for walking, eating, and sleeping in the truck.",
      "I have been making the November Zion trip almost every year since 1997. It is the only place outside Colorado I keep returning to, and it is the only place I am willing to make the seven-hour drive for without a guaranteed photograph at the end."
    ]
  },
  {
    id: "m22", num: "M.022", cat: "locations",
    title: "The Flatirons from Below",
    date: "Summer 2023",
    excerpt: "The Flatirons are most often photographed from the meadows below them, in summer, near sunset. There is a reason. There is also, occasionally, an alternative.",
    body: [
      "The Flatirons are most often photographed from the meadows below them, in summer, near sunset, with a foreground of paintbrush or grass. There is a reason for this — the light hits the west-facing rock at exactly the wrong angle in the morning and exactly the right one at dusk, and the meadows are public land.",
      "There is also, occasionally, an alternative. In late winter, after a storm, the Flatirons collect snow on their north-facing ledges and almost nowhere else. The result is a striped landscape no other configuration of light and weather produces, and it lasts about six hours before the wind redistributes it.",
      "Living in Boulder has meant photographing the same rocks for fifty years from a distance of about three miles. They are the only mountains I know in this way, and the only ones I am still surprised by."
    ]
  },
  {
    id: "m23", num: "M.023", cat: "locations",
    title: "Red Mountain Pass, in February",
    date: "Winter 2023",
    excerpt: "Red Mountain Pass in February is the most dangerous and most rewarding drive in the state. I have done it fifty-three times. Half of those, I would not do again.",
    body: [
      "Red Mountain in February is the most dangerous and most rewarding drive in the state. The highway department closes it more often than they admit, the avalanche paths cross the road at six known points, and the views from the upper switchbacks are, on a clear winter morning, almost unreasonable.",
      "I have done the pass in February fifty-three times since 1989. Half of those trips, looking back, I would not do again. The other half produced about a quarter of the winter work in the new book, and one photograph I am willing to defend without reservation: a single pine in deep snow, made on a turnout most maps do not show, on a morning when the road was officially closed and I was officially not there.",
      "I do not recommend the trip. I do not regret a single one of them."
    ]
  },
  {
    id: "m24", num: "M.024", cat: "locations",
    title: "Notes from the Roan Plateau",
    date: "Autumn 2022",
    excerpt: "The Roan is the second-least-photographed major landform in the state. Probably because the road in is not paved.",
    body: [
      "The Roan is, by my own informal count, the second-least-photographed major landform in Colorado. Probably because the road in is not paved, the gas industry has been working the area for thirty years, and the access — for a non-resident, in any season other than late summer — is genuinely difficult.",
      "It is also some of the most quietly beautiful terrain in the state. Long sandstone benches, deep canyons cut into them, and a sky that does the kind of unobstructed work the high country never lets it do. The wildlife is plentiful and largely unbothered. I have seen more elk on the Roan in two visits than in two seasons on the Front Range.",
      "I am writing about it here against my own self-interest. I will be sorrier if it becomes photographed than I am at the prospect that it stays nearly unknown."
    ]
  },

  // ───────────── WILDERNESS (6) ─────────────
  {
    id: "m25", num: "M.025", cat: "wilderness",
    title: "On Solitude, Working Alone",
    date: "Autumn 2024",
    excerpt: "I have worked almost entirely alone for fifty years. The first ten of those years I thought this was a deficiency. The next thirty I came to understand as a method.",
    body: [
      "I have worked almost entirely alone for fifty years — first by accident, then by preference, eventually by what I would now call method. The first ten of those years I thought working alone was a deficiency. The next thirty I came to understand as the principal reason any of the photographs are any good.",
      "Photography in company is conversation interrupted by photography. Photography alone is photography interrupted, occasionally, by attention to the body's quiet needs. The composition gets ten times the time. The light gets all of it.",
      "I have known very few good landscape photographers who worked well with companions. I have known several mediocre ones who did. It is, in the end, a temperamental sorting."
    ]
  },
  {
    id: "m26", num: "M.026", cat: "wilderness",
    title: "The Bear at Cottonwood",
    date: "Summer 2024",
    excerpt: "In September of 2014 a black bear walked across my composition on Cottonwood Pass. I made the photograph. I do not show it to anyone.",
    body: [
      "In September of 2014, on a service spur about a mile and a half east of the Cottonwood summit — the same spur, as it turns out, that produced the Yale plate nine years later — a black bear walked into my composition, stopped, looked directly at the lens, and walked out.",
      "I made the photograph. The exposure was good. The bear is sharp, the light is on his face, and you can see his breath. I do not show the photograph to anyone, and I do not intend to publish it. The bear was wild, the place is the kind of place a bear can still be wild in, and the photograph would, if I published it, make that place slightly less wild.",
      "There is, I think, a small ethics to landscape work that is rarely discussed: the photograph is not always the right outcome. I have a drawer of these decisions. The drawer is one of the most important parts of my work."
    ]
  },
  {
    id: "m27", num: "M.027", cat: "wilderness",
    title: "What We Carry Out",
    date: "Summer 2024",
    excerpt: "I have carried more film, gear, lunch, and water out of the backcountry than into it. The first time I did so was an accident. Every time since has been a deliberate practice.",
    body: [
      "I have carried more film, gear, lunch, and water out of the backcountry than I ever carried in. The first time this happened, in 1988 on the Lost Man Loop, it was an accident — somebody had left half a roll of Kodachrome and an apple core on a rock. I picked them up because I felt embarrassed for whoever had left them.",
      "Every time since has been deliberate. I carry an empty bag in. I carry a full one out. On a long day on the Roan in 2017 I picked up nine glass bottles, four shotgun shells, and a deflated weather balloon. None of it was mine. All of it became mine for the four-mile walk to the truck.",
      "If you are not willing to leave the place better than you found it, you are not really working there. You are visiting."
    ]
  },
  {
    id: "m28", num: "M.028", cat: "wilderness",
    title: "A Defense of the Quiet Trail",
    date: "Spring 2024",
    excerpt: "Half of what I have photographed in fifty years was made within four miles of the nearest road. The famous wildernesses are largely overrated. The quiet trail next door is largely under-loved.",
    body: [
      "Half of what I have photographed in fifty years was made within four miles of the nearest road. Not because I am unwilling to walk farther — I have walked farther many times — but because the four-mile radius around any decent trailhead in Colorado contains more photographable terrain than a working photographer can exhaust in a lifetime.",
      "The famous wildernesses — the Maroon Bells–Snowmass, the Indian Peaks, the Holy Cross — are largely overrated for the photographer, and not because they are not beautiful but because they have been photographed by everyone. The quiet trail next door, the one without a name on the map, the one that ends at an unsigned overlook, is the one that has not.",
      "I will not name any of these trails."
    ]
  },
  {
    id: "m29", num: "M.029", cat: "wilderness",
    title: "On Conservation, Briefly",
    date: "Autumn 2023",
    excerpt: "Photography of wild land is, whether we like it or not, advocacy for wild land. The question is what kind of advocacy.",
    body: [
      "Photography of wild land is, whether the photographer likes it or not, advocacy for wild land. The question is not whether to be an advocate but what kind of advocate to be. There are two extremes, both of which I have practiced and neither of which I would now defend.",
      "The first is the over-pretty photograph — the one that makes a place look so unreasonably beautiful that the viewer feels the place is already taken care of and requires no further attention. The second is the documentary photograph that records a degradation — the cut, the mine, the spill — in a way that mostly produces despair.",
      "Somewhere between these is the photograph that lets the place be exactly what it is, in the exact light and weather it happens to be in, on the day a particular photographer happened to be standing there. That is the photograph the place itself, if it had a vote, would prefer."
    ]
  },
  {
    id: "m30", num: "M.030", cat: "wilderness",
    title: "The Wild Horse, Late Winter",
    date: "Winter 2023",
    img: "/assets/horses-snow.jpg",
    excerpt: "There are an estimated seven hundred wild horses on the northern Colorado range. I have photographed two bands. Both photographs took years.",
    body: [
      "There are an estimated seven hundred wild horses on the northern Colorado range — descendants of escaped or released ranch stock, technically feral, locally controversial, and almost entirely uncontacted by photographers. I have photographed two bands. Both photographs took years.",
      "The horses do not want to be photographed. They do not want to be near you. The closest I have ever stood to a wild band was three hundred yards, downwind, in a snowstorm that obscured both me and them, and the resulting frame — eight dark shapes moving through pale grass and falling snow — is one of the photographs I am still surprised by.",
      "I do not publish the GPS coordinates of where it was made. I would, if pressed, not even publish the county. The photograph is a record of the horses; the photograph is not an invitation to find them."
    ]
  },
];

export function getMusing(id: string): Musing | undefined {
  return MUSINGS.find((m) => m.id === id);
}

export function getMusingNeighbors(id: string): { prev: Musing; next: Musing } | undefined {
  const idx = MUSINGS.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;
  return {
    prev: MUSINGS[(idx - 1 + MUSINGS.length) % MUSINGS.length],
    next: MUSINGS[(idx + 1) % MUSINGS.length],
  };
}
