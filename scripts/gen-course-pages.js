#!/usr/bin/env node
/**
 * TrackPass — programmatic SEO course page generator
 * Generates /courses/[city-slug]/[course-slug]/index.html for each confirmed TX public course.
 * Data accuracy rule: only confirmed real courses, no fabricated details.
 */
const fs = require('fs');
const path = require('path');

const STRIPE_LINK = 'https://buy.stripe.com/5kQ28r7vmbGP0SW11p2Ji00';
const SITE_URL = 'https://trackpassgolf.com';

const COURSES = [
  // ── Austin ──
  { id:'austin-lions-muny', name:'Lions Municipal Golf Course', city:'Austin', state:'TX', citySlug:'austin-tx', slug:'lions-municipal', type:'Municipal', fee:35, blurb:"Austin's first public course, opened in 1924 and a Texas historic landmark. Walkable and beloved, Lions Muny sits right in West Austin and is one of the most storied municipal layouts in the state." },
  { id:'austin-morris-williams', name:'Morris Williams Golf Course', city:'Austin', state:'TX', citySlug:'austin-tx', slug:'morris-williams', type:'Municipal', fee:38, blurb:"A local favorite muni with a unique routing and stunning views of the downtown Austin skyline. Morris Williams offers a great combination of challenge and character for everyday golfers." },
  { id:'austin-roy-kizer', name:'Roy Kizer Golf Course', city:'Austin', state:'TX', citySlug:'austin-tx', slug:'roy-kizer', type:'Municipal', fee:42, blurb:"Austin's premier links-style municipal course — open, breezy, and a great walk in South Austin. Roy Kizer's wide fairways and firm conditions reward creative shotmaking." },
  { id:'austin-jimmy-clay', name:'Jimmy Clay Golf Course', city:'Austin', state:'TX', citySlug:'austin-tx', slug:'jimmy-clay', type:'Municipal', fee:34, blurb:"Shares a campus with Roy Kizer in South Austin, making this an easy add for a 36-hole day. Jimmy Clay is an accessible, well-maintained muni that plays well for all skill levels." },
  { id:'austin-riverside', name:'Riverside Golf Course', city:'Austin', state:'TX', citySlug:'austin-tx', slug:'riverside', type:'Municipal', fee:30, blurb:"East-of-downtown Austin muni where Texas legends Ben Crenshaw and Tom Kite first learned the game. Riverside is a piece of Texas golf history and one of the most affordable rounds in the city." },
  { id:'austin-hancock', name:'Hancock Golf Course', city:'Austin', state:'TX', citySlug:'austin-tx', slug:'hancock', type:'Municipal', fee:18, holes:9, blurb:"The oldest golf course in Texas, dating to 1899. This quirky, walkable nine-holer in central Austin is a must-play for golf history buffs — and at $18, it's the best deal in Austin." },
  // ── San Antonio ──
  { id:'sa-brackenridge', name:'Brackenridge Park Golf Course', city:'San Antonio', state:'TX', citySlug:'san-antonio-tx', slug:'brackenridge-park', type:'Municipal', fee:50, blurb:"The oldest 18-hole public golf course in Texas, opened in 1916 and designed along the San Antonio River. Brackenridge Park hosted the 1922 Texas Open — the very first PGA Tour event played in the state of Texas." },
  { id:'sa-cedar-creek', name:'Cedar Creek Golf Course', city:'San Antonio', state:'TX', citySlug:'san-antonio-tx', slug:'cedar-creek', type:'Municipal', fee:55, blurb:"Renovated and reopened in 2024, Cedar Creek is now one of the most challenging municipal layouts in Texas at 7,158 yards. Located on the northwest side, it's a serious test for low-handicappers." },
  { id:'sa-mission-del-lago', name:'Mission del Lago Golf Course', city:'San Antonio', state:'TX', citySlug:'san-antonio-tx', slug:'mission-del-lago', type:'Municipal', fee:40, blurb:"A well-priced South Side muni on the Alamo City Golf Trail. Mission del Lago is the most accessible municipal course for golfers coming from the south end of San Antonio." },
  { id:'sa-olmos-basin', name:'Olmos Basin Golf Course', city:'San Antonio', state:'TX', citySlug:'san-antonio-tx', slug:'olmos-basin', type:'Municipal', fee:40, blurb:"One of San Antonio's most popular municipal courses, Olmos Basin has been a local favorite since 1963. Located just north of downtown off Highway 281, it's oak-lined, walkable, and consistently well-maintained." },
  { id:'sa-northern-hills', name:'Northern Hills Golf Course', city:'San Antonio', state:'TX', citySlug:'san-antonio-tx', slug:'northern-hills', type:'Municipal', fee:35, blurb:"Part of the city-run Alamo City Golf Trail, Northern Hills offers affordable golf on San Antonio's north side. A solid everyday track for local players looking to get out without breaking the bank." },
  { id:'sa-riverside', name:'Riverside Golf Course', city:'San Antonio', state:'TX', citySlug:'san-antonio-tx', slug:'riverside', type:'Municipal', fee:38, blurb:"Located just south of downtown San Antonio, Riverside features a full 18-hole championship layout alongside a 9-hole par-3 course — making it a great option for golfers of every skill level." },
  { id:'sa-willow-springs', name:'Willow Springs Golf Course', city:'San Antonio', state:'TX', citySlug:'san-antonio-tx', slug:'willow-springs', type:'Municipal', fee:42, blurb:"A historically significant Alamo City Golf Trail course on the east side of San Antonio — tree-lined fairways, classic design, and consistently good conditions make Willow Springs worth the drive." },
  // ── Dallas ──
  { id:'dal-cedar-crest', name:'Cedar Crest Golf Course', city:'Dallas', state:'TX', citySlug:'dallas-tx', slug:'cedar-crest', type:'Municipal', fee:35, blurb:"A historic 1916 A.W. Tillinghast design in south Dallas — one of the oldest municipal courses in Texas. Cedar Crest has a classic feel and mature tree-lined layout that rewards course management." },
  { id:'dal-keeton-park', name:'Keeton Park Golf Course', city:'Dallas', state:'TX', citySlug:'dallas-tx', slug:'keeton-park', type:'Municipal', fee:35, blurb:"Well-maintained east Dallas muni offering an honest, playable layout for golfers at every skill level. Keeton Park is a reliable everyday track with good greens and a welcoming atmosphere." },
  { id:'dal-luna-vista', name:'Luna Vista Golf Course', city:'Dallas', state:'TX', citySlug:'dallas-tx', slug:'luna-vista', type:'Municipal', fee:32, blurb:"Situated along the Elm Fork in northwest Dallas (formerly known as L.B. Houston), Luna Vista is flat, walkable, and among the most affordable Dallas munis. Great for a quick weekday round." },
  { id:'dal-stevens-park', name:'Stevens Park Golf Course', city:'Dallas', state:'TX', citySlug:'dallas-tx', slug:'stevens-park', type:'Municipal', fee:40, blurb:"A 1924 classic in southwest Dallas with tree-lined fairways, dramatic elevation changes, and stunning views of the downtown skyline. Stevens Park is one of the most scenic municipal courses in North Texas." },
  { id:'dal-tenison-glen', name:'Tenison Glen Golf Course', city:'Dallas', state:'TX', citySlug:'dallas-tx', slug:'tenison-glen', type:'Municipal', fee:40, blurb:"One of two 18-hole courses at Tenison Park in east Dallas. The Glen layout offers a traditional muni experience with solid conditions and competitive pricing, just minutes from downtown." },
  { id:'dal-tenison-highlands', name:'Tenison Highlands Golf Course', city:'Dallas', state:'TX', citySlug:'dallas-tx', slug:'tenison-highlands', type:'Municipal', fee:45, blurb:"The redesigned championship layout at Tenison Park — 7,100 yards of modern municipal golf, ten minutes from downtown Dallas. The Highlands is among the best-conditioned public courses in DFW." },
  // ── Fort Worth ──
  { id:'fw-pecan-valley-river', name:'Pecan Valley Golf Course — River', city:'Fort Worth', state:'TX', citySlug:'fort-worth-tx', slug:'pecan-valley-river', type:'Municipal', fee:40, blurb:"The 'River' layout at Pecan Valley is widely regarded as one of the best municipal courses in Texas. Stretching 6,600 yards along the Trinity River, it combines natural beauty with a genuine challenge." },
  { id:'fw-pecan-valley-hills', name:'Pecan Valley Golf Course — Hills', city:'Fort Worth', state:'TX', citySlug:'fort-worth-tx', slug:'pecan-valley-hills', type:'Municipal', fee:35, blurb:"The 'Hills' layout at Pecan Valley pairs with the River course to give golfers 36 holes of City of Fort Worth golf. Slightly shorter and added in 1982, it's a great complement to the River layout." },
  { id:'fw-rockwood-park', name:'Rockwood Park Golf Course', city:'Fort Worth', state:'TX', citySlug:'fort-worth-tx', slug:'rockwood-park', type:'Municipal', fee:35, blurb:"Fully renovated in 2017, Rockwood now stretches 7,053 yards with four tee options — from beginner-friendly to championship. One of the most updated municipal facilities in the Dallas–Fort Worth area." },
  { id:'fw-meadowbrook', name:'Meadowbrook Golf Course', city:'Fort Worth', state:'TX', citySlug:'fort-worth-tx', slug:'meadowbrook', type:'Municipal', fee:28, blurb:"A John Bredemus original from 1924, renovated in 2025. Meadowbrook has the most rolling terrain of the Fort Worth city courses — a classic layout with beautiful elevation changes in east Fort Worth." },
  // ── Houston ──
  { id:'hou-memorial-park', name:'Memorial Park Golf Course', city:'Houston', state:'TX', citySlug:'houston-tx', slug:'memorial-park', type:'Municipal', fee:40, blurb:"Widely considered the best municipal golf course in Texas, Memorial Park is a 1936 classic that now hosts the PGA Tour's Houston Open. Exceptional conditions, iconic layout, and hard to beat at muni prices." },
  { id:'hou-sharpstown', name:'Sharpstown Park Golf Course', city:'Houston', state:'TX', citySlug:'houston-tx', slug:'sharpstown-park', type:'Municipal', fee:30, blurb:"One of Houston's most popular and most walkable municipal courses on the southwest side. Sharpstown is the go-to track for regulars who want great conditions and an easy, enjoyable walk." },
  { id:'hou-hermann-park', name:'Hermann Park Golf Course', city:'Houston', state:'TX', citySlug:'houston-tx', slug:'hermann-park', type:'Municipal', fee:26, blurb:"A historically significant 18-hole course inside the loop in central Houston. Hermann Park is easy to reach, affordable, and steeped in the history of Houston's public golf tradition." },
  { id:'hou-gus-wortham', name:'Gus Wortham Park Golf Course', city:'Houston', state:'TX', citySlug:'houston-tx', slug:'gus-wortham-park', type:'Municipal', fee:32, blurb:"Historic municipal course just east of downtown Houston featuring scenic, tree-lined fairways at a reasonable price. Gus Wortham is a dependable Houston muni with good value for the regular player." },
  { id:'hou-melrose-park', name:'Melrose Park Golf Course', city:'Houston', state:'TX', citySlug:'houston-tx', slug:'melrose-park', type:'Municipal', fee:18, holes:18, blurb:"An 18-hole par-3 layout in north Houston managed by a private company — ideal for short-game practice, beginners, and anyone who wants a quick, affordable round without the time commitment of a full course." },
  // ── El Paso ──
  { id:'ep-ascarate', name:'Ascarate Municipal Golf Course', city:'El Paso', state:'TX', citySlug:'el-paso-tx', slug:'ascarate-municipal', type:'Municipal', fee:25, holes:9, blurb:"An accessible 9-hole municipal layout in east El Paso at Ascarate Park. Affordable and beginner-friendly, Ascarate is El Paso's most accessible public golf option and a great place to get your game started." },
  // ── Lubbock ──
  { id:'lub-shadow-hills', name:'Shadow Hills Golf Course', city:'Lubbock', state:'TX', citySlug:'lubbock-tx', slug:'shadow-hills', type:'Public', fee:35, blurb:"A well-regarded public course on Lubbock's south side and one of the most reliable daily-fee tracks in West Texas. Shadow Hills offers consistent conditions and honest golf for players at every level." },
  { id:'lub-rawls', name:'The Rawls Course at Texas Tech', city:'Lubbock', state:'TX', citySlug:'lubbock-tx', slug:'rawls-course-texas-tech', type:'Public', fee:55, blurb:"Championship public course at Texas Tech University, consistently ranked among the best in West Texas. The Rawls Course offers a premium public golf experience with first-class facilities on the Tech campus." },
  // ── Abilene ──
  { id:'abi-maxwell', name:'Maxwell Municipal Golf Course', city:'Abilene', state:'TX', citySlug:'abilene-tx', slug:'maxwell-municipal', type:'Municipal', fee:20, blurb:"Abilene's long-running city golf course — affordable, friendly, and open to everyone. Maxwell Municipal is the home course for local golfers and a welcoming first stop for anyone visiting the area." },
  { id:'abi-willow-creek', name:'Willow Creek Golf Center', city:'Abilene', state:'TX', citySlug:'abilene-tx', slug:'willow-creek', type:'Public', fee:18, blurb:"Public golf facility in Abilene with a shorter layout well-suited to beginners and casual players looking for an affordable round. Willow Creek is one of the most accessible public golf options in the area." },
  // ── Waco ──
  { id:'wac-cottonwood-creek', name:'Cottonwood Creek Golf Course', city:'Waco', state:'TX', citySlug:'waco-tx', slug:'cottonwood-creek', type:'Public', fee:35, blurb:"A Pete Dye and Joe Finger design from 1985, Cottonwood Creek is an 18-hole par-72 layout with Bermuda grass throughout. One of the most distinguished public golf courses in Central Texas." },
  // ── Arlington ──
  { id:'arl-lake-arlington', name:'Lake Arlington Golf Course', city:'Arlington', state:'TX', citySlug:'arlington-tx', slug:'lake-arlington', type:'Municipal', fee:36, blurb:"A classic City of Arlington municipal course on the shores of Lake Arlington. Wide fairways, consistent conditions, and lake views make this one of the most enjoyable public rounds in the Mid-Cities." },
  { id:'arl-chester-w-ditto', name:'Chester W. Ditto Golf Course', city:'Arlington', state:'TX', citySlug:'arlington-tx', slug:'chester-w-ditto', type:'Municipal', fee:34, blurb:"Arlington's other municipal gem features an open, links-influenced layout that plays longer than its yardage suggests. Chester W. Ditto is known for its excellent greens and strong value for the area." },
  // ── Plano ──
  { id:'pla-pecan-hollow', name:'Pecan Hollow Golf Course', city:'Plano', state:'TX', citySlug:'plano-tx', slug:'pecan-hollow', type:'Municipal', fee:50, blurb:"One of the finest municipal courses in North Texas, Pecan Hollow is set along Rowlett Creek with mature pecans lining every fairway. The course recently reopened after a major renovation and is better than ever." },
  // ── Irving ──
  { id:'irv-twin-wells', name:'Twin Wells Golf Course', city:'Irving', state:'TX', citySlug:'irving-tx', slug:'twin-wells', type:'Municipal', fee:40, blurb:"A 36-hole municipal facility in Irving offering two distinct layouts — ideal for a full day of golf near DFW Airport. Twin Wells is well-maintained and one of the most central public courses in the metroplex." },
  // ── Garland ──
  { id:'gar-firewheel-old-course', name:'Firewheel Golf Park — Old Course', city:'Garland', state:'TX', citySlug:'garland-tx', slug:'firewheel-old-course', type:'Municipal', fee:55, blurb:"Firewheel's original 18 holes are a classic tree-lined municipal layout consistently rated among the top 5 public courses in Texas. The Old Course played host to the Ben Hogan Tour (now Korn Ferry Tour) in the 1990s." },
  { id:'gar-firewheel-lakes', name:'Firewheel Golf Park — Lakes', city:'Garland', state:'TX', citySlug:'garland-tx', slug:'firewheel-lakes', type:'Municipal', fee:55, blurb:"The Lakes layout at Firewheel is a more open, water-influenced layout built in 1983 — a perfect complement to the wooded Old Course. With 36 holes available, Firewheel is the top public golf destination in northeast DFW." },
  // ── Corpus Christi ──
  { id:'cc-gabe-lozano', name:'Gabe Lozano Sr. Golf Center', city:'Corpus Christi', state:'TX', citySlug:'corpus-christi-tx', slug:'gabe-lozano-sr', type:'Municipal', fee:32, blurb:"A 27-hole municipal complex on the north side of Corpus Christi offering three 9-hole layouts. Gabe Lozano is the most popular public golf facility on the Texas Coastal Bend and a longtime community cornerstone." },
  { id:'cc-oso-beach', name:'Oso Beach Municipal Golf Course', city:'Corpus Christi', state:'TX', citySlug:'corpus-christi-tx', slug:'oso-beach', type:'Municipal', fee:25, blurb:"A 9-hole muni near the water on Corpus Christi's south side. Oso Beach is one of the most affordable public rounds in Coastal Bend Texas — perfect for a casual 9 before heading to the beach." },
  // ── McAllen / Rio Grande Valley ──
  { id:'mcal-mcallen-muni', name:'McAllen Municipal Golf Course', city:'McAllen', state:'TX', citySlug:'mcallen-tx', slug:'mcallen-municipal', type:'Municipal', fee:28, blurb:"The main public golf facility in the Rio Grande Valley, McAllen Municipal offers an accessible, affordable 18 holes in the heart of the Valley. A popular winter destination for snowbirds from colder climates." },
  // ── Amarillo ──
  { id:'ama-ross-rogers', name:'Ross Rogers Golf Course', city:'Amarillo', state:'TX', citySlug:'amarillo-tx', slug:'ross-rogers', type:'Municipal', fee:30, blurb:"A 36-hole municipal facility in Amarillo offering two complete 18-hole layouts. Ross Rogers is a beloved community golf hub in the Texas Panhandle, known for excellent conditions and strong value in the region." },
  { id:'ama-comanche-trail', name:'Comanche Trail Golf Course', city:'Amarillo', state:'TX', citySlug:'amarillo-tx', slug:'comanche-trail', type:'Municipal', fee:28, blurb:"Amarillo's alternative city-owned course sits along Comanche Trail Park and is a more scenic, relaxed option for everyday golfers. Wide open and very walkable, it's an accessible spot to enjoy the Panhandle sky." },
  // ── Tyler ──
  { id:'tyl-faulkner-park', name:'Faulkner Park Golf Course', city:'Tyler', state:'TX', citySlug:'tyler-tx', slug:'faulkner-park', type:'Municipal', fee:30, blurb:"Tyler's primary municipal golf facility, Faulkner Park is a tree-lined East Texas layout known for its well-manicured conditions and affordable pricing. One of the most consistent public-access courses in the region." },
  // ── Bryan / College Station ──
  { id:'bcs-pebble-creek', name:'Pebble Creek Golf Course', city:'College Station', state:'TX', citySlug:'college-station-tx', slug:'pebble-creek', type:'Public', fee:40, blurb:"A links-style 18-hole track in College Station with open, rolling terrain and excellent conditions. Pebble Creek is the go-to public course for Aggie golfers and draws players from across the Brazos Valley." },
  // ── Midland ──
  { id:'mid-hogan-park', name:'Hogan Park Golf Course', city:'Midland', state:'TX', citySlug:'midland-tx', slug:'hogan-park', type:'Municipal', fee:28, blurb:"Named in honor of Ben Hogan, who was born in nearby Dublin, Texas, Hogan Park is Midland's main public golf facility. Two 18-hole layouts with solid conditions make this the golf hub of West Texas." },
  // ── Beaumont ──
  { id:'bmt-tyrrell-park', name:'Tyrrell Park Golf Course', city:'Beaumont', state:'TX', citySlug:'beaumont-tx', slug:'tyrrell-park', type:'Municipal', fee:32, blurb:"A well-regarded municipal course in southeast Texas that opened in 1926. Tyrrell Park is one of the oldest continuously operated public courses in the state and a Southeast Texas institution." },
  // ── San Marcos ──
  { id:'smk-springs-hill', name:'Springs Hill Golf Course', city:'San Marcos', state:'TX', citySlug:'san-marcos-tx', slug:'springs-hill', type:'Public', fee:35, blurb:"A beautiful public layout in San Marcos set among the rolling Texas Hill Country. Springs Hill offers excellent views, challenging par 4s, and some of the most scenic public golf between Austin and San Antonio." },
  // ── Laredo ──
  { id:'lrd-casa-blanca', name:'Casa Blanca Golf Course', city:'Laredo', state:'TX', citySlug:'laredo-tx', slug:'casa-blanca', type:'Municipal', fee:22, blurb:"Laredo's main public golf facility, Casa Blanca, sits adjacent to Casa Blanca Lake in east Laredo. An accessible, affordable muni serving the South Texas border community with consistent year-round conditions." },
  // ── Galveston ──
  { id:'gal-galveston-island', name:'Galveston Island Golf Course', city:'Galveston', state:'TX', citySlug:'galveston-tx', slug:'galveston-island', type:'Municipal', fee:38, blurb:"The only public golf course on Galveston Island, this municipal layout offers a unique coastal setting with gulf breezes that make every club selection an adventure. A must-play for any golfer visiting the Texas coast." },
  // ── Killeen / Temple ──
  { id:'kil-skylark-field', name:'Skylark Field Golf Course', city:'Killeen', state:'TX', citySlug:'killeen-tx', slug:'skylark-field', type:'Public', fee:30, blurb:"A straightforward public layout near Fort Cavazos in central Texas. Skylark Field is the primary public golf option for the Killeen–Temple area and draws a loyal local following for its dependable conditions." },
  // ── Wichita Falls ──
  { id:'wf-weeks-park', name:'Weeks Park Golf Course', city:'Wichita Falls', state:'TX', citySlug:'wichita-falls-tx', slug:'weeks-park', type:'Municipal', fee:28, blurb:"Wichita Falls' main municipal course sits in Weeks Park along Holliday Creek and is the primary public access golf facility for the North Texas panhandle region. A solid, affordable track with good greens." },
  // ── The Colony / DFW North ──
  { id:'col-the-tribute', name:'The Tribute Golf Club', city:'The Colony', state:'TX', citySlug:'the-colony-tx', slug:'the-tribute', type:'Public', fee:75, blurb:"A Scottish links-style masterpiece on the shores of Lake Lewisville in The Colony. The Tribute is consistently ranked among the top 5 public courses in Texas and the best links-style layout in the state — a bucket-list round for any serious golfer." },
  // ── McKinney ──
  { id:'mck-tpc-craig-ranch', name:'TPC Craig Ranch', city:'McKinney', state:'TX', citySlug:'mckinney-tx', slug:'tpc-craig-ranch', type:'Public', fee:85, blurb:"Home of the PGA Tour's AT&T Byron Nelson, TPC Craig Ranch is a world-class public layout in McKinney. Playing the same course the pros compete on is a bucket-list experience — and it's open to the public year-round." },
  // ── Grapevine ──
  { id:'grv-grapevine-golf', name:'Grapevine Golf Course — Dove Valley', city:'Grapevine', state:'TX', citySlug:'grapevine-tx', slug:'dove-valley-ranch', type:'Municipal', fee:48, blurb:"The City of Grapevine's flagship 18-hole municipal course, Dove Valley Ranch is a links-influenced layout set among rolling terrain near DFW Airport. One of the best-maintained munis in the mid-cities." },
  // ── Round Rock ──
  { id:'rr-old-settlers-park', name:'Old Settlers Park Golf Course', city:'Round Rock', state:'TX', citySlug:'round-rock-tx', slug:'old-settlers-park', type:'Municipal', fee:35, blurb:"Round Rock's City-owned 18-hole course in Old Settlers Park — a well-maintained, affordable layout that serves the fast-growing Austin suburb and draws heavy play from local regulars. Great value for the area." },
  // ── Rowlett ──
  { id:'row-waterview', name:'Waterview Golf Club', city:'Rowlett', state:'TX', citySlug:'rowlett-tx', slug:'waterview', type:'Public', fee:45, blurb:"A scenic daily-fee course in Rowlett built into the rolling terrain above Lake Ray Hubbard. Waterview features dramatic elevation changes, water views, and one of the most memorable finishing holes in the Dallas area." },
  // ── Pearland ──
  { id:'prl-pearland-golf', name:'Pearland Golf Club at Country Place', city:'Pearland', state:'TX', citySlug:'pearland-tx', slug:'pearland-golf-club', type:'Public', fee:40, blurb:"A popular public course in the booming Houston suburb of Pearland. Country Place offers 18 holes of well-maintained, affordable golf with consistent conditions and easy access from south Houston." },
  // ── Sugar Land ──
  { id:'sul-oyster-creek', name:'Oyster Creek Golf Course', city:'Sugar Land', state:'TX', citySlug:'sugar-land-tx', slug:'oyster-creek', type:'Municipal', fee:35, blurb:"The City of Sugar Land's municipal golf facility, set along Oyster Creek in Fort Bend County. An accessible 18-hole layout that's well-loved by the local community and one of the most affordable rounds in the Houston suburbs." },
  // ── Cypress / Houston NW ──
  { id:'cyp-longwood', name:'Longwood Golf Club', city:'Cypress', state:'TX', citySlug:'cypress-tx', slug:'longwood', type:'Public', fee:45, blurb:"A beloved daily-fee course on Houston's northwest side in Cypress. Longwood features tree-lined fairways, generous fairways, and conditions that punch above their price point — a reliable suburban Houston pick." },
  // ── Weslaco / Rio Grande Valley ──
  { id:'wes-tierra-santa', name:'Tierra Santa Golf Club', city:'Weslaco', state:'TX', citySlug:'weslaco-tx', slug:'tierra-santa', type:'Public', fee:38, blurb:"An 18-hole daily-fee track in the Rio Grande Valley serving golfers from Weslaco, McAllen, and the broader Winter Texan snowbird community. Tierra Santa offers championship-length golf at accessible South Texas pricing." },
  // ── New Braunfels ──
  { id:'nb-landa-park', name:'Landa Park Golf Course', city:'New Braunfels', state:'TX', citySlug:'new-braunfels-tx', slug:'landa-park', type:'Municipal', fee:30, blurb:"A scenic Hill Country municipal course in New Braunfels set inside Landa Park. With views of the Comal River and mature cypress trees lining the fairways, Landa Park is one of the most visually distinctive city-run courses in Texas." },
  // ── Pflugerville ──
  { id:'pfug-blackhawk', name:'Blackhawk Golf Club', city:'Pflugerville', state:'TX', citySlug:'pflugerville-tx', slug:'blackhawk', type:'Public', fee:50, blurb:"One of the premier public golf courses in the Austin metro, Blackhawk is a challenging 18-hole layout in Pflugerville featuring rolling terrain, a creek winding through several holes, and excellent conditioning year-round." },
  // ── Cedar Park ──
  { id:'cp-twin-creeks', name:'Twin Creeks Golf Club', city:'Cedar Park', state:'TX', citySlug:'cedar-park-tx', slug:'twin-creeks', type:'Public', fee:55, blurb:"A daily-fee 18-hole course in Cedar Park on the northwest side of the Austin metro. Twin Creeks offers a genuine test of golf with well-designed holes, strong conditioning, and a welcoming atmosphere for golfers of all levels." },
  // ── Conroe / The Woodlands ──
  { id:'con-west-fork', name:'West Fork Golf Club', city:'Conroe', state:'TX', citySlug:'conroe-tx', slug:'west-fork', type:'Public', fee:45, blurb:"A public 18-hole layout just north of The Woodlands in Conroe, serving the booming Montgomery County golf community. West Fork offers solid daily-fee golf with tree-lined fairways and reasonable pricing for the greater Houston area." },
  // ── More Houston Area ──
  { id:'hou-glenbrook', name:'Glenbrook Golf Course', city:'Houston', state:'TX', citySlug:'houston-tx', slug:'glenbrook', type:'Municipal', fee:30, blurb:"A City of Houston municipal course on the southeast side near the ship channel. Glenbrook is a straightforward, affordable 18-hole layout and a reliable everyday round for south Houston golfers." },
  { id:'hou-brock-park', name:'Brock Park Golf Course', city:'Houston', state:'TX', citySlug:'houston-tx', slug:'brock-park', type:'Municipal', fee:38, blurb:"City of Houston's northeast-side muni set in Brock Park along Hunting Bayou. Well-maintained conditions and a welcoming atmosphere make Brock Park a go-to track for golfers on the north and northeast sides of Houston." },
  { id:'pas-muni', name:'Pasadena Municipal Golf Course', city:'Pasadena', state:'TX', citySlug:'pasadena-tx', slug:'pasadena-municipal', type:'Municipal', fee:28, blurb:"The City of Pasadena's accessible 18-hole public course in the Houston Ship Channel area. Affordable, well-run, and a great option for southeast Houston golfers looking for a quick round close to home." },
  { id:'bay-baytown', name:'Evergreen Point Golf Club', city:'Baytown', state:'TX', citySlug:'baytown-tx', slug:'evergreen-point', type:'Public', fee:32, blurb:"An 18-hole daily-fee course in Baytown serving the eastern Houston metro. Evergreen Point offers scenic, affordable golf with tree-lined fairways and an easy, walkable layout — one of the better-value rounds on Houston's east side." },
  { id:'flk-friendswood', name:'Friendswood Golf Club', city:'Friendswood', state:'TX', citySlug:'friendswood-tx', slug:'friendswood-golf-club', type:'Public', fee:40, blurb:"A well-maintained 18-hole public course in the heart of one of Houston's most desirable south suburbs. Friendswood Golf Club is consistently praised for its conditions and offers a solid daily-fee experience for the Clear Lake and Bay Area golf community." },
  { id:'lkj-lake-jackson', name:'Lake Jackson Golf Course', city:'Lake Jackson', state:'TX', citySlug:'lake-jackson-tx', slug:'lake-jackson-golf-course', type:'Municipal', fee:32, blurb:"The main public golf facility in Brazoria County, Lake Jackson Golf Course serves the Gulf Coast community with consistent 18-hole municipal golf at accessible pricing — the go-to course for the Freeport–Clute–Lake Jackson triangle." },
  { id:'moc-missouri-city', name:'Missouri City Golf Course', city:'Missouri City', state:'TX', citySlug:'missouri-city-tx', slug:'missouri-city-golf-course', type:'Municipal', fee:35, blurb:"A Fort Bend County public 18-hole layout in Missouri City, just southwest of Houston. Straight forward, well-kept, and popular with locals who want reliable muni golf without the crowds of larger Houston-area facilities." },
  // ── More Austin Area ──
  { id:'rr-teravista', name:'Teravista Golf Club', city:'Round Rock', state:'TX', citySlug:'round-rock-tx', slug:'teravista', type:'Public', fee:60, blurb:"An 18-hole daily-fee course in the master-planned Teravista community in Round Rock. With rolling Hill Country terrain, long-range views, and strong course conditioning, Teravista is one of the top public golf options in the greater Austin area." },
  { id:'aus-avery-ranch', name:'Avery Ranch Golf Club', city:'Austin', state:'TX', citySlug:'austin-tx', slug:'avery-ranch', type:'Public', fee:65, blurb:"One of the most popular daily-fee courses in north Austin, Avery Ranch features 18 holes of challenging, well-designed golf with consistent conditions and a full practice facility. A premier public option in the rapidly growing northwest Austin corridor." },
  { id:'hut-star-ranch', name:'Star Ranch Golf Club', city:'Hutto', state:'TX', citySlug:'hutto-tx', slug:'star-ranch', type:'Public', fee:65, blurb:"A highly rated 18-hole daily-fee course in Hutto, northeast of Austin. Star Ranch is known for its excellent conditions, links-influenced design, and consistently strong reviews from Austin-area golfers. One of the best-value premium public rounds in Central Texas." },
  { id:'geo-georgetown-muni', name:'Georgetown Golf Course', city:'Georgetown', state:'TX', citySlug:'georgetown-tx', slug:'georgetown-golf-course', type:'Municipal', fee:35, blurb:"Georgetown's city-run public golf facility offering an accessible, affordable 18-hole layout just north of the historic downtown square. A popular spot for local residents and a friendly introduction to golf for newcomers in one of Texas's fastest-growing cities." },
  // ── More DFW Area ──
  { id:'rwk-rockwall', name:'Rockwall Golf & Athletic Club', city:'Rockwall', state:'TX', citySlug:'rockwall-tx', slug:'rockwall-golf-club', type:'Public', fee:55, blurb:"A well-regarded 18-hole daily-fee course in Rockwall, just 25 miles east of Dallas on Lake Ray Hubbard. Rockwall Golf & Athletic Club combines a solid layout with an active community atmosphere — one of the best public-access options in east DFW." },
  { id:'gp-tangle-ridge', name:'Tangle Ridge Golf Course', city:'Grand Prairie', state:'TX', citySlug:'grand-prairie-tx', slug:'tangle-ridge', type:'Public', fee:55, blurb:"One of the most scenic public courses in the Dallas–Fort Worth area, Tangle Ridge features dramatic elevation changes, Hill Country-style terrain, and exceptional conditioning. Located in Grand Prairie between Dallas and Fort Worth, it's a must-play for DFW golfers." },
  { id:'arl-tierra-verde', name:'Tierra Verde Golf Club', city:'Arlington', state:'TX', citySlug:'arlington-tx', slug:'tierra-verde', type:'Public', fee:55, blurb:"A championship 18-hole daily-fee course in Arlington with a links-inspired design and wide-open fairways. Tierra Verde is one of the top public golf options in the Mid-Cities, offering excellent conditioning and a full practice facility." },
  { id:'ced-cedar-hill', name:'Cedar Hill Golf Course', city:'Cedar Hill', state:'TX', citySlug:'cedar-hill-tx', slug:'cedar-hill-golf-course', type:'Public', fee:42, blurb:"A public 18-hole course in Cedar Hill, southwest of Dallas near Joe Pool Lake. Affordable, tree-lined, and well-maintained — Cedar Hill Golf Course is a solid option for southwest DFW golfers who want reliable conditions without a premium price tag." },
  { id:'hst-hurst-hills', name:'Hurst Hills Golf Course', city:'Hurst', state:'TX', citySlug:'hurst-tx', slug:'hurst-hills', type:'Municipal', fee:35, blurb:"A City of Hurst municipal par-3 and 9-hole layout in the heart of the Mid-Cities. Hurst Hills is a fantastic option for beginners, quick rounds, and golfers who want to sharpen their short game on a well-maintained city-run facility." },
  { id:'den-eagle-pointe', name:'Eagle Pointe Golf Club', city:'Denton', state:'TX', citySlug:'denton-tx', slug:'eagle-pointe', type:'Public', fee:38, blurb:"A daily-fee 18-hole course in Denton serving the UNT and TWU college community and the rapidly growing North Texas metro. Eagle Pointe offers solid, affordable public golf — a popular and accessible track for the Denton County golf community." },
  // ── West Texas ──
  { id:'ods-odessa', name:'Ratliff Ranch Golf Links', city:'Odessa', state:'TX', citySlug:'odessa-tx', slug:'ratliff-ranch', type:'Public', fee:32, blurb:"A well-regarded 18-hole daily-fee course in Odessa. Ratliff Ranch offers the best public golf experience in the Permian Basin with excellent conditions, competitive pricing, and a welcoming atmosphere for the Odessa and Midland golf community." },
  { id:'mw-mineral-wells', name:'Mineral Wells Golf Course', city:'Mineral Wells', state:'TX', citySlug:'mineral-wells-tx', slug:'mineral-wells-golf-course', type:'Public', fee:22, blurb:"A classic Texas small-city golf course offering affordable, no-frills public golf in Mineral Wells, west of Fort Worth. A friendly, walkable layout with a loyal local following and the kind of character you only find at courses that have been serving communities for generations." },
  { id:'wfd-weatherford', name:'Weatherford Golf Club', city:'Weatherford', state:'TX', citySlug:'weatherford-tx', slug:'weatherford-golf-club', type:'Public', fee:30, blurb:"Weatherford's go-to public golf facility, offering an accessible 18-hole layout west of Fort Worth. Affordable, welcoming, and set in the rolling terrain of Parker County — Weatherford Golf Club is a straightforward, enjoyable round that captures the spirit of Texas small-town golf." },
  { id:'grb-granbury', name:'Granbury Country Club', city:'Granbury', state:'TX', citySlug:'granbury-tx', slug:'granbury-country-club', type:'Public', fee:38, blurb:"A semi-private course open to daily fee play in Granbury, on the shores of Lake Granbury southwest of Fort Worth. The Granbury Country Club combines classic Hill Country–influenced golf with scenic lake views — a beautiful setting for a round any time of year." },
  { id:'stp-stephenville', name:'Stephenville Golf Course', city:'Stephenville', state:'TX', citySlug:'stephenville-tx', slug:'stephenville-golf-course', type:'Municipal', fee:25, blurb:"The public golf course serving Stephenville, home of Tarleton State University. A friendly, affordable nine-hole municipal layout offering relaxed, enjoyable golf in the heart of the Cross Timbers region." },
  // ── Panhandle additions ──
  { id:'pam-pampa', name:'Pampa Municipal Golf Course', city:'Pampa', state:'TX', citySlug:'pampa-tx', slug:'pampa-municipal', type:'Municipal', fee:20, blurb:"Pampa's city-run public golf facility in the Texas Panhandle. A flat, wide-open 18-hole muni that makes great use of the Panhandle terrain — affordable, friendly, and one of the most accessible rounds in the high plains of Texas." },
  // ── East Texas ──
  { id:'luf-lufkin', name:'Lufkin Municipal Golf Course', city:'Lufkin', state:'TX', citySlug:'lufkin-tx', slug:'lufkin-municipal', type:'Municipal', fee:28, blurb:"A well-maintained city-run golf course in the heart of East Texas. Lufkin Municipal is a tree-lined 18-hole layout that offers a quintessential East Texas golf experience — lush fairways, tall pines, and the warm hospitality the region is known for." },
  { id:'lng-longview', name:'Alpine Golf Course', city:'Longview', state:'TX', citySlug:'longview-tx', slug:'alpine-golf-course', type:'Public', fee:32, blurb:"Longview's main public golf facility and one of the better-conditioned daily-fee tracks in East Texas. Alpine Golf Course features a tree-lined layout, reasonable pricing, and a loyal local following in one of the most golf-friendly cities in the region." },
  { id:'nac-nacogdoches', name:'Woodland Hills Golf Course', city:'Nacogdoches', state:'TX', citySlug:'nacogdoches-tx', slug:'woodland-hills', type:'Public', fee:28, blurb:"A scenic 18-hole daily-fee course in Nacogdoches, the oldest city in Texas. Woodland Hills offers tree-lined East Texas golf at affordable prices and is the home course for Stephen F. Austin University golfers and the broader Nacogdoches community." },
  { id:'mar-marshall', name:'Marshall Municipal Golf Course', city:'Marshall', state:'TX', citySlug:'marshall-tx', slug:'marshall-municipal', type:'Municipal', fee:25, blurb:"Marshall's city-run public golf course serving the Caddo Lake–area community in deep East Texas. A classic, affordable municipal layout with a welcoming atmosphere and some of the most affordable green fees in the state." },
  { id:'plt-palestine', name:'Palestine Country Club', city:'Palestine', state:'TX', citySlug:'palestine-tx', slug:'palestine-country-club', type:'Public', fee:28, blurb:"A semi-public daily-fee course in Palestine, serving the Anderson County community in East Texas. Palestine Country Club offers an 18-hole layout with wooded, rolling terrain and solid conditions — one of the most scenic small-city golf experiences in the state." },
  { id:'ssp-sulphur-springs', name:'Sulphur Springs Golf Course', city:'Sulphur Springs', state:'TX', citySlug:'sulphur-springs-tx', slug:'sulphur-springs-golf', type:'Public', fee:25, blurb:"A public 18-hole layout in Sulphur Springs, northeast Texas. Affordable and well-maintained, this is the primary public golf option for Hopkins County and the surrounding Northeast Texas Piney Woods region." },
  // ── South Texas ──
  { id:'bro-brownsville', name:'Brownsville Municipal Golf Course', city:'Brownsville', state:'TX', citySlug:'brownsville-tx', slug:'brownsville-municipal', type:'Municipal', fee:28, blurb:"The City of Brownsville's public golf course at the southern tip of Texas, just miles from the Mexico border. Brownsville Municipal is a popular year-round destination for local players and snowbirds who appreciate warm weather, palm trees, and the unique character of the Rio Grande Valley." },
  // ── Henderson ──
  { id:'hen-henderson', name:'Henderson Golf Course', city:'Henderson', state:'TX', citySlug:'henderson-tx', slug:'henderson-golf-course', type:'Municipal', fee:22, blurb:"Rusk County's public golf facility in Henderson, East Texas. A straightforward, affordable nine-to-eighteen hole layout where local golfers have been playing for decades — the kind of course that defines what community golf looks like in small-town Texas." },
  { id:'tem-sammons', name:'Sammons Golf Course', city:'Temple', state:'TX', citySlug:'temple-tx', slug:'sammons-golf-course', type:'Municipal', fee:30, blurb:"Temple's city-run 18-hole public golf course in the heart of Central Texas, midway between Waco and Austin. Sammons Golf Course offers consistent muni conditions, affordable green fees, and a welcoming atmosphere that has made it a community staple for decades." },
  { id:'vic-victoria-muni', name:'Victoria Municipal Golf Course', city:'Victoria', state:'TX', citySlug:'victoria-tx', slug:'victoria-municipal', type:'Municipal', fee:28, blurb:"The City of Victoria's public golf course serving the Golden Crescent region of South Texas. A well-maintained 18-hole layout that's accessible to golfers of all skill levels — one of the most consistent and affordable municipal courses between San Antonio and Corpus Christi." },
];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function nearbyCourses(course) {
  return COURSES.filter(c => c.citySlug === course.citySlug && c.id !== course.id).slice(0, 4);
}

