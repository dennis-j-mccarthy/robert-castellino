export type Photo = {
  img: string;
  title: string;
  loc: string;
  blurb: string;
};

export type Collection = {
  slug: string;
  label: string;
  intro: string;
  photos: Photo[];
};

export const COLLECTIONS: Collection[] = [
  // ───────────── WATERFALLS ─────────────
  {
    slug: "waterfalls",
    label: "Waterfalls",
    intro:
      "Long exposures, cold mornings, and the patience to wait for the river to do its work.",
    photos: [
      {
        img: "/assets/collections/waterfalls/cascade-creek-falls-gore-range.jpg",
        title: "Cascade Creek Falls",
        loc: "Gore Range, CO",
        blurb:
          "A short walk in, a long wait at the bottom. The light through the spruce was the photograph, not the water.",
      },
      {
        img: "/assets/collections/waterfalls/havasu-creek-cascade.jpg",
        title: "Havasu Creek Cascade",
        loc: "Havasupai, AZ",
        blurb:
          "The water carries calcium carbonate; the calcium carbonate carries the color. The cascades belong to the chemistry as much as to the rock.",
      },
      {
        img: "/assets/collections/waterfalls/havasu-sunrise.jpg",
        title: "Havasu, Sunrise",
        loc: "Havasupai, AZ",
        blurb:
          "Ten miles in, an early start, and a window of light that opens for about eleven minutes a year. This was one of them.",
      },
      {
        img: "/assets/collections/waterfalls/latorell-falls-columbia-gorge.jpg",
        title: "Latourell Falls",
        loc: "Columbia River Gorge, OR",
        blurb:
          "Two hundred and twenty-four feet of falling water and a basalt cliff that has been waiting underneath it for fifteen million years.",
      },
      {
        img: "/assets/collections/waterfalls/latorell-falls-v-r.jpg",
        title: "Latourell Falls, Vertical",
        loc: "Columbia River Gorge, OR",
        blurb:
          "A second visit, a vertical frame, and the moss on the south wall finally lit.",
      },
      {
        img: "/assets/collections/waterfalls/mccloud-river-2nd-falls.jpg",
        title: "McCloud River, Middle Falls",
        loc: "Shasta-Trinity, CA",
        blurb:
          "The river drops three times in a mile. The middle drop is the one most photographers walk past on the way to the third.",
      },
      {
        img: "/assets/collections/waterfalls/middle-falls-mccloud-river.jpg",
        title: "McCloud River, the Middle Fall",
        loc: "Shasta-Trinity, CA",
        blurb:
          "Spring runoff, an overcast sky, and an exposure long enough to flatten the spray into a single soft sheet.",
      },
      {
        img: "/assets/collections/waterfalls/mohawk-lake-water-fall.jpg",
        title: "Mohawk Lake Falls",
        loc: "Breckenridge, CO",
        blurb:
          "Above eleven thousand feet, where the snowmelt is still ice in the shaded pockets and the falls roar for about six weeks a year.",
      },
      {
        img: "/assets/collections/waterfalls/multnomath-falls.jpg",
        title: "Multnomah Falls",
        loc: "Columbia River Gorge, OR",
        blurb:
          "The most photographed waterfall in the Northwest. I arrived at first light, before the parking lot, and had it to myself for forty minutes.",
      },
      {
        img: "/assets/collections/waterfalls/three-river-junction-hot-springs-sunrise-yellowstone.jpg",
        title: "Three Rivers Junction, Hot Springs",
        loc: "Yellowstone NP, WY",
        blurb:
          "Geothermal water meeting cold runoff at sunrise. The steam is the photograph; the rivers are the supporting cast.",
      },
      {
        img: "/assets/collections/waterfalls/travertine-steps-at-havasu-falls.jpg",
        title: "Travertine Steps, Havasu",
        loc: "Havasupai, AZ",
        blurb:
          "The mineral terraces are remade by every flood. The version photographed here lasted, I am told, about four more years.",
      },
    ],
  },

  // ───────────── REFLECTIONS ─────────────
  {
    slug: "reflections",
    label: "Reflections",
    intro:
      "Still water is the patient half of a landscape. Most of what is in these frames is also in the sky.",
    photos: [
      {
        img: "/assets/collections/reflections/carter-lake-sunrise-reflectionp1020135.jpg",
        title: "Carter Lake, Sunrise",
        loc: "Larimer County, CO",
        blurb:
          "Wind drops at first light for about eleven minutes. This frame was made in the third of them.",
      },
      {
        img: "/assets/collections/reflections/carter-lake-sunrise.jpg",
        title: "Carter Lake, Standing Light",
        loc: "Larimer County, CO",
        blurb:
          "The same lake, a different morning. The cottonwoods on the far shore are the same trees, photographed twenty years apart.",
      },
      {
        img: "/assets/collections/reflections/greenlee-pond-sunrise.jpg",
        title: "Greenlee Pond, Sunrise",
        loc: "Boulder County, CO",
        blurb:
          "A small pond most maps do not name. The sky did all the work — the pond was simply willing to repeat it.",
      },
      {
        img: "/assets/collections/reflections/maroon-bells-summer-s-end-hdsc09671.jpg",
        title: "Maroon Bells, Summer's End",
        loc: "Aspen Snowmass, CO",
        blurb:
          "An early frost, a slow lake, and the most photographed peaks in Colorado deciding, briefly, to cooperate.",
      },
      {
        img: "/assets/collections/reflections/maroon-bells-summer-s-end-v.jpg",
        title: "Maroon Bells, Vertical",
        loc: "Aspen Snowmass, CO",
        blurb:
          "Same morning, vertical frame. The reflection runs deeper than the peaks rise; the photograph is half made of water.",
      },
      {
        img: "/assets/collections/reflections/reflection-on-causway-lake-18x36-pano-rfp.jpg",
        title: "Causeway Lake, Panoramic",
        loc: "Front Range, CO",
        blurb:
          "Eighteen by thirty-six inches in print. Three exposures stitched, made in the order they were composed.",
      },
      {
        img: "/assets/collections/reflections/smith-rock-reflection.jpg",
        title: "Smith Rock, Reflection",
        loc: "Central Oregon",
        blurb:
          "The Crooked River does what its name suggests. The rock face does what the river requires.",
      },
      {
        img: "/assets/collections/reflections/tetons-reflection-jackson-lake-heart-driftwood.jpg",
        title: "Tetons, Jackson Lake",
        loc: "Grand Teton NP, WY",
        blurb:
          "A piece of heart-shaped driftwood at the foreground edge. I did not place it; I waited until the wind did.",
      },
      {
        img: "/assets/collections/reflections/walden-ponds-ii.jpg",
        title: "Walden Ponds II",
        loc: "Boulder County, CO",
        blurb:
          "Restored wetland on what used to be a gravel quarry. A reminder that some landscapes are recoverable.",
      },
      {
        img: "/assets/collections/reflections/walden-ponds-pano.jpg",
        title: "Walden Ponds, Panoramic",
        loc: "Boulder County, CO",
        blurb:
          "Three frames stitched. The cattails on the right are the same cattails on the left of the next frame.",
      },
      {
        img: "/assets/collections/reflections/walden-ponds-std-h.jpg",
        title: "Walden Ponds, Standard",
        loc: "Boulder County, CO",
        blurb:
          "A single frame, made the morning after a long night of rain. The light arrived twelve minutes late.",
      },
      {
        img: "/assets/collections/reflections/wetlands-sunrise.jpg",
        title: "Wetlands, Sunrise",
        loc: "Front Range, CO",
        blurb:
          "Five degrees and a wind that died at six fifty-two. The frame was composed at six fifty-three.",
      },
    ],
  },

  // ───────────── OCEAN, ISLANDS & SKIES ─────────────
  {
    slug: "ocean-islands-skies",
    label: "Ocean, Islands & Skies",
    intro:
      "Salt water and dark skies — the work made when the high country let me go.",
    photos: [
      {
        img: "/assets/collections/ocean-islands-skies/bat-ray-scorpion-bayp1020565.jpg",
        title: "Bat Ray, Scorpion Bay",
        loc: "Channel Islands, CA",
        blurb:
          "Three feet of water, a passing ray, and a polarizer that turned the surface into glass.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/boardwalk-to-atlantic-vero-beach-fl.jpg",
        title: "Boardwalk to the Atlantic",
        loc: "Vero Beach, FL",
        blurb:
          "An old boardwalk and a dune that has, in fifty years, moved nine yards inland.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/columbia-gorge-pano-h.jpg",
        title: "Columbia Gorge, Panoramic",
        loc: "Columbia River, OR",
        blurb:
          "The river cut through the basalt for fifteen thousand years to leave what you are looking at.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/columbia-gorge-v.jpg",
        title: "Columbia Gorge, Vertical",
        loc: "Columbia River, OR",
        blurb:
          "A vertical answer to the panoramic — the sky doing the work the river usually claims.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/crab-in-sand.jpg",
        title: "Crab in Sand",
        loc: "Pacific Coast",
        blurb:
          "Three inches across. The composition is what the crab decided.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/el-arco-and-play-del-amor-sunrise.jpg",
        title: "El Arco at Sunrise",
        loc: "Cabo San Lucas, MX",
        blurb:
          "The famous arch, the famous beach, photographed at the only hour they are willing to be photographed without a crowd.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/lone-leaf-in-sand.jpg",
        title: "Lone Leaf in Sand",
        loc: "Pacific Coast",
        blurb:
          "A leaf the tide put down. The frame is the time between the tide putting it there and the wind taking it away.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/milky-way-across-the-sky-haleakala.jpg",
        title: "Milky Way, Haleakalā",
        loc: "Maui, HI",
        blurb:
          "Ten thousand feet up, no moon, twenty-five seconds. Most of what is in the frame is older than the mountain.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/milky-way-over-haleakala-observatory.jpg",
        title: "Milky Way over the Observatory",
        loc: "Haleakalā, HI",
        blurb:
          "The observatories look up; the photograph looks at them looking. A small frame of human attention against a much larger one.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/potato-harbor-sunset.jpg",
        title: "Potato Harbor, Sunset",
        loc: "Santa Cruz Island, CA",
        blurb:
          "A two-mile walk from the dock. The last ferry leaves at four; the light was made at six forty-one.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/princeville-overlook-kauiaimgp7756-dxo.jpg",
        title: "Princeville Overlook",
        loc: "Kauai, HI",
        blurb:
          "Hanalei Bay from above. The rain on the windward side made the frame; the lee side gave me the light.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/skiff-hanalei-harbor.jpg",
        title: "Skiff, Hanalei Harbor",
        loc: "Kauai, HI",
        blurb:
          "One boat, one rope, and a tide that turned during the exposure.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/star-fish-tide-pool-henry-s-beach.jpg",
        title: "Starfish, Tide Pool",
        loc: "Henry's Beach, Santa Barbara, CA",
        blurb:
          "Low tide on a clear morning. The starfish was the third I checked. The light was on the second.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/sunset-at-henry-s-beach-sb.jpg",
        title: "Sunset, Henry's Beach",
        loc: "Santa Barbara, CA",
        blurb:
          "The cliff behind me holds about fifteen minutes of last light. This was made in the eleventh of them.",
      },
      {
        img: "/assets/collections/ocean-islands-skies/tide-pools-to-heaven-henry-s-beach.jpg",
        title: "Tide Pools to Heaven",
        loc: "Henry's Beach, Santa Barbara, CA",
        blurb:
          "A long exposure of the receding tide. The pools held the sky long enough to be looked at twice.",
      },
    ],
  },

  // ───────────── NATIONAL PARKS ─────────────
  {
    slug: "national-parks",
    label: "National Parks",
    intro:
      "The places everyone has heard of, photographed at the hours and seasons most of us are somewhere else.",
    photos: [
      {
        img: "/assets/collections/national-parks/anderson-hole-yampa.jpg",
        title: "Anderson Hole, Yampa",
        loc: "Dinosaur NM, CO/UT",
        blurb:
          "The Yampa is the last undammed major river in the Colorado system. The light there knows it.",
      },
      {
        img: "/assets/collections/national-parks/aspen-in-the-mist-rmnp.jpg",
        title: "Aspen in the Mist",
        loc: "Rocky Mountain NP, CO",
        blurb:
          "A cold front, a warm valley, and a half hour when the trees looked like they were standing in their own breath.",
      },
      {
        img: "/assets/collections/national-parks/bryce-canyon-sunrise-pt-ii.jpg",
        title: "Bryce, Sunrise Point II",
        loc: "Bryce Canyon NP, UT",
        blurb:
          "A second composition from the same overlook. The hoodoos are different photographs at every five degrees of azimuth.",
      },
      {
        img: "/assets/collections/national-parks/bryce-canyon-sunrise-pt-sunset.jpg",
        title: "Bryce, Sunset Point at Sunrise",
        loc: "Bryce Canyon NP, UT",
        blurb:
          "The light at Sunset Point is, in winter, best in the morning. The naming was done by surveyors, not by photographers.",
      },
      {
        img: "/assets/collections/national-parks/bryce-canyon-sunrise-winter.jpg",
        title: "Bryce in Winter, Sunrise",
        loc: "Bryce Canyon NP, UT",
        blurb:
          "Snow on the hoodoos for about eleven days a year. This was one of them.",
      },
      {
        img: "/assets/collections/national-parks/cliff-palace-mesa-verde-sw-vw.jpg",
        title: "Cliff Palace",
        loc: "Mesa Verde NP, CO",
        blurb:
          "Eight hundred years of stonework. The photograph is sixty seconds.",
      },
      {
        img: "/assets/collections/national-parks/delicate-arch-in-fog.jpg",
        title: "Delicate Arch in Fog",
        loc: "Arches NP, UT",
        blurb:
          "The arch is photographed eleven thousand times a year. Fog removes the eleven thousand and leaves the arch.",
      },
      {
        img: "/assets/collections/national-parks/dream-lake-reflection-clouds.jpg",
        title: "Dream Lake",
        loc: "Rocky Mountain NP, CO",
        blurb:
          "A short hike, an early start, and a lake that earns its name about three mornings a season.",
      },
      {
        img: "/assets/collections/national-parks/fall-colors-water-knob-ridge-smoky-mtn-ntl-pk.jpg",
        title: "Fall Colors, Water Knob",
        loc: "Great Smoky Mountains NP, TN/NC",
        blurb:
          "The Smokies do something Colorado cannot: they put red, orange, and yellow on the same ridgeline.",
      },
      {
        img: "/assets/collections/national-parks/half-dome-glacier-point-sunrise-h-wro.jpg",
        title: "Half Dome from Glacier Point",
        loc: "Yosemite NP, CA",
        blurb:
          "The Ansel Adams view, made on a morning when the dome was lit and the valley was not.",
      },
      {
        img: "/assets/collections/national-parks/hiking-park-ave-flowers-sureal.jpg",
        title: "Park Avenue, Wildflowers",
        loc: "Arches NP, UT",
        blurb:
          "Spring on the slickrock. The flowers last six days; the slickrock has been there one hundred and fifty million years.",
      },
      {
        img: "/assets/collections/national-parks/hoodoos-sunrise-point-winter-bryce.jpg",
        title: "Hoodoos in Winter",
        loc: "Bryce Canyon NP, UT",
        blurb:
          "The snow stays on the north faces and not on the south. The shadow is half the photograph.",
      },
      {
        img: "/assets/collections/national-parks/kiva-at-mesa-verde.jpg",
        title: "Kiva, Mesa Verde",
        loc: "Mesa Verde NP, CO",
        blurb:
          "A round stone room. The Ancestral Puebloans understood light from below; the photograph is borrowed from them.",
      },
      {
        img: "/assets/collections/national-parks/klondike-buttes-canyon-lands-ntl-park.jpg",
        title: "Klondike Buttes",
        loc: "Canyonlands NP, UT",
        blurb:
          "A long dirt road, a longer wait, and a band of last light that crossed the buttes in under two minutes.",
      },
      {
        img: "/assets/collections/national-parks/mesa-arch-winter-sunrise-ii-v.jpg",
        title: "Mesa Arch, Winter, Vertical",
        loc: "Canyonlands NP, UT",
        blurb:
          "The arch holds about ninety seconds of fire-orange underglow before the sun clears it. Vertical frame, second visit.",
      },
      {
        img: "/assets/collections/national-parks/mesa-arch-winter-sunrise-ii.jpg",
        title: "Mesa Arch, Winter",
        loc: "Canyonlands NP, UT",
        blurb:
          "Horizontal frame, same morning. The other photographers had left an hour earlier for breakfast.",
      },
      {
        img: "/assets/collections/national-parks/park-avenue-canyonlands-natl-park.jpg",
        title: "Park Avenue",
        loc: "Arches NP, UT",
        blurb:
          "The walk between the walls is the photograph; the walls are simply doing their job.",
      },
      {
        img: "/assets/collections/national-parks/queens-garden-at-bryce-canyon.jpg",
        title: "Queen's Garden",
        loc: "Bryce Canyon NP, UT",
        blurb:
          "Down into the canyon, then back up. The light at the bottom is the light at the top, half an hour late.",
      },
      {
        img: "/assets/collections/national-parks/queens-garden-trail.jpg",
        title: "Queen's Garden Trail",
        loc: "Bryce Canyon NP, UT",
        blurb:
          "The trail itself, made in late morning when the shadows are short and the rock is honest.",
      },
      {
        img: "/assets/collections/national-parks/reflecting-pool-zion.jpg",
        title: "Reflecting Pool, Zion",
        loc: "Zion NP, UT",
        blurb:
          "The Virgin River doing what rivers do, photographed at the only hour the canyon walls allow.",
      },
      {
        img: "/assets/collections/national-parks/ridge-water-knob-pano.jpg",
        title: "Water Knob Ridge, Panoramic",
        loc: "Great Smoky Mountains NP, TN/NC",
        blurb:
          "Five frames stitched. The blue ridges are atmosphere, not paint; the haze is the park's namesake.",
      },
      {
        img: "/assets/collections/national-parks/rim-trail-fairyland-bryce-canyon.jpg",
        title: "Rim Trail, Fairyland",
        loc: "Bryce Canyon NP, UT",
        blurb:
          "Fairyland is the least crowded section of the rim. There is a reason; the photograph is the reason.",
      },
      {
        img: "/assets/collections/national-parks/turret-arch-through-north-window-arch-winter.jpg",
        title: "Turret Arch through North Window",
        loc: "Arches NP, UT",
        blurb:
          "An arch framed by an arch. Photographed in winter, when the second arch is empty of tourists.",
      },
      {
        img: "/assets/collections/national-parks/virgin-river-zion-reflect-pools-trail.jpg",
        title: "Virgin River, Reflect Pools",
        loc: "Zion NP, UT",
        blurb:
          "The trail to the Emerald Pools, photographed below them — where the water has already done its falling.",
      },
      {
        img: "/assets/collections/national-parks/water-knob-road-smoky-mtn-ntl-pk.jpg",
        title: "Water Knob Road",
        loc: "Great Smoky Mountains NP, TN/NC",
        blurb:
          "A road that turns east and then south, photographed at the turn.",
      },
      {
        img: "/assets/collections/national-parks/zion-mid-pool-sunset-h.jpg",
        title: "Mid Pool, Sunset",
        loc: "Zion NP, UT",
        blurb:
          "The middle pool of the Emerald Pools at last light. The cliff behind it is in red; the water is in blue.",
      },
      {
        img: "/assets/collections/national-parks/zion-mid-reflect-pool-vista-h.jpg",
        title: "Mid Pool, Reflecting Vista",
        loc: "Zion NP, UT",
        blurb:
          "Same pool, different hour. The cliff is doing the same work; only the light is moving.",
      },
    ],
  },

  // ───────────── LIMITED EDITION POSTERS ─────────────
  {
    slug: "limited-edition-posters",
    label: "Limited Edition Posters",
    intro:
      "The poster series — twenty plates pulled from the larger archive and offered in editioned 24×36 inch prints.",
    photos: [
      {
        img: "/assets/collections/limited-edition-posters/lep1-autumn-maroon-bells-print-v-24x36.jpg",
        title: "Autumn, Maroon Bells",
        loc: "Aspen Snowmass, CO",
        blurb:
          "The classic vertical of the Bells in fall — the plate that opens the poster series.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep4-maroon-pyramid-peak-h-24x36-dxo.jpg",
        title: "Maroon & Pyramid",
        loc: "Aspen Snowmass, CO",
        blurb:
          "Two peaks, one frame, and the air between them lit for under a minute.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep5-maroon-pyramid-peak-v-24x36-dxo.jpg",
        title: "Maroon & Pyramid, Vertical",
        loc: "Aspen Snowmass, CO",
        blurb:
          "Same peaks, vertical frame. The sky above them is the third subject.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep6-flatirons-in-winter-mist-h.jpg",
        title: "Flatirons in Winter Mist",
        loc: "Boulder, CO",
        blurb:
          "A morning when the fog held the lower meadow and the sun cleared the rock above it.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep7-hl-sparkling-water-h.jpg",
        title: "Hanging Lake, Sparkling Water",
        loc: "Glenwood Canyon, CO",
        blurb:
          "The travertine deposits make the water as photogenic as the cliff behind it. A short hike, a long composition.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep8-behind-falls-hanging-lake.jpg",
        title: "Behind the Falls",
        loc: "Hanging Lake, CO",
        blurb:
          "Standing behind the curtain of water — the photograph the postcards leave out.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep9-lone-pine-red-mtn-pass-h-24x36.jpg",
        title: "Lone Pine, Horizontal",
        loc: "Red Mountain Pass, CO",
        blurb:
          "A horizontal frame of the same pine I have photographed for six winters. The composition arrived in the seventh.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep9-old-mine-red-mtn-pass-v.jpg",
        title: "Old Mine, Red Mountain Pass",
        loc: "Red Mountain Pass, CO",
        blurb:
          "An abandoned mine head, photographed in the same hour as the lone pine. The pass holds more than one photograph.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep10-lone-pine-red-mtn-pass-v-24x36.jpg",
        title: "Lone Pine, Vertical",
        loc: "Red Mountain Pass, CO",
        blurb:
          "The vertical companion. Same tree, same hour, different argument.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep11-eve-deer-rmnp-trail-ridge-h.jpg",
        title: "Evening Deer, Trail Ridge",
        loc: "Rocky Mountain NP, CO",
        blurb:
          "Twelve thousand feet, last light, and a herd that paused long enough for one exposure.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep12-lake-isabelle-potentilla-v24x36.jpg",
        title: "Lake Isabelle, Potentilla",
        loc: "Indian Peaks, CO",
        blurb:
          "Yellow shrub-cinquefoil at the foreground edge. Six feet from the camera, doing all the work.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep13-lake-isabelle-potentilla-h.jpg",
        title: "Lake Isabelle, Horizontal",
        loc: "Indian Peaks, CO",
        blurb:
          "The horizontal answer. The same flowers, photographed from one step to the right.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep13-sunrise-at-devils-thumb-pass-h-24s36-dxo.jpg",
        title: "Devil's Thumb Pass, Sunrise",
        loc: "Indian Peaks, CO",
        blurb:
          "The thumb of granite the pass is named for, lit first because it sits highest.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep14-wetlands-sunrise-24x36.jpg",
        title: "Wetlands Sunrise",
        loc: "Front Range, CO",
        blurb:
          "A small wetland east of the Front Range. The sky is the photograph; the water repeats it.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep15-rainbow-over-dallas-divide-h.jpg",
        title: "Rainbow over Dallas Divide",
        loc: "San Juan Mountains, CO",
        blurb:
          "A rainbow lasts about three minutes; the wait was four hours. The arithmetic of this work, on a typical day.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep16-yankee-boy-basin-v-24x36-dxo.jpg",
        title: "Yankee Boy Basin",
        loc: "San Juan Mountains, CO",
        blurb:
          "Twelve thousand feet of wildflowers, in a basin that opens for about three weeks each summer.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep17-yankee-boy-basin-h-24x36-dxo.jpg",
        title: "Yankee Boy Basin, Horizontal",
        loc: "San Juan Mountains, CO",
        blurb:
          "The horizontal frame — the basin's full width and the peaks above it.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep18-spring-flatirons-h-24x36-dxo.jpg",
        title: "Spring Flatirons",
        loc: "Boulder, CO",
        blurb:
          "The meadow in green, the rock in red, and the sky doing the editing.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep-19road-less-traveled-24x36.jpg",
        title: "Road Less Traveled",
        loc: "Colorado",
        blurb:
          "A dirt road on a high mesa, photographed from where the road ends. The title is honest, for once.",
      },
      {
        img: "/assets/collections/limited-edition-posters/lep20-wave-creature-big-beach-maui-sunset-dxo.jpg",
        title: "Wave, Big Beach",
        loc: "Maui, HI",
        blurb:
          "A single wave at last light. The shape arrived for the duration of a thirtieth of a second.",
      },
    ],
  },
];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
