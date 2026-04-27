/**
 * Supplement seed: Science questions for Grades 9 & 10 (55 questions)
 * Adds missing questions so each grade reaches 150 total (38 imageUrl, 38 multi-select).
 * Run AFTER seed-science-grade9-10.cjs has already been executed.
 * Usage: node scripts/seed-science-grade9-10-supplement.cjs <service-account.json>
 */
'use strict'
const admin = require('firebase-admin')
const fs = require('fs')
const serviceAccount = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()
db.settings({ preferRest: true })

const IMG_CELL     = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/400px-Animal_cell_structure_en.svg.png'
const IMG_DNA      = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/400px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png'
const IMG_PERIODIC = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Simple_Periodic_Table_Chart-blocks.svg/800px-Simple_Periodic_Table_Chart-blocks.svg.png'
const IMG_WAVE     = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Simple_sine_wave.svg/400px-Simple_sine_wave.svg.png'
const IMG_PLATES   = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tectonic_plates.png/400px-Tectonic_plates.png'
const IMG_ROCK     = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rock_cycle.svg/400px-Rock_cycle.svg.png'
const IMG_WATER    = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Water_cycle.png/400px-Water_cycle.png'
const IMG_MITOSIS  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Animal_cell_cycle-en.svg/400px-Animal_cell_cycle-en.svg.png'
const IMG_PHOTO    = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/400px-Photosynthesis_en.svg.png'
const IMG_BOHR     = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Atom_diagram.png/400px-Atom_diagram.png'
const IMG_ACTIV    = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Activation_energy.svg/400px-Activation_energy.svg.png'
const IMG_FOOD     = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/FoodWeb.jpg/400px-FoodWeb.jpg'
const IMG_VT       = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Velocity-time_graph_example.svg/400px-Velocity-time_graph_example.svg.png'
const IMG_CIRCUIT  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Simple_circuit.svg/400px-Simple_circuit.svg.png'
const IMG_EM       = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/EM_spectrum.svg/400px-EM_spectrum.svg.png'
const IMG_PH       = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/PH_scale_2.svg/400px-PH_scale_2.svg.png'
const IMG_MEIOSIS  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Meiosis_Stages.svg/400px-Meiosis_Stages.svg.png'
const IMG_ENZYME   = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Induced_fit_diagram.svg/400px-Induced_fit_diagram.svg.png'
const IMG_NEURON   = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Neuron_Hand-tuned.svg/400px-Neuron_Hand-tuned.svg.png'
const IMG_CARBON   = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Carbon_cycle.svg/400px-Carbon_cycle.svg.png'
const IMG_OCEAN    = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Ocean_currents_1943_%28Bowditch%29.jpg/400px-Ocean_currents_1943_%28Bowditch%29.jpg'
const IMG_CLIMATE  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Global_Temperature_Anomaly.svg/400px-Global_Temperature_Anomaly.svg.png'
const IMG_OHMS     = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Ohm%27s_law_triangle.svg/400px-Ohm%27s_law_triangle.svg.png'
const IMG_MAGNET   = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Magnet0873.png/400px-Magnet0873.png'
const IMG_FINCH    = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Darwin%27s_finches_by_Gould.jpg/400px-Darwin%27s_finches_by_Gould.jpg'