function tailwindConfig() {
  return `<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "inverse-on-surface": "#d4fae2", "on-primary-container": "#80ad90",
        "on-primary-fixed": "#002111", "surface-container-lowest": "#ffffff",
        "on-tertiary-container": "#5fb482", "tertiary-fixed": "#9ef5be",
        "secondary-fixed": "#ffdea8", "surface-off-white": "#FAF9F4",
        "sky-blue": "#C2E1F2", "on-secondary": "#ffffff",
        "on-error": "#ffffff", "on-tertiary-fixed": "#002110",
        "error-container": "#ffdad6", "on-surface-variant": "#414943",
        "error": "#ba1a1a", "surface-container-high": "#cbf1da",
        "secondary-container": "#fdc65e", "on-background": "#002113",
        "primary-fixed-dim": "#a3d1b3", "surface-container": "#d1f7e0",
        "on-secondary-container": "#745200", "on-primary": "#ffffff",
        "tertiary-fixed-dim": "#82d8a3", "on-tertiary": "#ffffff",
        "deep-forest": "#103223", "primary": "#002a17",
        "surface-container-low": "#d6fde5", "on-tertiary-fixed-variant": "#00522f",
        "surface": "#e8ffef", "on-error-container": "#93000a",
        "secondary": "#7c5800", "primary-fixed": "#bfedce",
        "inverse-primary": "#a3d1b3", "tertiary-container": "#004326",
        "on-surface": "#002113", "surface-dim": "#bde3cc",
        "surface-variant": "#c6ebd5", "on-secondary-fixed-variant": "#5e4200",
        "on-secondary-fixed": "#271900", "inverse-surface": "#153627",
        "primary-container": "#16412b", "surface-bright": "#e8ffef",
        "tertiary": "#002b16", "outline-variant": "#c1c8c1"
      },
      fontFamily: {
        "body-md": ["Manrope"], "headline-md": ["Sora"],
        "display-lg": ["Sora"], "label-sm": ["Manrope"],
        "label-lg": ["Manrope"], "headline-lg": ["Sora"]
      },
      fontSize: {
        "body-md": ["16px", {lineHeight:"24px", fontWeight:"400"}],
        "headline-lg-mobile": ["28px", {lineHeight:"36px", fontWeight:"600"}],
        "headline-md": ["24px", {lineHeight:"32px", fontWeight:"600"}],
        "display-lg": ["48px", {lineHeight:"56px", letterSpacing:"-0.02em", fontWeight:"700"}],
        "body-lg": ["18px", {lineHeight:"28px", fontWeight:"400"}],
        "display-lg-mobile": ["36px", {lineHeight:"42px", letterSpacing:"-0.02em", fontWeight:"700"}],
        "label-sm": ["12px", {lineHeight:"16px", fontWeight:"500"}],
        "label-lg": ["14px", {lineHeight:"20px", letterSpacing:"0.05em", fontWeight:"600"}],
        "headline-lg": ["32px", {lineHeight:"40px", fontWeight:"600"}]
      }
    }
  }
}
</script>
<style>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
.glass-nav { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
</style>`;
}

