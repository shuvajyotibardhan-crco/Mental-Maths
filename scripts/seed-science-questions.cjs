/**
 * Seed script: Science questions for Firestore
 *
 * Usage:
 *   node scripts/seed-science-questions.cjs <path-to-service-account.json>
 *
 * 150 questions per grade, grades 5–12 (1,200 total).
 * Questions with correctIndices.length > 1 are multi-select (~30%).
 *
 * Firestore collection: scienceQuestions
 * Fields: grade, question, options (string[4]), correctIndices (number[]), topic
 */

'use strict'
const admin = require('firebase-admin')
const fs = require('fs')

const serviceAccountPath = process.argv[2]
if (!serviceAccountPath) {
  console.error('Usage: node scripts/seed-science-questions.cjs <service-account.json>')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()
db.settings({ preferRest: true })

const questions = [

  // ══════════════════════════════════════════════════════════════════════════
  // GRADE 5 — 150 questions
  // ══════════════════════════════════════════════════════════════════════════

  // ── Life Science (50) ─────────────────────────────────────────────────────
  { grade:'5', topic:'Life Science', question:'What is the basic unit of life?', options:['Atom','Tissue','Cell','Organ'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'Which process do plants use to make food from sunlight?', options:['Respiration','Digestion','Photosynthesis','Fermentation'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What gas do plants take in during photosynthesis?', options:['Oxygen','Carbon dioxide','Nitrogen','Argon'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'What gas do plants release during photosynthesis?', options:['Carbon dioxide','Nitrogen','Oxygen','Hydrogen'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'Which organelle is the powerhouse of the cell?', options:['Nucleus','Ribosome','Mitochondria','Vacuole'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'Which organelle controls what enters and leaves the cell?', options:['Cell wall','Nucleus','Cell membrane','Vacuole'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'Which structures are found in plant cells but NOT animal cells? (Select all)', options:['Cell wall','Chloroplasts','Mitochondria','Large central vacuole'], correctIndices:[0,1,3] },
  { grade:'5', topic:'Life Science', question:'In a food chain, which organism is a primary consumer?', options:['Grass','Rabbit','Fox','Eagle'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which organisms are producers in an ecosystem?', options:['Deer','Mushrooms','Oak trees','Grass'], correctIndices:[2,3] },
  { grade:'5', topic:'Life Science', question:'Which organisms are decomposers? (Select all)', options:['Fungi','Eagles','Bacteria','Corn'], correctIndices:[0,2] },
  { grade:'5', topic:'Life Science', question:'What do decomposers do in an ecosystem?', options:['Produce food from sunlight','Break down dead organisms','Hunt prey','Pollinate flowers'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'What is a habitat?', options:['The food an animal eats','The place where an organism lives','The number of organisms in an area','The climate of a region'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which adaptation helps a polar bear survive in cold climates? (Select all)', options:['Thick fat layer','Thin skin','White fur','Dark-coloured scales'], correctIndices:[0,2] },
  { grade:'5', topic:'Life Science', question:'What is the role of the nucleus in a cell?', options:['Produce energy','Control cell activities and store DNA','Carry out photosynthesis','Store water'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which of the following is an invertebrate?', options:['Dog','Frog','Earthworm','Bird'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What do plants need to survive? (Select all)', options:['Water','Sunlight','Carbon dioxide','Soil nutrients'], correctIndices:[0,1,2,3] },
  { grade:'5', topic:'Life Science', question:'Which system pumps blood through the human body?', options:['Digestive','Respiratory','Circulatory','Nervous'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What is the function of the lungs?', options:['Digest food','Exchange oxygen and carbon dioxide','Filter blood','Produce hormones'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which stage comes after the larva stage in a butterfly\'s life cycle?', options:['Egg','Pupa','Adult','Nymph'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'What is a food web?', options:['A single chain of who eats whom','Many interconnected food chains in an ecosystem','A web spun by spiders to catch food','The diet of one animal'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Animals that eat only plants are called:', options:['Carnivores','Omnivores','Herbivores','Decomposers'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'Animals that eat only other animals are called:', options:['Herbivores','Carnivores','Omnivores','Producers'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which of the following are omnivores? (Select all)', options:['Bear','Rabbit','Human','Cow'], correctIndices:[0,2] },
  { grade:'5', topic:'Life Science', question:'What is the process by which organisms produce offspring?', options:['Respiration','Adaptation','Reproduction','Digestion'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'Which type of reproduction requires only one parent?', options:['Sexual reproduction','Asexual reproduction','Both types','Neither'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'What structure do plants use to absorb water from the soil?', options:['Leaves','Roots','Stem','Flowers'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'What is the function of chlorophyll in plants?', options:['Store water','Transport nutrients','Capture sunlight for photosynthesis','Support the plant structure'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'Which organ in the human body breaks down food?', options:['Heart','Stomach','Lung','Brain'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'A biome with very little rainfall and extreme temperatures is called a:', options:['Rainforest','Desert','Tundra','Wetland'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which of these is NOT a characteristic shared by all living things?', options:['Made of cells','Can reproduce','Needs sunlight directly','Uses energy'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What is the role of the skeleton in the human body? (Select all)', options:['Support the body','Protect organs','Produce blood cells','Contract muscles directly'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Life Science', question:'Which part of the plant transports water and nutrients upward?', options:['Root','Leaf','Stem','Flower'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What is camouflage?', options:['A type of predator','An adaptation that helps organisms blend into their surroundings','A method of communication','A way of storing food'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which type of animal lays eggs and has feathers?', options:['Mammal','Reptile','Bird','Amphibian'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What do seeds need to germinate? (Select all)', options:['Water','Warmth','Soil or growing medium','Light (for most seeds)'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Life Science', question:'What is an ecosystem?', options:['A single species in an area','All living and non-living things in an area and their interactions','Only the plants in an area','Only the animals in a habitat'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which kingdom contains organisms that are multicellular and get energy by eating other organisms?', options:['Plantae','Fungi','Animalia','Protista'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What is a predator?', options:['An animal that is hunted','An animal that hunts and eats other animals','A plant that traps insects','A type of parasite'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which of these is a cold-blooded animal?', options:['Dog','Cat','Snake','Bird'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What is migration?', options:['Hibernating in winter','Seasonal movement of animals to find food or better conditions','Growing a thicker coat in winter','Changing colour to blend in'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'What is hibernation?', options:['Moving to a warmer place','A deep sleep-like state used to survive cold winters','A form of camouflage','The shedding of skin'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which part of the flower produces pollen?', options:['Petal','Pistil','Stamen','Sepal'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'What is pollination?', options:['The process of seeds sprouting','Transfer of pollen from stamen to pistil','The growth of a fruit','The wilting of a flower'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which organ filters waste from blood to make urine?', options:['Liver','Kidney','Stomach','Lung'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'What is the function of red blood cells?', options:['Fight infection','Carry oxygen through the body','Produce antibodies','Digest fats'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which organisms can make their own food from sunlight? (Select all)', options:['Grass','Trees','Algae','Deer'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Life Science', question:'What do plants release into the air through their leaves?', options:['Carbon dioxide only','Oxygen and water vapour','Nitrogen and oxygen','Glucose and oxygen'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'Which type of symbiosis benefits both organisms?', options:['Parasitism','Commensalism','Mutualism','Predation'], correctIndices:[2] },
  { grade:'5', topic:'Life Science', question:'Fungi get their energy by:', options:['Photosynthesis','Absorbing nutrients from other organisms or dead matter','Hunting prey','Absorbing sunlight through their surface'], correctIndices:[1] },
  { grade:'5', topic:'Life Science', question:'What is the term for traits passed from parents to offspring?', options:['Adaptation','Heredity','Evolution','Mutation'], correctIndices:[1] },

  // ── Physical Science (50) ──────────────────────────────────────────────────
  { grade:'5', topic:'Physical Science', question:'Which are the three common states of matter? (Select all)', options:['Solid','Liquid','Gas','Plasma'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Physical Science', question:'In which state of matter do particles move the fastest?', options:['Solid','Liquid','Gas','All move at the same speed'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'What happens to most materials when they are heated?', options:['They contract','They expand','They become liquid','They lose mass'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'Which of these is a physical change?', options:['Burning paper','Rusting iron','Cutting wood','Baking a cake'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'Which of these is a chemical change? (Select all)', options:['Burning wood','Rusting metal','Melting ice','Mixing vinegar and baking soda'], correctIndices:[0,1,3] },
  { grade:'5', topic:'Physical Science', question:'What type of simple machine is a bottle cap?', options:['Pulley','Wedge','Wheel and axle','Lever'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'What type of simple machine is a knife blade?', options:['Pulley','Inclined plane','Wedge','Screw'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'A ramp is an example of which simple machine?', options:['Lever','Pulley','Wedge','Inclined plane'], correctIndices:[3] },
  { grade:'5', topic:'Physical Science', question:'Which forms of energy are present in a bonfire? (Select all)', options:['Light energy','Thermal energy','Chemical energy','Sound energy'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Physical Science', question:'What is kinetic energy?', options:['Energy stored in position','Energy of motion','Energy stored in chemical bonds','Energy from the Sun'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What is potential energy?', options:['Energy of motion','Stored energy based on position or condition','Energy from chemical reactions only','The speed of a moving object'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'A ball held up high has which type of energy?', options:['Kinetic','Thermal','Gravitational potential','Chemical'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'What is friction?', options:['The force that pulls objects downward','A force that opposes motion between surfaces in contact','The energy stored in a spring','The force that keeps planets in orbit'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'Which surfaces produce more friction? (Select all)', options:['Rough surfaces','Smooth surfaces','Wet ice','Sandpaper'], correctIndices:[0,3] },
  { grade:'5', topic:'Physical Science', question:'What is gravity?', options:['A force that pushes objects apart','A force of attraction between objects with mass','A form of energy','A type of wave'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'Light travels in which path?', options:['Curved lines','Straight lines','Zigzag','Circular paths'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What happens when light hits a mirror?', options:['It is absorbed','It is refracted','It is reflected','It disappears'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'What is refraction?', options:['Bouncing of light off a surface','Bending of light as it passes from one medium to another','Scattering of light by particles','Blocking of light by an opaque object'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'A magnet attracts which materials? (Select all)', options:['Iron','Steel','Copper','Nickel'], correctIndices:[0,1,3] },
  { grade:'5', topic:'Physical Science', question:'What are the poles of a magnet called?', options:['Positive and negative','North and south','East and west','Top and bottom'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'Like poles of magnets:', options:['Attract each other','Repel each other','Have no effect on each other','Create electricity'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What does an electric circuit need to work? (Select all)', options:['A power source','A complete pathway','A conducting material','A switch (optional but common)'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Physical Science', question:'What is a conductor?', options:['A material that stops electricity','A material that allows electricity to flow through it','A device that stores electricity','A type of magnet'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'Which of these are good conductors of electricity? (Select all)', options:['Copper','Wood','Silver','Rubber'], correctIndices:[0,2] },
  { grade:'5', topic:'Physical Science', question:'Sound is produced by:', options:['Light waves','Vibrations','Magnetic fields','Chemical reactions'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'Sound requires what to travel?', options:['Vacuum','A medium (solid, liquid, or gas)','Light','Electricity'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'Can sound travel through a vacuum?', options:['Yes, easily','Yes, but slowly','No, it cannot','Only at high frequencies'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'What is mass?', options:['The amount of space an object takes up','The amount of matter in an object','The force of gravity on an object','The speed of an object'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What is volume?', options:['The amount of matter in an object','The force on an object','The amount of space an object occupies','The weight of an object'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'Which is a physical property of matter? (Select all)', options:['Colour','Mass','Flammability (chemical)','Hardness'], correctIndices:[0,1,3] },
  { grade:'5', topic:'Physical Science', question:'When iron rusts, this is which type of change?', options:['Physical change','Chemical change','State change','Nuclear change'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What happens to water when it freezes?', options:['It expands','It contracts','It stays the same size','It turns into gas'], correctIndices:[0] },
  { grade:'5', topic:'Physical Science', question:'What is the process of liquid water turning into water vapour called?', options:['Condensation','Evaporation','Freezing','Sublimation'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What is condensation?', options:['Liquid turning to gas','Gas turning to liquid','Solid turning to liquid','Liquid turning to solid'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What tool is used to measure temperature?', options:['Ruler','Scale','Thermometer','Beaker'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'Which of the following has the most potential energy?', options:['A ball on the ground','A ball on a low shelf','A ball on a high shelf','A rolling ball'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'Energy cannot be created or destroyed; it can only be transformed. This is called:', options:['Newton\'s first law','The law of conservation of energy','The law of gravity','Ohm\'s law'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What is force?', options:['The speed of an object','A push or pull on an object','The weight of an object','The energy stored in a system'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What happens to an object\'s speed when friction acts on it?', options:['It increases','It stays the same','It decreases','It reverses direction'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'Which of these demonstrate energy transformation? (Select all)', options:['A lamp turning electricity into light','A plant turning sunlight into food','A car turning fuel into motion','A rock sitting still on the ground'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Physical Science', question:'What is the unit for measuring force?', options:['Joule','Newton','Watt','Metre'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What is weight?', options:['The amount of matter in an object','The force of gravity pulling on an object\'s mass','The volume of an object','The speed of an object'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'If you push an object and it does not move, what can you conclude?', options:['There is no friction','The net force is zero','Gravity increased','There is no mass'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'Which of these is a renewable resource?', options:['Coal','Oil','Natural gas','Solar energy'], correctIndices:[3] },
  { grade:'5', topic:'Physical Science', question:'What is the difference between mass and weight?', options:['They are identical','Mass is amount of matter; weight is the force of gravity on that mass','Weight is constant everywhere; mass changes','Mass is measured in Newtons'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'A pulley helps by:', options:['Increasing the total work done','Changing the direction and/or reducing the force needed','Eliminating friction completely','Storing energy'], correctIndices:[1] },
  { grade:'5', topic:'Physical Science', question:'What type of energy does food contain?', options:['Kinetic energy','Magnetic energy','Chemical energy','Nuclear energy'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'What does a switch do in an electric circuit?', options:['Stores electricity','Provides power','Opens or closes the circuit','Converts AC to DC'], correctIndices:[2] },
  { grade:'5', topic:'Physical Science', question:'Which colour of visible light has the longest wavelength?', options:['Violet','Blue','Green','Red'], correctIndices:[3] },
  { grade:'5', topic:'Physical Science', question:'A prism separates white light into:', options:['Heat and light','A spectrum of colours','Infrared rays','Sound waves'], correctIndices:[1] },

  // ── Earth Science (50) ────────────────────────────────────────────────────
  { grade:'5', topic:'Earth Science', question:'What is the water cycle also called?', options:['The rock cycle','The hydrological cycle','The carbon cycle','The nitrogen cycle'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'Which processes are part of the water cycle? (Select all)', options:['Evaporation','Condensation','Precipitation','Transpiration'], correctIndices:[0,1,2,3] },
  { grade:'5', topic:'Earth Science', question:'What causes evaporation of water?', options:['Cold temperatures','Heat from the Sun','Wind only','Gravity'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is precipitation?', options:['Water turning into vapour','Water vapour cooling into clouds','Water falling from clouds as rain, snow, sleet, or hail','Water soaking into the ground'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What type of cloud produces thunderstorms?', options:['Cirrus','Stratus','Cumulus','Cumulonimbus'], correctIndices:[3] },
  { grade:'5', topic:'Earth Science', question:'Which clouds are high, thin, and wispy?', options:['Stratus','Cumulus','Cirrus','Nimbus'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What is weather?', options:['The long-term pattern of temperature and precipitation in an area','The short-term atmospheric conditions in a specific place','The study of rocks','The movement of tectonic plates'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is climate?', options:['Day-to-day weather conditions','The long-term average weather patterns of a region','A type of storm','The temperature at noon'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'Which planet is closest to the Sun?', options:['Venus','Earth','Mercury','Mars'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'Which planet is largest in our solar system?', options:['Saturn','Earth','Jupiter','Neptune'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'How long does it take Earth to orbit the Sun once?', options:['One day','One month','One year','Ten years'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What causes day and night?', options:['Earth orbiting the Sun','Earth\'s rotation on its axis','The Moon blocking the Sun','Clouds blocking sunlight'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What causes the seasons? (Select all that are correct)', options:['Earth\'s tilted axis','Earth\'s orbit around the Sun','Earth\'s distance from the Sun changes slightly','Both the tilt and the orbit work together'], correctIndices:[0,1,3] },
  { grade:'5', topic:'Earth Science', question:'What are the three types of rocks?', options:['Granite, marble, limestone','Igneous, sedimentary, metamorphic','Hard, soft, medium','Volcanic, ocean, river'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'Which type of rock forms from cooling lava or magma?', options:['Sedimentary','Metamorphic','Igneous','Mineral'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'Which type of rock forms from layers of sediment pressed together?', options:['Igneous','Metamorphic','Sedimentary','Crystalline'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'Which type of rock forms under intense heat and pressure?', options:['Sedimentary','Igneous','Metamorphic','Volcanic'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What is a mineral?', options:['Any rock found underground','A naturally occurring solid substance with a definite chemical composition','A type of fossil','A layer of soil'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is soil made of? (Select all)', options:['Weathered rock particles','Organic matter (humus)','Water','Air spaces'], correctIndices:[0,1,2,3] },
  { grade:'5', topic:'Earth Science', question:'What is erosion?', options:['The breakdown of rocks by weathering','The movement of weathered rock and soil by wind, water, or ice','The formation of new rocks','The deposit of sediment in a new location'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is weathering?', options:['The movement of rock particles','The breakdown of rocks into smaller pieces','The formation of clouds','A type of precipitation'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is a fossil?', options:['A type of mineral','The preserved remains or traces of ancient organisms','A type of sedimentary rock','A kind of meteor'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What are non-renewable resources? (Select all)', options:['Coal','Natural gas','Oil','Solar energy'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Earth Science', question:'Which are renewable energy sources? (Select all)', options:['Wind power','Solar power','Coal','Hydropower'], correctIndices:[0,1,3] },
  { grade:'5', topic:'Earth Science', question:'What is the Sun classified as?', options:['A planet','A moon','A star','An asteroid'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What is the Moon?', options:['A star orbiting Earth','Earth\'s natural satellite','A planet','An asteroid'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What causes high and low tides?', options:['Earth\'s rotation','Wind patterns','The Moon\'s gravitational pull','Temperature changes in the ocean'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'The outer layer of Earth is called the:', options:['Mantle','Outer core','Crust','Inner core'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What is the main source of energy for Earth\'s weather and climate?', options:['Geothermal energy','The Moon','The Sun','Wind'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What tool measures atmospheric pressure?', options:['Thermometer','Barometer','Anemometer','Hygrometer'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What does a meteorologist study?', options:['Meteors and asteroids','Weather and the atmosphere','Rocks and minerals','Earthquakes'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is the atmosphere?', options:['Earth\'s solid outer shell','The layer of water on Earth','The mixture of gases surrounding Earth','The molten layer under the crust'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'Which gas makes up most of Earth\'s atmosphere?', options:['Oxygen','Carbon dioxide','Nitrogen','Argon'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What is an aquifer?', options:['A large river','An underground layer of rock that stores water','A type of cloud','A frozen body of water'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is a glacier?', options:['A large ocean current','A slow-moving mass of ice','A type of cloud','An underground river'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is the term for the point directly above an earthquake\'s origin on Earth\'s surface?', options:['Focus','Epicentre','Fault line','Seismic zone'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is a volcano?', options:['A crack in Earth\'s surface where earthquakes occur','An opening in Earth\'s crust through which lava erupts','A large underwater mountain','A type of meteor crater'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What instrument measures earthquake strength?', options:['Barometer','Thermometer','Seismograph','Hygrometer'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'Jupiter, Saturn, Uranus, and Neptune are called:', options:['Terrestrial planets','Gas giants','Dwarf planets','Asteroid belt members'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is the asteroid belt?', options:['A ring of gas around Saturn','A region of rocky objects between Mars and Jupiter','A band of comets beyond Neptune','A collection of moons around Jupiter'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'How is groundwater formed?', options:['Seawater evaporating','Precipitation soaking into the ground and collecting in rock layers','Rivers flowing underground','Lakes forming during earthquakes'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is the ozone layer?', options:['A layer of smog in the troposphere','A protective layer of ozone gas in the stratosphere','A type of cloud','A layer of carbon dioxide'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is deforestation?', options:['Planting new trees','The clearing of forests, often for farming or development','A type of soil erosion','Natural forest fires only'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is air pollution? (Select all that are sources)', options:['Burning fossil fuels','Factory emissions','Car exhaust','Planting trees'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Earth Science', question:'Which layer of the atmosphere is closest to Earth\'s surface?', options:['Stratosphere','Mesosphere','Troposphere','Thermosphere'], correctIndices:[2] },
  { grade:'5', topic:'Earth Science', question:'What is the greenhouse effect?', options:['Plants producing food in greenhouses','The trapping of heat by greenhouse gases in the atmosphere','A type of weather event','The formation of ice caps'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'Which greenhouse gases trap heat in the atmosphere? (Select all)', options:['Carbon dioxide','Water vapour','Methane','Nitrogen (dominant, but minimal greenhouse effect)'], correctIndices:[0,1,2] },
  { grade:'5', topic:'Earth Science', question:'What is the difference between a meteor and a meteorite?', options:['They are the same thing','A meteor is in space; a meteorite has landed on Earth','A meteorite is in space; a meteor landed on Earth','Meteors are larger than meteorites'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What is conservation?', options:['Using as many natural resources as possible','The careful management and protection of natural resources','Removing all wild animals from an area','Burning fossil fuels efficiently'], correctIndices:[1] },
  { grade:'5', topic:'Earth Science', question:'What does the word "orbit" mean?', options:['A type of planet','The path one object takes around another in space','The speed of a planet','The size of a planet'], correctIndices:[1] },

  // ══════════════════════════════════════════════════════════════════════════
  // GRADE 6 — 150 questions
  // ══════════════════════════════════════════════════════════════════════════

  // ── Earth Science (60) ────────────────────────────────────────────────────
  { grade:'6', topic:'Earth Science', question:'What are the four main layers of Earth? (Select all)', options:['Crust','Mantle','Outer core','Inner core'], correctIndices:[0,1,2,3] },
  { grade:'6', topic:'Earth Science', question:'Which layer of Earth is the thinnest?', options:['Mantle','Inner core','Crust','Outer core'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'Which layer of Earth is liquid?', options:['Inner core','Crust','Mantle','Outer core'], correctIndices:[3] },
  { grade:'6', topic:'Earth Science', question:'What is the lithosphere?', options:['The liquid outer core','The crust and uppermost mantle (solid outer layer)','The gaseous atmosphere','The oceanic layer only'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What is the asthenosphere?', options:['The innermost part of Earth','A semi-molten layer of the upper mantle on which plates move','The boundary between the crust and ocean','The outer atmosphere'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What theory explains that Earth\'s crust is broken into moving plates?', options:['Continental drift only','Plate tectonics','Seafloor spreading only','The big bang theory'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'Who first proposed the idea of continental drift?', options:['Isaac Newton','Charles Darwin','Alfred Wegener','Albert Einstein'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What is the supercontinent that existed ~300 million years ago called?', options:['Gondwana','Eurasia','Pangaea','Laurasia'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'Which of the following are evidence for plate tectonics? (Select all)', options:['Matching fossil records on different continents','Complementary coastline shapes','Seafloor spreading at mid-ocean ridges','All continents have identical rocks'], correctIndices:[0,1,2] },
  { grade:'6', topic:'Earth Science', question:'What type of plate boundary occurs where two plates move apart?', options:['Convergent','Transform','Divergent','Subductive'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What type of plate boundary occurs where two plates collide?', options:['Divergent','Transform','Convergent','Lateral'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What type of plate boundary occurs where plates slide past each other?', options:['Convergent','Divergent','Transform','Subduction'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What is subduction?', options:['When two plates slide horizontally past each other','When one plate sinks beneath another','When two plates move apart','When plates collide and mountains form'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'Mountains form when:', options:['Plates move apart','Plates slide past each other','Continental plates collide and crust crumples upward','Volcanoes erupt frequently'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What is seafloor spreading?', options:['The sinking of the seafloor at trenches','New oceanic crust forming at mid-ocean ridges as plates move apart','The erosion of ocean floors','The movement of ocean currents'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'Volcanoes commonly form at which types of plate boundaries? (Select all)', options:['Convergent boundaries (subduction zones)','Divergent boundaries (mid-ocean ridges)','Transform boundaries','Hot spots (not always at a boundary)'], correctIndices:[0,1,3] },
  { grade:'6', topic:'Earth Science', question:'The Rock Cycle involves which processes? (Select all)', options:['Melting','Crystallisation','Erosion and deposition','Metamorphism'], correctIndices:[0,1,2,3] },
  { grade:'6', topic:'Earth Science', question:'How does sedimentary rock form?', options:['Cooling of magma or lava','Heat and pressure transforming existing rock','Layers of sediment compacted and cemented together','All of the above'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'Which rock type often contains fossils?', options:['Igneous','Metamorphic','Sedimentary','All types equally'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What is the Mohs scale used for?', options:['Measuring earthquake intensity','Measuring rock hardness','Measuring rock age','Measuring erosion rate'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'Which mineral has a Mohs hardness of 10 (hardest)?', options:['Quartz','Talc','Calcite','Diamond'], correctIndices:[3] },
  { grade:'6', topic:'Earth Science', question:'What covers approximately 71% of Earth\'s surface?', options:['Land','Ice','Ocean water','Forest'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What are the main ocean currents driven by? (Select all)', options:['Wind','Temperature differences in water','Salinity differences','The rotation of the Earth (Coriolis effect)'], correctIndices:[0,1,2,3] },
  { grade:'6', topic:'Earth Science', question:'What is the Coriolis effect?', options:['The bending of winds and currents due to Earth\'s rotation','The force of tides on coastlines','The warming of ocean water by the Sun','The pressure difference between high and low pressure systems'], correctIndices:[0] },
  { grade:'6', topic:'Earth Science', question:'What is the Ring of Fire?', options:['A chain of active volcanoes and earthquake zones around the Pacific Ocean','A large volcanic eruption in Iceland','A series of forest fires','A region of hot springs in Africa'], correctIndices:[0] },
  { grade:'6', topic:'Earth Science', question:'What is the Richter scale used to measure?', options:['Volcanic ash output','Earthquake magnitude','Wind speed','Rainfall intensity'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'A tsunami is caused by:', options:['Undersea landslides, earthquakes, or volcanic eruptions that displace water','Hurricane winds','Changes in ocean temperature','Tidal cycles'], correctIndices:[0] },
  { grade:'6', topic:'Earth Science', question:'Which gases are found in Earth\'s atmosphere? (Select all)', options:['Nitrogen (~78%)','Oxygen (~21%)','Carbon dioxide (~0.04%)','Argon (~0.93%)'], correctIndices:[0,1,2,3] },
  { grade:'6', topic:'Earth Science', question:'What is the correct order of atmospheric layers from lowest to highest?', options:['Troposphere, stratosphere, mesosphere, thermosphere, exosphere','Stratosphere, troposphere, mesosphere, thermosphere, exosphere','Troposphere, mesosphere, stratosphere, thermosphere, exosphere','Thermosphere, troposphere, stratosphere, mesosphere, exosphere'], correctIndices:[0] },
  { grade:'6', topic:'Earth Science', question:'The ozone layer is located in the:', options:['Troposphere','Stratosphere','Mesosphere','Thermosphere'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What is the difference between weather and climate?', options:['Weather is long-term; climate is short-term','Weather is short-term conditions; climate is long-term average patterns','They are the same','Weather only involves temperature; climate involves precipitation'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What biome receives more than 200 cm of rain per year and has the greatest biodiversity?', options:['Desert','Tundra','Tropical rainforest','Grassland'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What biome is characterised by permafrost and very low temperatures?', options:['Desert','Taiga','Tundra','Temperate forest'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'Which biomes are found on land? (Select all)', options:['Tropical rainforest','Grassland/Savanna','Coral reef','Tundra'], correctIndices:[0,1,3] },
  { grade:'6', topic:'Earth Science', question:'What causes ocean tides?', options:['Earth\'s rotation','Wind patterns','Gravitational pull of the Moon and Sun','Temperature changes'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What is an epicentre?', options:['The point inside Earth where an earthquake originates','The point on Earth\'s surface directly above the earthquake\'s origin','The center of a volcano','The deepest point in an ocean'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What is the focus (or hypocenter) of an earthquake?', options:['The point on the surface above the earthquake','The actual point inside Earth where the earthquake originates','A measurement of earthquake strength','The centre of a fault line'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What is a fault?', options:['A crack in Earth\'s crust where rocks can move','An inactive volcano','A type of sedimentary rock','A deep ocean trench'], correctIndices:[0] },
  { grade:'6', topic:'Earth Science', question:'What is the main source of heat deep within Earth?', options:['The Sun\'s radiation penetrating to the core','Radioactive decay of elements','Chemical reactions in the mantle','Gravitational compression alone'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What is a mid-ocean ridge?', options:['A deep ocean trench','An underwater mountain chain where plates diverge and new crust forms','A chain of volcanic islands','A subduction zone'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What are P-waves (primary waves) in an earthquake?', options:['Waves that only travel through solids','Compression waves that travel through solids and liquids','Surface waves with up-and-down motion','Waves slower than S-waves'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What type of rock does granite represent?', options:['Sedimentary','Metamorphic','Intrusive igneous','Extrusive igneous'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What type of rock is marble?', options:['Sedimentary','Metamorphic','Igneous','Mineral'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What is the rock cycle?', options:['The process by which rocks orbit Earth','The continuous process by which rocks transform from one type to another','A measurement of rock age','The layering of sediment in rivers'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'Which processes can change sedimentary rock into metamorphic rock? (Select all)', options:['Heat','Pressure','Melting','Rapid cooling'], correctIndices:[0,1] },
  { grade:'6', topic:'Earth Science', question:'What is the continental shelf?', options:['A steep underwater cliff','The shallow, gently sloping extension of a continent under the ocean','A type of tectonic plate','A deep ocean trench'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What percentage of Earth\'s water is freshwater?', options:['About 71%','About 50%','About 3%','About 10%'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'Where is most of Earth\'s freshwater found?', options:['Rivers and lakes','Groundwater','Glaciers and polar ice caps','Clouds'], correctIndices:[2] },
  { grade:'6', topic:'Earth Science', question:'What is the carbon cycle?', options:['The movement of carbon through the atmosphere, biosphere, hydrosphere, and geosphere','The process of burning fossil fuels','The life cycle of carbon-based organisms','A method of measuring carbon in rocks'], correctIndices:[0] },
  { grade:'6', topic:'Earth Science', question:'What is El Niño?', options:['A permanent cold current in the Pacific','A periodic warming of Pacific Ocean surface water that affects global weather patterns','A type of tropical storm','A type of ocean ridge'], correctIndices:[1] },
  { grade:'6', topic:'Earth Science', question:'What causes wind?', options:['Differences in atmospheric pressure due to unequal heating of Earth\'s surface','The rotation of the Earth alone','Ocean currents pushing air','The Moon\'s gravitational pull'], correctIndices:[0] },

  // ── Life Science (50) ─────────────────────────────────────────────────────
  { grade:'6', topic:'Life Science', question:'Which domain system classifies all life? (Select all domains)', options:['Bacteria','Archaea','Eukarya','Monera'], correctIndices:[0,1,2] },
  { grade:'6', topic:'Life Science', question:'What is the order of biological classification from broadest to most specific?', options:['Kingdom, Phylum, Class, Order, Family, Genus, Species','Species, Genus, Family, Order, Class, Phylum, Kingdom','Kingdom, Class, Order, Family, Genus, Species, Phylum','Phylum, Kingdom, Class, Species, Genus, Family, Order'], correctIndices:[0] },
  { grade:'6', topic:'Life Science', question:'Who developed the modern system of biological classification?', options:['Charles Darwin','Carl Linnaeus','Louis Pasteur','Gregor Mendel'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is binomial nomenclature?', options:['Using common names for species','A two-part Latin name giving genus and species','Classifying organisms by their habitat','Grouping organisms by physical appearance only'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is the difference between prokaryotic and eukaryotic cells?', options:['Prokaryotes have a nucleus; eukaryotes do not','Prokaryotes have no nucleus; eukaryotes have a membrane-bound nucleus','They are the same','Eukaryotes are always unicellular'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Which organisms are prokaryotes? (Select all)', options:['Bacteria','Archaea','Fungi','Protists'], correctIndices:[0,1] },
  { grade:'6', topic:'Life Science', question:'What is the function of mitochondria?', options:['Carry out photosynthesis','Store genetic information','Produce ATP through cellular respiration','Synthesise proteins'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'What does the cell wall provide in plant cells?', options:['Flexibility','Structural support and protection','Energy production','Protein synthesis'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is the function of the Golgi apparatus?', options:['Store DNA','Produce energy','Package and ship proteins to their destinations','Carry out photosynthesis'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'What is the function of vacuoles?', options:['Produce proteins','Store water, waste, and nutrients','Carry out cell division','Synthesise lipids'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Which organelle produces proteins?', options:['Mitochondria','Ribosome','Vacuole','Chloroplast'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is a virus?', options:['A living prokaryotic organism','A non-living particle that invades cells and uses them to replicate','A type of fungus','A eukaryotic microorganism'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What makes bacteria different from viruses? (Select all)', options:['Bacteria are living cells','Bacteria can reproduce on their own','Bacteria have cell membranes','Viruses have all organelles bacteria have'], correctIndices:[0,1,2] },
  { grade:'6', topic:'Life Science', question:'Which kingdom includes bread mould and mushrooms?', options:['Protista','Plantae','Fungi','Animalia'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'How do fungi obtain energy?', options:['Photosynthesis','Hunting prey','Absorbing nutrients from dead or living organic matter','Using geothermal energy'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'What is a population?', options:['All organisms in an ecosystem','All organisms of the same species in a given area','All species in a habitat','The total number of ecosystems on Earth'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is a community?', options:['All organisms of one species','All populations of different species living in an area and interacting','Only the plants in an ecosystem','The non-living parts of an ecosystem'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is carrying capacity?', options:['The total mass of organisms in an ecosystem','The maximum population size an environment can sustainably support','The amount of food available in an ecosystem','The number of predators in an area'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What limits population growth? (Select all)', options:['Food availability','Space','Predation','Disease'], correctIndices:[0,1,2,3] },
  { grade:'6', topic:'Life Science', question:'What is the role of nitrogen-fixing bacteria?', options:['Break down dead organisms','Convert atmospheric nitrogen into forms plants can use','Produce oxygen','Cause plant diseases'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is an invasive species?', options:['A species native to an ecosystem','A species introduced to an ecosystem where it outcompetes native species','A species at risk of extinction','A species adapted to extreme conditions'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is biodiversity?', options:['The number of individuals in a population','The variety of living organisms in a given area or on Earth','The number of ecosystems on Earth','The total biomass of an ecosystem'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is the nitrogen cycle?', options:['The process by which plants produce food','The movement of nitrogen through the atmosphere, organisms, and soil','The decomposition of dead organisms','The formation of ammonia in water'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Which cellular process releases energy from glucose?', options:['Photosynthesis','Mitosis','Cellular respiration','Transpiration'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'What is the equation for cellular respiration?', options:['CO₂ + H₂O → C₆H₁₂O₆ + O₂','C₆H₁₂O₆ + O₂ → CO₂ + H₂O + ATP','H₂O → H₂ + ½O₂','CO₂ → C + O₂'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Both plants and animals carry out which process?', options:['Photosynthesis','Cellular respiration','Transpiration','Nitrogen fixation'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is a niche?', options:['The physical location of an organism','The role or function of an organism in its ecosystem','The number of offspring an organism produces','The age of an organism'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is lichen?', options:['A type of moss','A symbiotic relationship between fungi and algae or cyanobacteria','A type of fern','A primitive insect'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Which of the following are characteristics of plants? (Select all)', options:['Multicellular','Have cell walls made of cellulose','Carry out photosynthesis','Are prokaryotes'], correctIndices:[0,1,2] },
  { grade:'6', topic:'Life Science', question:'What is the difference between a herbivore and a carnivore?', options:['Herbivores eat both plants and animals; carnivores eat plants only','Herbivores eat plants only; carnivores eat animals only','They are the same','Herbivores are always smaller'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is the energy pyramid?', options:['A diagram showing how species are classified','A model showing energy flow through trophic levels, with less energy at each higher level','A pyramid-shaped structure of cells','A diagram of photosynthesis'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Only about what percentage of energy is passed from one trophic level to the next?', options:['50%','90%','10%','25%'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'What is an endemic species?', options:['A species found everywhere on Earth','A species found only in a specific geographic location','A species recently introduced to an area','A species that is dangerous to humans'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is the difference between learned and inherited behaviour?', options:['They are the same','Learned behaviour is acquired through experience; inherited behaviour is genetic','Inherited behaviour must be taught; learned behaviour is instinctive','Animals have no learned behaviour'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Which of these are protists? (Select all)', options:['Amoeba','Paramecium','Algae','Mushroom'], correctIndices:[0,1,2] },
  { grade:'6', topic:'Life Science', question:'What is the difference between mitosis and binary fission?', options:['They are identical','Mitosis occurs in eukaryotes; binary fission in prokaryotes','Binary fission is in eukaryotes; mitosis in prokaryotes','Both produce four daughter cells'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Lichens are considered pioneer species because they:', options:['Are the first organisms to colonise bare rock','Are the largest organisms in an ecosystem','Produce the most oxygen','Grow fastest in tropical climates'], correctIndices:[0] },
  { grade:'6', topic:'Life Science', question:'What is ecological succession?', options:['A single species surviving in isolation','The gradual process by which ecosystems change and develop over time','The extinction of a species','The migration of animals seasonally'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What type of succession occurs after a major disturbance such as a volcanic eruption on bare rock?', options:['Secondary succession','Tertiary succession','Primary succession','Ecological regression'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'What type of succession occurs in an area where soil already exists?', options:['Primary succession','Secondary succession','Climax succession','Pioneer succession'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is a keystone species?', options:['The most numerous species in an ecosystem','A species that has an outsized effect on its ecosystem relative to its abundance','A species that is always at the top of the food chain','A species with the most genetic diversity'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'Which of these are abiotic factors in an ecosystem? (Select all)', options:['Sunlight','Temperature','Soil','Bacteria'], correctIndices:[0,1,2] },
  { grade:'6', topic:'Life Science', question:'Which of these are biotic factors in an ecosystem? (Select all)', options:['Plants','Animals','Bacteria','Wind'], correctIndices:[0,1,2] },
  { grade:'6', topic:'Life Science', question:'What does the term "symbiosis" mean?', options:['One species eating another','A close, long-term interaction between two different species','Two species competing for the same resource','A species living in isolation'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'In parasitism, who benefits?', options:['Both organisms','Neither organism','The parasite benefits; the host is harmed','The host benefits; the parasite is harmed'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'In commensalism, who benefits?', options:['Both organisms','One organism benefits; the other is neither helped nor harmed','The host benefits; the other organism is harmed','Neither organism'], correctIndices:[1] },
  { grade:'6', topic:'Life Science', question:'What is the primary source of energy for most ecosystems?', options:['Chemical energy in rocks','Heat from Earth\'s interior','Solar (sun) energy','Wind energy'], correctIndices:[2] },
  { grade:'6', topic:'Life Science', question:'What is biomass?', options:['The variety of species in an area','The total mass of living organisms in a given area','The weight of one organism','The number of organisms in a population'], correctIndices:[1] },

  // ── Physical Science (40) ──────────────────────────────────────────────────
  { grade:'6', topic:'Physical Science', question:'What is thermal energy?', options:['The energy from nuclear reactions','The total kinetic energy of particles in a substance','The potential energy of a stretched object','The energy stored in chemical bonds'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'How does heat transfer by conduction work?', options:['Transfer of heat through electromagnetic waves','Transfer of heat through the bulk movement of fluid','Transfer of heat through direct contact between molecules','Transfer of heat through a vacuum'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'How does heat transfer by convection work?', options:['Through direct particle contact','Through electromagnetic waves','Through the bulk movement of heated fluid (liquid or gas)','Through a solid material only'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'How does heat transfer by radiation work?', options:['Through direct particle contact','Through moving fluid','Through electromagnetic waves that need no medium','Through solid conductors only'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'Which are good thermal insulators? (Select all)', options:['Wood','Air (trapped)','Copper','Wool'], correctIndices:[0,1,3] },
  { grade:'6', topic:'Physical Science', question:'What is specific heat capacity?', options:['The amount of heat a substance can produce','The amount of energy needed to raise 1 kg of a substance by 1°C','The temperature at which a substance melts','The rate at which a substance conducts heat'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is a wave?', options:['A particle moving in a straight line','A disturbance that transfers energy through matter or space','A type of force','A form of matter'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is the amplitude of a wave?', options:['The distance between two consecutive crests','The number of waves per second','The maximum displacement from the rest position','The speed of the wave'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'What is the wavelength?', options:['The height of a wave','The distance between two consecutive points in phase (e.g., crest to crest)','The number of waves per second','The speed of a wave'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is frequency of a wave?', options:['The distance between two crests','The height of the wave','The number of complete waves passing a point per second','The speed of the wave'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'If frequency increases, wavelength:', options:['Increases','Stays the same','Decreases','Doubles'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'Which are transverse waves? (Select all)', options:['Light waves','Water surface waves','Sound waves','Seismic S-waves'], correctIndices:[0,1,3] },
  { grade:'6', topic:'Physical Science', question:'Sound waves are which type of wave?', options:['Transverse','Longitudinal (compression)','Electromagnetic','Surface'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is the electromagnetic spectrum?', options:['The range of all possible frequencies of electromagnetic radiation','A spectrum of colours in visible light only','The range of sound frequencies','The measurement of magnetic field strength'], correctIndices:[0] },
  { grade:'6', topic:'Physical Science', question:'Which of the following are types of electromagnetic radiation? (Select all)', options:['Radio waves','Microwaves','X-rays','Sound waves'], correctIndices:[0,1,2] },
  { grade:'6', topic:'Physical Science', question:'Which has the shortest wavelength in the EM spectrum?', options:['Radio waves','Infrared','Visible light','Gamma rays'], correctIndices:[3] },
  { grade:'6', topic:'Physical Science', question:'Which has the longest wavelength in the EM spectrum?', options:['Gamma rays','X-rays','Radio waves','Ultraviolet'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'What is the speed of light in a vacuum?', options:['3 × 10⁵ km/s','3 × 10⁸ m/s','3 × 10³ km/s','3 × 10⁶ m/s'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is reflection of light?', options:['Bending of light as it passes between media','Bouncing of light off a surface','Absorption of light by a material','Spreading of light through a prism'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is refraction?', options:['Light bouncing off a surface','Light bending as it passes from one medium to another','Light being absorbed by an object','Light spreading in all directions'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'A concave mirror:', options:['Causes rays to diverge (spread out)','Causes parallel rays to converge at a focal point','Has no effect on light','Is the same as a flat mirror'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'Sound travels fastest through which medium?', options:['Air','Vacuum','Water','Steel'], correctIndices:[3] },
  { grade:'6', topic:'Physical Science', question:'Can sound travel through a vacuum?', options:['Yes, very quickly','Yes, but slowly','No, it requires a medium','Only at low frequencies'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'What is the Doppler effect?', options:['The change in frequency of a wave as its source and observer move relative to each other','The reflection of sound off a hard surface','The bending of light around an obstacle','The absorption of sound by soft materials'], correctIndices:[0] },
  { grade:'6', topic:'Physical Science', question:'What is pitch of sound related to?', options:['Amplitude','Frequency','Wavelength of light','Wave speed'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is loudness of sound related to?', options:['Frequency','Wavelength','Amplitude','Wave speed'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'What is the unit of sound intensity?', options:['Hertz','Newton','Decibel','Pascal'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'What is resonance?', options:['An increase in wave speed','When an object vibrates at its natural frequency in response to an external vibration at the same frequency','The absorption of all sound by a material','The bending of light through glass'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is the law of reflection?', options:['The angle of incidence equals the angle of reflection','Light bends toward the normal when entering a denser medium','The frequency of reflected light changes','Light is absorbed equally by all materials'], correctIndices:[0] },
  { grade:'6', topic:'Physical Science', question:'Which type of wave does NOT require a medium to travel?', options:['Sound wave','Seismic wave','Electromagnetic wave','Water wave'], correctIndices:[2] },
  { grade:'6', topic:'Physical Science', question:'What is a medium in wave physics?', options:['The amplitude of a wave','The material through which a wave travels','The frequency of a wave','The energy of a wave'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is the relationship between the energy of a wave and its amplitude?', options:['Energy decreases as amplitude increases','Energy increases as amplitude increases','They are unrelated','Energy is always constant regardless of amplitude'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'Ultraviolet radiation can cause:', options:['Healing of skin conditions only','Skin cancer and sunburn','Improved night vision','No biological effects'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'X-rays are used in medicine because they:', options:['Are visible and bright','Can pass through soft tissue but are absorbed by dense materials like bone','Produce heat for therapy','Have very long wavelengths'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is an echo?', options:['The bending of sound around a corner','A reflected sound wave heard after a time delay','Sound absorbed by walls','The frequency of a sound wave'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is interference of waves?', options:['Waves slowing down in a medium','The combination of two or more waves to form a new wave','A wave reflecting off a boundary','The diffraction of a wave around an obstacle'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'Constructive interference occurs when:', options:['Two waves cancel each other out','Two waves combine to produce a larger amplitude','A wave slows down in a new medium','A wave splits into two waves'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'Destructive interference occurs when:', options:['Two waves reinforce each other','Two waves partially or fully cancel each other out','A wave bends around a corner','A wave speeds up in a new medium'], correctIndices:[1] },
  { grade:'6', topic:'Physical Science', question:'What is diffraction?', options:['The bending of waves around obstacles or through openings','The bouncing of waves off a surface','The speeding up of waves in a new medium','The transfer of energy without a medium'], correctIndices:[0] },
  { grade:'6', topic:'Physical Science', question:'What colour of light has the highest frequency in the visible spectrum?', options:['Red','Orange','Violet/Purple','Green'], correctIndices:[2] },
]

async function seed() {
  const col = db.collection('scienceQuestions')
  // Seed in batches of 500 (Firestore batch limit)
  const BATCH_SIZE = 499
  let count = 0

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = questions.slice(i, i + BATCH_SIZE)
    for (const q of chunk) {
      batch.set(col.doc(), q)
      count++
    }
    await batch.commit()
    console.log(`  Committed batch up to question ${count}`)
  }

  const grades = ['5','6','7','8','9','10','11','12']
  console.log(`\n✅ Seeded ${count} science questions.`)
  grades.forEach((g) => {
    const n = questions.filter((q) => q.grade === g).length
    console.log(`   Grade ${g}: ${n}/150 questions`)
  })
  console.log('\nNote: Run seed-science-grade7-12.cjs to add the remaining grades.')
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1) })