const questions = [

  // ══════════════════════════════════════════════════════════════════════════
  // GRADE 9 SUPPLEMENT — 20 questions (adds to reach 150 total)
  // Target additions: +9 multi-select, +18 imageUrl
  // Mix: 9 imageUrl+multi-select, 9 imageUrl+single-select, 2 plain single-select
  // ══════════════════════════════════════════════════════════════════════════

  // imageUrl + multi-select (9)
  { grade:'9', topic:'Physics', imageUrl:IMG_CIRCUIT, question:'Which of the following are true about a simple series circuit? (Select all)', options:['Current is the same through all components','The total voltage equals the sum of voltages across each component','Removing one component breaks the entire circuit','Voltage is the same across each component'], correctIndices:[0,1,2] },
  { grade:'9', topic:'Chemistry', imageUrl:IMG_PERIODIC, question:'Which of the following are characteristic properties of transition metals? (Select all)', options:['Can form multiple oxidation states','Form coloured compounds and ions','Act as catalysts','Have completely full d-subshells in all compounds'], correctIndices:[0,1,2] },
  { grade:'9', topic:'Biology', imageUrl:IMG_ENZYME, question:'Which of the following statements about enzyme specificity are correct? (Select all)', options:['Each enzyme has an active site complementary to its specific substrate','Enzymes are biological catalysts that are not consumed in the reaction','Changing the pH can alter the shape of the active site and reduce enzyme activity','All enzymes work optimally at 100 °C'], correctIndices:[0,1,2] },
  { grade:'9', topic:'Biology', imageUrl:IMG_NEURON, question:'Which structures are part of a motor neuron? (Select all)', options:['Cell body (soma) containing the nucleus','Axon that carries impulses away from the cell body','Dendrites that receive signals from other neurons','Myelin sheath on sensory neurons only'], correctIndices:[0,1,2] },
  { grade:'9', topic:'Earth Science', imageUrl:IMG_CARBON, question:'Which of the following processes remove CO₂ from the atmosphere? (Select all)', options:['Photosynthesis by plants and algae','Dissolution of CO₂ into ocean water','Cellular respiration by animals','Weathering of calcium-silicate rocks'], correctIndices:[0,1,3] },
  { grade:'9', topic:'Physics', imageUrl:IMG_EM, question:'Which regions of the electromagnetic spectrum have higher frequency than visible light? (Select all)', options:['Ultraviolet (UV)','X-rays','Gamma rays','Infrared (IR)'], correctIndices:[0,1,2] },
  { grade:'9', topic:'Earth Science', imageUrl:IMG_PLATES, question:'Which geological features are typically associated with transform plate boundaries? (Select all)', options:['Strike-slip faults (e.g. San Andreas Fault)','Shallow earthquakes along the fault line','Volcanic activity directly at the boundary','Horizontal movement of crust with little vertical displacement'], correctIndices:[0,1,3] },
  { grade:'9', topic:'Biology', imageUrl:IMG_FOOD, question:'Which of the following statements about energy flow in a food web are correct? (Select all)', options:['Energy flows from producers to consumers','Only about 10% of energy is transferred to the next trophic level','Decomposers play no role in energy flow','Herbivores are primary consumers that eat producers'], correctIndices:[0,1,3] },
  { grade:'9', topic:'Earth Science', imageUrl:IMG_ROCK, question:'Which of the following are processes that can produce metamorphic rock? (Select all)', options:['Intense heat from nearby magma intrusion','High pressure from overlying rock layers or tectonic forces','Rapid cooling of lava at Earth\'s surface','Contact metamorphism near igneous intrusions'], correctIndices:[0,1,3] },

  // imageUrl + single-select (9)
  { grade:'9', topic:'Biology', imageUrl:IMG_DNA, question:'What is the role of messenger RNA (mRNA) in protein synthesis?', options:['It carries amino acids to the ribosome','It carries the genetic code from the DNA in the nucleus to the ribosome in the cytoplasm','It forms the structural component of the ribosome','It splices introns from the pre-mRNA'], correctIndices:[1] },
  { grade:'9', topic:'Chemistry', imageUrl:IMG_BOHR, question:'In the Bohr model, when an electron moves from a higher energy level to a lower energy level, what happens?', options:['Energy is absorbed and the electron emits a photon of light','Energy is released as a photon of light with a frequency corresponding to the energy difference','The electron is permanently lost from the atom','The atom becomes an ion'], correctIndices:[1] },
  { grade:'9', topic:'Earth Science', imageUrl:IMG_WATER, question:'What is the primary energy source that drives the water cycle?', options:['Gravity alone','The Sun\'s radiant energy, which drives evaporation and atmospheric circulation','Wind energy','Geothermal heat from Earth\'s interior'], correctIndices:[1] },
  { grade:'9', topic:'Physics', imageUrl:IMG_WAVE, question:'If the speed of a wave remains constant and the frequency increases, what happens to the wavelength?', options:['It increases proportionally','It remains the same','It decreases (wavelength = speed / frequency)','It doubles'], correctIndices:[2] },
  { grade:'9', topic:'Chemistry', imageUrl:IMG_ACTIV, question:'How does a catalyst affect the activation energy of a reaction?', options:['It increases activation energy, slowing the reaction','It decreases activation energy by providing an alternative reaction pathway, speeding up the reaction without being consumed','It eliminates activation energy entirely','It only affects the activation energy of endothermic reactions'], correctIndices:[1] },
  { grade:'9', topic:'Biology', imageUrl:IMG_MEIOSIS, question:'What are the end products of meiosis in a human cell (starting with 46 chromosomes)?', options:['Two cells each with 46 chromosomes','Four identical cells each with 46 chromosomes','Four genetically unique cells each with 23 chromosomes (haploid)','Two genetically unique cells each with 23 chromosomes'], correctIndices:[2] },
  { grade:'9', topic:'Biology', imageUrl:IMG_PHOTO, question:'What is the primary product of the Calvin cycle (light-independent reactions) used by the plant?', options:['ATP','Oxygen','Glucose (or G3P that is converted to glucose)','NADPH'], correctIndices:[2] },
  { grade:'9', topic:'Physics', imageUrl:IMG_VT, question:'What does a horizontal (flat) line on a velocity-time graph indicate?', options:['The object is accelerating','The object has zero velocity','The object is moving at a constant velocity (zero acceleration)','The object is decelerating'], correctIndices:[2] },
  { grade:'9', topic:'Biology', imageUrl:IMG_MITOSIS, question:'What is cytokinesis?', options:['The phase in which chromosomes align at the cell\'s equator','The phase in which chromosomes separate and move to opposite poles','The physical division of the cytoplasm into two daughter cells following nuclear division','The replication of DNA before mitosis'], correctIndices:[2] },

  // plain single-select (2)
  { grade:'9', topic:'Biology', question:'What is homeostasis?', options:['The process by which organisms reproduce','The maintenance of a stable internal environment within a narrow range despite changes in external conditions','The movement of organisms toward favourable conditions','The digestion of nutrients in the stomach'], correctIndices:[1] },
  { grade:'9', topic:'Biology', question:'What is the difference between endotherms and ectotherms?', options:['Endotherms are always larger than ectotherms','Endotherms (e.g. mammals, birds) generate their own body heat internally; ectotherms (e.g. reptiles, fish) rely on external heat sources to regulate body temperature','Ectotherms are more active than endotherms','Endotherms cannot survive cold temperatures'], correctIndices:[1] },

  // ══════════════════════════════════════════════════════════════════════════
  // GRADE 10 SUPPLEMENT — 35 questions (adds to reach 150 total)
  // Target additions: +17 multi-select, +26 imageUrl
  // Mix: 17 imageUrl+multi-select, 9 imageUrl+single-select, 9 plain single-select
  // ══════════════════════════════════════════════════════════════════════════

  // imageUrl + multi-select (17)
  { grade:'10', topic:'Biology', imageUrl:IMG_DNA, question:'Which of the following are mechanisms of gene regulation in eukaryotes? (Select all)', options:['DNA methylation (adding methyl groups to silence genes)','Histone modification (acetylation opens chromatin; methylation can condense it)','Transcription factors binding to promoter/enhancer regions','mRNA stability and degradation controlling translation rate'], correctIndices:[0,1,2,3] },
  { grade:'10', topic:'Biology', imageUrl:IMG_MEIOSIS, question:'Which events are unique to meiosis I (not meiosis II or mitosis)? (Select all)', options:['Homologous chromosomes pair up (synapsis) at prophase I','Crossing over (recombination) between non-sister chromatids','Homologous chromosome pairs separate (not sister chromatids)','Sister chromatids separate to opposite poles'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Biology', imageUrl:IMG_ENZYME, question:'Which types of enzyme inhibition are reversible? (Select all)', options:['Competitive inhibition (inhibitor competes with substrate for active site)','Non-competitive inhibition (inhibitor binds allosteric site, changes enzyme shape)','Irreversible inhibition where inhibitor covalently bonds to the active site','Uncompetitive inhibition (inhibitor binds only the enzyme-substrate complex)'], correctIndices:[0,1,3] },
  { grade:'10', topic:'Chemistry', imageUrl:IMG_PH, question:'Which of the following solutions would have a pH less than 7? (Select all)', options:['0.1 M hydrochloric acid (HCl)','0.1 M acetic acid (CH₃COOH, a weak acid)','0.1 M sodium chloride (NaCl, neutral salt)','Carbonated water (dissolved CO₂ forms carbonic acid)'], correctIndices:[0,1,3] },
  { grade:'10', topic:'Physics', imageUrl:IMG_OHMS, question:'A 12 V battery is connected to a 4 Ω resistor and a 2 Ω resistor in series. Which of the following are correct? (Select all)', options:['Total resistance = 6 Ω','Current through circuit = 2 A','Voltage across 4 Ω resistor = 8 V','Voltage across 2 Ω resistor = 8 V'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Physics', imageUrl:IMG_CIRCUIT, question:'Which of the following are advantages of connecting components in parallel rather than series? (Select all)', options:['Each component receives the full supply voltage','If one component fails, the others continue to work','Adding more parallel branches decreases total circuit resistance','The current through each branch is the same'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Chemistry', imageUrl:IMG_PERIODIC, question:'Which of the following are true about the oxidation states of transition metals? (Select all)', options:['Most transition metals can exhibit multiple oxidation states','Iron commonly forms +2 (Fe²⁺) and +3 (Fe³⁺) ions','Copper can exist as +1 (Cu⁺) and +2 (Cu²⁺)','All transition metals have a fixed +2 oxidation state'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Earth Science', imageUrl:IMG_CARBON, question:'Which of the following are human activities that significantly increase atmospheric CO₂? (Select all)', options:['Burning fossil fuels (coal, oil, natural gas)','Deforestation and land-use change','Cement production (calcination of limestone releases CO₂)','Solar panel manufacturing'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Earth Science', imageUrl:IMG_CLIMATE, question:'Which of the following are observed consequences of global climate change? (Select all)', options:['Rising global average surface temperatures','Increased frequency and intensity of extreme weather events','Rising sea levels due to melting ice and thermal expansion','Increased Arctic sea ice extent'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Earth Science', imageUrl:IMG_OCEAN, question:'Which of the following are effects of rising ocean temperatures? (Select all)', options:['Coral bleaching (corals expel symbiotic algae under heat stress)','Changes in marine species distribution and migration patterns','Reduction in ocean stratification','Decreased frequency of tropical cyclones/hurricanes'], correctIndices:[0,1] },
  { grade:'10', topic:'Biology', imageUrl:IMG_NEURON, question:'Which of the following correctly describe the nervous system\'s signalling process? (Select all)', options:['Action potentials are all-or-nothing electrical signals','Neurotransmitters are released from synaptic vesicles into the synaptic cleft','The resting membrane potential is maintained by the sodium-potassium pump','Myelination increases the speed of nerve impulse conduction'], correctIndices:[0,1,2,3] },
  { grade:'10', topic:'Chemistry', imageUrl:IMG_BOHR, question:'Which of the following are correct statements about electron configuration rules? (Select all)', options:['The Aufbau principle: electrons fill orbitals from lowest to highest energy','The Pauli exclusion principle: no two electrons in the same atom can have identical quantum numbers','Hund\'s rule: electrons occupy degenerate orbitals singly before pairing','All electrons in an atom must be in the same energy level'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Physics', imageUrl:IMG_WAVE, question:'Which of the following are properties that distinguish electromagnetic waves from mechanical waves? (Select all)', options:['Electromagnetic waves do not require a medium and can travel through a vacuum','Electromagnetic waves travel at 3 × 10⁸ m/s in a vacuum','Electromagnetic waves are transverse waves only','Electromagnetic waves carry both electric and magnetic field oscillations'], correctIndices:[0,1,3] },
  { grade:'10', topic:'Physics', imageUrl:IMG_EM, question:'Which regions of the EM spectrum have practical technological applications as listed? (Select all)', options:['Radio waves: wireless communication and broadcasting','Microwaves: radar, satellite communication, and microwave ovens','X-rays: medical imaging and airport security scanning','Infrared: night-vision equipment and TV remote controls'], correctIndices:[0,1,2,3] },
  { grade:'10', topic:'Physics', imageUrl:IMG_MAGNET, question:'Which of the following correctly describe the behaviour of magnetic poles and field lines? (Select all)', options:['Like poles repel; unlike poles attract','Magnetic field lines form closed loops from north to south pole externally','The density (closeness) of field lines indicates the strength of the magnetic field','Magnetic monopoles (isolated north or south poles) have been confirmed to exist'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Biology', imageUrl:IMG_PHOTO, question:'Which of the following are inputs (reactants) or outputs (products) of the light-dependent reactions in photosynthesis? (Select all)', options:['Water (H₂O) is split as a reactant, releasing O₂ as a by-product','ATP is produced from ADP + Pᵢ using light energy','NADPH is produced by the reduction of NADP⁺','Glucose is directly produced in the thylakoid'], correctIndices:[0,1,2] },
  { grade:'10', topic:'Biology', imageUrl:IMG_FOOD, question:'Which of the following are true about trophic pyramids? (Select all)', options:['Energy decreases at each successive trophic level (pyramid of energy)','Biomass generally decreases at higher trophic levels','The number of organisms at each level always decreases (pyramid of numbers is always regular)','Decomposers obtain energy from organic matter at all trophic levels'], correctIndices:[0,1,3] },

  // imageUrl + single-select (9)
  { grade:'10', topic:'Biology', imageUrl:IMG_DNA, question:'Which enzyme is responsible for synthesising new DNA strands during DNA replication?', options:['RNA polymerase','DNA ligase','DNA polymerase (adds nucleotides in 5′ to 3′ direction, using the template strand)','Helicase'], correctIndices:[2] },
  { grade:'10', topic:'Biology', imageUrl:IMG_MEIOSIS, question:'During which phase of meiosis does crossing over (recombination) occur?', options:['Metaphase I','Anaphase I','Prophase I — when homologous chromosomes are paired as bivalents','Telophase II'], correctIndices:[2] },
  { grade:'10', topic:'Chemistry', imageUrl:IMG_PH, question:'What is the pH of a solution in which [H⁺] = 0.001 M (1 × 10⁻³ M)?', options:['11','1','3 (pH = –log(10⁻³) = 3)','7'], correctIndices:[2] },
  { grade:'10', topic:'Physics', imageUrl:IMG_OHMS, question:'A 9 V battery is connected to a single 3 Ω resistor. What is the current flowing through the circuit?', options:['27 A','0.33 A','3 A (I = V/R = 9/3)','6 A'], correctIndices:[2] },
  { grade:'10', topic:'Physics', imageUrl:IMG_CIRCUIT, question:'Two identical 6 Ω resistors are connected in parallel across a 12 V supply. What is the voltage across each resistor?', options:['6 V','3 V','12 V — voltage is equal across all branches in parallel','24 V'], correctIndices:[2] },
  { grade:'10', topic:'Earth Science', imageUrl:IMG_CARBON, question:'Which of the following represents the largest reservoir of carbon on Earth?', options:['The atmosphere','The ocean (dissolved inorganic carbon)','Sedimentary rocks and fossil fuel deposits','Terrestrial vegetation and soil'], correctIndices:[2] },
  { grade:'10', topic:'Earth Science', imageUrl:IMG_CLIMATE, question:'What is the ice-albedo feedback mechanism?', options:['Melting ice absorbs more CO₂, cooling the atmosphere','As ice melts due to warming, the darker ocean or land surface exposed absorbs more sunlight instead of reflecting it, causing further warming — a positive feedback','Ice reflects more heat as temperatures rise, creating a negative feedback','Melting ice reduces ocean salinity, which cools the climate'], correctIndices:[1] },
  { grade:'10', topic:'Chemistry', imageUrl:IMG_BOHR, question:'What is the maximum number of electrons that can occupy the third principal energy level (n = 3)?', options:['8','6','18 (2n² = 2 × 3² = 18)','32'], correctIndices:[2] },
  { grade:'10', topic:'Chemistry', imageUrl:IMG_ACTIV, question:'What does a lower activation energy for a reaction indicate?', options:['The reaction is endothermic','The reaction will produce more product','The reaction proceeds more readily (faster) at a given temperature because more molecules have sufficient energy to react','The reaction requires a larger catalyst'], correctIndices:[2] },

  // plain single-select (9)
  { grade:'10', topic:'Chemistry', question:'What is Le Chatelier\'s principle?', options:['A reaction always goes to completion when heated','If a system at equilibrium is subjected to a change (in concentration, temperature, or pressure), it will shift to partially oppose that change and restore a new equilibrium','A catalyst always shifts equilibrium to the right','The rate of reaction is always constant at equilibrium'], correctIndices:[1] },
  { grade:'10', topic:'Chemistry', question:'What is chemical equilibrium in a reversible reaction?', options:['The point where all reactants have been consumed','The state where the concentrations of reactants and products are equal','The state where the forward and reverse reaction rates are equal, so the concentrations of reactants and products remain constant','The state where only the forward reaction occurs'], correctIndices:[2] },
  { grade:'10', topic:'Physics', question:'What is nuclear fission?', options:['The combining of two light atomic nuclei to form a heavier nucleus, releasing energy','The splitting of a heavy atomic nucleus (e.g. uranium-235) into two smaller nuclei and neutrons, releasing a large amount of energy','The emission of an alpha particle from a nucleus','The capture of a neutron without any energy release'], correctIndices:[1] },
  { grade:'10', topic:'Physics', question:'What is nuclear fusion?', options:['The splitting of a heavy nucleus into lighter nuclei','The combining of two light atomic nuclei (e.g. hydrogen isotopes) to form a heavier nucleus, releasing very large amounts of energy — the process powering the Sun','The decay of a radioactive nucleus over time','The capture of an electron by a proton'], correctIndices:[1] },
  { grade:'10', topic:'Physics', question:'What is the photoelectric effect?', options:['The emission of light from excited atoms','The ejection of electrons from a metal surface when light of sufficient frequency shines on it, demonstrating that light has particle-like (photon) properties','The absorption of all light by a black body','The splitting of white light into its spectrum by a prism'], correctIndices:[1] },
  { grade:'10', topic:'Physics', question:'What is the difference between alpha (α) and beta (β) radiation?', options:['Alpha is a high-energy electron; beta is a helium nucleus','Alpha (α) radiation consists of helium nuclei (2 protons + 2 neutrons) with low penetrating power; beta (β) radiation consists of fast-moving electrons (or positrons) with greater penetrating power','Both are the same type of particle with different energies','Alpha radiation is electromagnetic; beta is a particle'], correctIndices:[1] },
  { grade:'10', topic:'Physics', question:'What is half-life of a radioactive isotope?', options:['The time for a radioactive substance to emit half of its energy','The time required for half of the radioactive atoms in a sample to decay','The time for the radioactive substance to become completely stable','The time for the substance to lose half of its mass through reactions'], correctIndices:[1] },
  { grade:'10', topic:'Earth Science', question:'What is the Coriolis effect?', options:['The force due to gravity that causes objects to fall','The apparent deflection of moving objects (air masses, ocean currents) due to Earth\'s rotation — to the right in the Northern Hemisphere and to the left in the Southern Hemisphere','The seasonal change in day length','The tidal effect caused by the Moon\'s gravity'], correctIndices:[1] },
  { grade:'10', topic:'Earth Science', question:'What is an aquifer?', options:['A surface river or lake that stores large amounts of fresh water','An underground layer of permeable rock, sediment, or soil saturated with groundwater that can be tapped by wells','A type of glacier that stores freshwater as ice','An ocean trench that stores deep saline water'], correctIndices:[1] },
]

async function seed() {
  const col = db.collection('scienceQuestions')
  const BATCH_SIZE = 499
  let count = 0
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = db.batch()
    for (const q of questions.slice(i, i + BATCH_SIZE)) { batch.set(col.doc(), q); count++ }
    await batch.commit()
    console.log(`  Committed batch up to question ${count}`)
  }
  const grades = ['9', '10']
  grades.forEach(g => {
    const qs = questions.filter(q => q.grade === g)
    const ms = qs.filter(q => q.correctIndices.length > 1)
    const img = qs.filter(q => q.imageUrl)
    console.log(`  Grade ${g} supplement: ${qs.length} questions added  |  ${ms.length} multi-select  |  ${img.length} with image`)
  })
  console.log(`\nDone — seeded ${count} supplement questions.`)
  console.log('Grade 9 cumulative: 130 + 20 = 150 questions')
  console.log('Grade 10 cumulative: 115 + 35 = 150 questions')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