function generatePage(course) {
  const canonical = `${SITE_URL}/courses/${course.citySlug}/${course.slug}/`;
  const nearby = nearbyCourses(course);
  const holesText = course.holes === 9 ? '9 holes' : '18 holes';
  const partnerText = 'up to $50 off your green fee';

  const nearbyLinks = nearby.length > 0 ? nearby.map(n =>
    `<a href="${SITE_URL}/courses/${n.citySlug}/${n.slug}/" class="block p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors">
      <div class="font-bold text-primary font-body-md text-body-md">${n.name}</div>
      <div class="text-on-surface-variant text-sm mt-1">${n.city}, TX · ${n.type}</div>
    </a>`
  ).join('\n') : '';

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#16412b"/>
<title>${course.name} Green Fees &amp; Tee Times | TrackPass Texas Golf Pass</title>
<meta name="description" content="Play ${course.name} in ${course.city}, TX with TrackPass — the $199/year Texas golf pass. Green fees covered up to $50/round at any Texas public course. Founding members save from day one."/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:title" content="${course.name} — Covered by TrackPass | Texas Golf Pass"/>
<meta property="og:description" content="Play ${course.name} in ${course.city}, TX with TrackPass. $199/year covers green fees up to $50/round at any Texas public course — including ${course.name}."/>
<meta property="og:site_name" content="TrackPass"/>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "GolfCourse",
      "name": "${course.name}",
      "description": "${course.blurb.replace(/"/g, '\\"')}",
      "address": { "@type": "PostalAddress", "addressLocality": "${course.city}", "addressRegion": "TX", "addressCountry": "US" },
      "url": "${canonical}"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does it cost to play ${course.name}?",
          "acceptedAnswer": { "@type": "Answer", "text": "Green fees at ${course.name} in ${course.city} are approximately $${course.fee}/round. With TrackPass ($199/year), partner courses play free (no limit). Out-of-network courses: 1 reimbursement per month, up to $50, each course covered once." }
        },
        {
          "@type": "Question",
          "name": "Is ${course.name} covered by TrackPass?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. TrackPass covers green fees up to $50/round at any Texas public or municipal course, including ${course.name}. Pay your green fee, keep your receipt, and submit for reimbursement. 1 out-of-network reimbursement per month, max $50. Each course covered once." }
        }
      ]
    }
  ]
}
</script>
${tailwindConfig()}
</head>
<body class="bg-surface-off-white font-body-md text-on-surface selection:bg-secondary-container selection:text-on-secondary-container">

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-surface-off-white/80 backdrop-blur-xl shadow-sm">
  <div class="flex justify-between items-center h-20 px-4 md:px-8 max-w-5xl mx-auto">
    <a class="text-2xl font-bold tracking-tight text-primary font-headline-lg" href="${SITE_URL}/">TrackPass</a>
    <div class="hidden md:flex items-center gap-8">
      <a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="${SITE_URL}/courses.html">Find Courses</a>
      <a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="${SITE_URL}/plans.html">Membership</a>
    </div>
    <a href="${STRIPE_LINK}" class="bg-primary text-white px-6 py-2.5 rounded-full font-bold hover:bg-deep-forest transition-all duration-200 text-sm">Join Now — $199</a>
  </div>
</nav>

<!-- Hero -->
<div class="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
  <div class="mb-4">
    <a href="${SITE_URL}/courses.html" class="text-secondary font-bold text-sm hover:underline">← All Texas Courses</a>
  </div>
  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant text-sm font-bold mb-4">
    <span class="material-symbols-outlined text-[16px] text-secondary">verified</span>
    Covered by TrackPass
  </div>
  <h1 class="font-headline-lg text-4xl md:text-5xl font-bold text-primary leading-tight mb-3">${course.name}</h1>
  <p class="text-on-surface-variant font-body-md text-body-lg mb-8">${course.city}, Texas &nbsp;·&nbsp; ${course.type} Course &nbsp;·&nbsp; ${holesText}</p>

  <div class="grid md:grid-cols-3 gap-4 mb-12">
    <div class="p-5 rounded-2xl bg-surface-container border border-outline-variant">
      <div class="text-label-lg text-on-surface-variant font-label-lg uppercase tracking-wide mb-1">Without TrackPass</div>
      <div class="text-3xl font-bold text-primary font-headline-lg">~$${course.fee}<span class="text-base font-normal text-on-surface-variant">/round</span></div>
    </div>
    <div class="p-5 rounded-2xl bg-primary-container border border-primary/20">
      <div class="text-label-lg text-on-primary-container font-label-lg uppercase tracking-wide mb-1">With TrackPass</div>
      <div class="text-3xl font-bold text-primary-fixed font-headline-lg">Up to $50 back<span class="text-base font-normal text-on-primary-container"> per round</span></div>
    </div>
    <div class="p-5 rounded-2xl bg-secondary-container border border-secondary/20">
      <div class="text-label-lg text-on-secondary-container font-label-lg uppercase tracking-wide mb-1">TrackPass Annual Cost</div>
      <div class="text-3xl font-bold text-on-secondary-container font-headline-lg">$199<span class="text-base font-normal">/year</span></div>
    </div>
  </div>
</div>

<!-- Content -->
<div class="px-4 md:px-8 max-w-5xl mx-auto pb-16">
  <div class="grid md:grid-cols-5 gap-10">
    <div class="md:col-span-3 space-y-8">
      <section>
        <h2 class="text-xl font-bold text-primary font-headline-md mb-3">About ${course.name}</h2>
        <p class="text-on-surface font-body-md text-body-lg leading-relaxed">${course.blurb}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-primary font-headline-md mb-3">How TrackPass Works at ${course.name.split(' ')[0]} ${course.name.split(' ')[1] || ''}</h2>
        <ul class="space-y-3">
          <li class="flex items-start gap-3">
            <span class="material-symbols-outlined text-secondary mt-0.5">check_circle</span>
            <span>Book your tee time at ${course.name} the normal way — through the pro shop, GolfNow, or any booking platform.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="material-symbols-outlined text-secondary mt-0.5">check_circle</span>
            <span>Pay your green fee at the course and keep your receipt. Weekday and off-peak rates get full coverage.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="material-symbols-outlined text-secondary mt-0.5">check_circle</span>
            <span>Log in to your TrackPass member dashboard and submit the receipt. We reimburse up to $50 — 1 per month, each course covered once.</span>
          </li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold text-primary font-headline-md mb-3">Is $199 worth it for ${course.name}?</h2>
        <p class="text-on-surface font-body-md text-body-lg leading-relaxed">At ~$${course.fee}/round, you break even after just ${Math.ceil(199 / Math.min(course.fee, 50))} rounds — and TrackPass has no round limits. Play ${course.name} four times and the pass has paid for itself. Every round after that is effectively free. And your pass covers every other Texas public course too, not just this one.</p>
      </section>
    </div>

    <!-- Sidebar CTA -->
    <div class="md:col-span-2">
      <div class="sticky top-28 p-6 rounded-2xl bg-primary-container border border-primary/20 space-y-4">
        <h3 class="text-lg font-bold text-primary font-headline-md">Get TrackPass</h3>
        <p class="text-on-surface-variant text-sm">$199/year. Any Texas public course. 1 out-of-network reimbursement per month, max $50. Each course covered once.</p>
        <a href="${STRIPE_LINK}" class="block w-full text-center bg-primary text-white py-3 rounded-full font-bold hover:bg-deep-forest transition-all duration-200">
          Join Now — $199/year →
        </a>
        <a href="${SITE_URL}/#waitlist" class="block w-full text-center border border-primary text-primary py-3 rounded-full font-bold hover:bg-surface-container transition-all duration-200 text-sm">
          Join the waitlist (pay later)
        </a>
        <p class="text-xs text-on-surface-variant text-center">Founding rate · Secure checkout via Stripe</p>
      </div>
    </div>
  </div>

  ${nearby.length > 0 ? `
  <!-- Nearby courses -->
  <section class="mt-16 pt-12 border-t border-outline-variant">
    <h2 class="text-xl font-bold text-primary font-headline-md mb-6">More Courses in ${course.city}</h2>
    <div class="grid sm:grid-cols-2 gap-3">
      ${nearbyLinks}
    </div>
  </section>` : ''}

  <!-- Bottom CTA -->
  <section class="mt-16 p-8 rounded-3xl bg-primary text-white text-center">
    <h2 class="text-2xl font-bold font-headline-md mb-2">Play Any Texas Course — $199/year</h2>
    <p class="text-white/80 mb-6">TrackPass covers green fees up to $50/round at ${course.name} and 500+ other Texas public courses. Unlimited rounds, one flat price.</p>
    <a href="${STRIPE_LINK}" class="inline-block bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-surface-off-white transition-all duration-200">
      Join the Founding Class →
    </a>
  </section>
</div>

<!-- Footer -->
<footer class="mt-16 py-8 px-4 md:px-8 border-t border-outline-variant">
  <div class="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-on-surface-variant">
    <span class="font-bold text-primary">TrackPass</span>
    <div class="flex gap-6">
      <a href="${SITE_URL}/courses.html" class="hover:text-primary">Find Courses</a>
      <a href="${SITE_URL}/plans.html" class="hover:text-primary">Membership</a>
      <a href="${SITE_URL}/dashboard.html" class="hover:text-primary">My Pass</a>
    </div>
    <span>© ${new Date().getFullYear()} TrackPass</span>
  </div>
</footer>

</body>
</html>`;
}

// Generate all pages
let count = 0;
for (const course of COURSES) {
  const dir = path.join(__dirname, '..', 'courses', course.citySlug, course.slug);
  fs.mkdirSync(dir, { recursive: true });
  const html = generatePage(course);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  count++;
  console.log(`Generated: courses/${course.citySlug}/${course.slug}/`);
}
console.log(`\nDone: ${count} course pages generated.`);

// Generate sitemap entries (to append)
const sitemapEntries = COURSES.map(c =>
  `  <url><loc>${SITE_URL}/courses/${c.citySlug}/${c.slug}/</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`
).join('\n');
console.log('\n=== SITEMAP ENTRIES ===');
console.log(sitemapEntries);
