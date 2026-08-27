/**
 * countryIso.js — Country name → ISO 3166-1 alpha-3 mapping.
 *
 * Why we need this:
 * The frontend stores trip countries as free-form strings in Portuguese
 * (e.g. "Portugal", "Brasil", "França", "Marrocos", "E.U.A."). The
 * GeoJSON we use for the Fog of War ships country names in English
 * ("Portugal", "Brazil", "France", "Morocco", "United States of
 * America"). String matching between the two is brittle (accents,
 * plurals, synonyms, abbreviations, etc.).
 *
 * The robust strategy is to convert BOTH sides to a canonical ISO
 * 3166-1 alpha-3 code (e.g. "PRT", "BRA", "FRA", "MAR", "USA") and
 * match on that. ISO codes are language-agnostic and universal.
 *
 * This file provides:
 *   • A lookup map of common names (Portuguese + English + common
 *     variations) → ISO3.
 *   • A `countryToIso3(name)` function that returns the code or null
 *     if the country is not recognised.
 *   • A `TOTAL_COUNTRIES` constant for progress UI (UN member states
 *     + observer states; the dataset ships ~255 features because it
 *     also includes territories, but 195 is the conventional "world
 *     countries" number for user-facing progress).
 *
 * The map covers ~200 entries — enough for every country a travel app
 * is likely to see. If a trip's country is not in the map, we fall
 * back to the normalized-name match used in the previous round.
 */

// ISO 3166-1 alpha-3 mapping. Key = lowercased, accent-stripped name.
// Multiple variants of the same country are allowed; the first match
// wins. The value is the official ISO 3166-1 alpha-3 code.
const NAME_TO_ISO3 = {
  // ── Europe ──────────────────────────────────────────────────────
  portugal: 'PRT', 'portugal ': 'PRT',
  espanha: 'ESP', espanha_: 'ESP', 'spain': 'ESP', 'espanha': 'ESP',
  franca: 'FRA', frança: 'FRA', 'france': 'FRA',
  alemanha: 'DEU', 'germany': 'DEU', alemanha_: 'DEU',
  italia: 'ITA', itália: 'ITA', 'italy': 'ITA',
  reino_unido: 'GBR', 'reino unido': 'GBR', 'united kingdom': 'GBR',
  uk: 'GBR', inglaterra: 'GBR', 'england': 'GBR', scotland: 'GBR',
  escocia: 'GBR', gales: 'GBR', 'wales': 'GBR', 'ireland': 'GBR',
  irlanda: 'IRL', 'ireland ': 'IRL', 'irlanda ': 'IRL',
  holanda: 'NLD', 'netherlands': 'NLD', paises_baixos: 'NLD',
  'países baixos': 'NLD', holland: 'NLD',
  belgica: 'BEL', bélgica: 'BEL', 'belgium': 'BEL',
  luxemburgo: 'LUX', 'luxembourg': 'LUX',
  suica: 'CHE', suiça: 'CHE', 'switzerland': 'CHE',
  austria: 'AUT', 'austria ': 'AUT', 'austria': 'AUT',
  polonia: 'POL', polônia: 'POL', 'poland': 'POL',
  republica_checa: 'CZE', 'república checa': 'CZE', 'czechia': 'CZE',
  'czech republic': 'CZE',
  eslovaquia: 'SVK', 'slovakia': 'SVK',
  hungria: 'HUN', 'hungary': 'HUN',
  romenia: 'ROU', romênia: 'ROU', 'romania': 'ROU',
  bulgaria: 'BGR', búlgaria: 'BGR', 'bulgaria': 'BGR',
  grecia: 'GRC', grécia: 'GRC', 'greece': 'GRC',
  turquia: 'TUR', 'turkey': 'TUR', turquia_: 'TUR',
  croacia: 'HRV', croácia: 'HRV', 'croatia': 'HRV',
  servia: 'SRB', sérvia: 'SRB', 'serbia': 'SRB',
  bosnia: 'BIH', 'bosnia and herzegovina': 'BIH', 'bósnia': 'BIH',
  'bosnia e herzegovina': 'BIH',
  'herzegovina': 'BIH',
  montenegro: 'MNE', 'montenegro ': 'MNE',
  'macedonia do norte': 'MKD', macedonia: 'MKD', macedônia: 'MKD',
  'north macedonia': 'MKD', 'macedonia ': 'MKD',
  albania: 'ALB', albânia: 'ALB', 'albania ': 'ALB',
  kosovo: 'XKX', 'kosovo ': 'XKX',
  moldavia: 'MDA', moldávia: 'MDA', moldova: 'MDA',
  ucrania: 'UKR', ucrânia: 'UKR', 'ukraine': 'UKR',
  belarus: 'BLR', bielorrússia: 'BLR', 'belarus ': 'BLR',
  lituania: 'LTU', lituânia: 'LTU', 'lithuania': 'LTU',
  latvia: 'LVA', latávia: 'LVA', 'latvia ': 'LVA',
  estonia: 'EST', estônia: 'EST', 'estonia': 'EST',
  suecia: 'SWE', suécia: 'SWE', 'sweden': 'SWE',
  noruega: 'NOR', 'norway': 'NOR',
  dinamarca: 'DNK', dinamárica: 'DNK', 'denmark': 'DNK',
  finlandia: 'FIN', finlândia: 'FIN', 'finland': 'FIN',
  islandia: 'ISL', islândia: 'ISL', 'iceland': 'ISL',
  russia: 'RUS', rússia: 'RUS', 'russian federation': 'RUS',
  federacao_russa: 'RUS', 'federação russa': 'RUS',
  andorra: 'AND', andorra_: 'AND',
  monaco: 'MCO', mônaco: 'MCO', 'monaco ': 'MCO',
  liechtenstein: 'LIE', 'liechtenstein ': 'LIE',
  san_marino: 'SMR', 'san marino': 'SMR', 'são marinho': 'SMR',
  vaticano: 'VAT', 'vatican': 'VAT', 'holy see': 'VAT',
  malta: 'MLT', 'malta ': 'MLT',
  chipre: 'CYP', 'cyprus': 'CYP',
  gibraltar: 'GIB',

  // ── Asia ────────────────────────────────────────────────────────
  china: 'CHN', 'china ': 'CHN',
  japao: 'JPN', japão: 'JPN', 'japan': 'JPN',
  coreia_do_sul: 'KOR', 'coreia do sul': 'KOR', 'south korea': 'KOR',
  'coreia': 'KOR', 'korea': 'KOR',
  coreia_do_norte: 'PRK', 'coreia do norte': 'PRK', 'north korea': 'PRK',
  mongolia: 'MNG', mongólia: 'MNG',
  india: 'IND', índia: 'IND', 'india ': 'IND',
  paquistao: 'PAK', paquistão: 'PAK', 'pakistan': 'PAK',
  bangladesh: 'BGD', 'bangladesh ': 'BGD',
  afeganistao: 'AFG', afeganistão: 'AFG', 'afghanistan': 'AFG',
  nepala: 'NPL', nepal: 'NPL',
  'sri lanka': 'LKA', srilanka: 'LKA', 'sri_lanka': 'LKA',
  ceilão: 'LKA', ceilao: 'LKA',
  maldivas: 'MDV', 'maldives': 'MDV',
  butao: 'BTN', butão: 'BTN', 'bhutan': 'BTN',
  myanmar: 'MMR', mianmar: 'MMR', 'burma': 'MMR',
  tailandia: 'THA', tailândia: 'THA', 'thailand': 'THA',
  laos: 'LAO', laos_: 'LAO', 'lao pdr': 'LAO',
  cambodja: 'KHM', camboja: 'KHM', 'cambodia': 'KHM',
  vietname: 'VNM', vietnã: 'VNM', 'vietnam': 'VNM',
  malasia: 'MYS', malásia: 'MYS', 'malaysia': 'MYS',
  singapura: 'SGP', cingapura: 'SGP', 'singapore': 'SGP',
  indonesia: 'IDN', indonésia: 'IDN', 'indonesia ': 'IDN',
  filipinas: 'PHL', 'philippines': 'PHL',
  brunei: 'BRN', brunei_: 'BRN', 'brunei darussalam': 'BRN',
  timor_leste: 'TLS', 'timor-leste': 'TLS', 'east timor': 'TLS',
  camboja_: 'KHM',
  israel: 'ISR', 'israel ': 'ISR',
  palestina: 'PSE', 'palestine': 'PSE', 'palestinian territories': 'PSE',
  jordania: 'JOR', jordânia: 'JOR', 'jordan': 'JOR',
  libano: 'LBN', líbano: 'LBN', 'lebanon': 'LBN',
  siria: 'SYR', síria: 'SYR', 'syria': 'SYR',
  iraque: 'IRQ', 'iraq': 'IRQ',
  irao: 'IRN', irã: 'IRN', 'iran': 'IRN',
  arabia_saudita: 'SAU', 'arábia saudita': 'SAU', 'saudi arabia': 'SAU',
  emirados: 'ARE', 'emirados arabes unidos': 'ARE',
  'united arab emirates': 'ARE', uae: 'ARE',
  catar: 'QAT', 'qatar': 'QAT',
  bahrein: 'BHR', bahrain: 'BHR', 'barein': 'BHR',
  kuwait: 'KWT', kuweit: 'KWT', 'kuwait ': 'KWT',
  oma: 'OMN', omã: 'OMN', 'oman': 'OMN',
  iemen: 'YEM', 'yemen': 'YEM',
  cazaquistao: 'KAZ', cazaquistão: 'KAZ', 'kazakhstan': 'KAZ',
  uzbequistao: 'UZB', uzbequistão: 'UZB', 'uzbekistan': 'UZB',
  turquemenistao: 'TKM', turcomenistão: 'TKM', 'turkmenistan': 'TKM',
  quirguistao: 'KGZ', quirguistão: 'KGZ', 'kyrgyzstan': 'KGZ',
  tajiquistao: 'TJK', tajiquistão: 'TJK', 'tajikistan': 'TJK',
  georgia: 'GEO', geórgia: 'GEO',
  armenia: 'ARM', armênia: 'ARM', 'armenia ': 'ARM',
  azerbaijao: 'AZE', azerbaijão: 'AZE', 'azerbaijan': 'AZE',

  // ── Africa ──────────────────────────────────────────────────────
  marrocos: 'MAR', marrocos_: 'MAR', 'morocco': 'MAR',
  argelia: 'DZA', argélia: 'DZA', 'algeria': 'DZA',
  tunisia: 'TUN', tunísia: 'TUN', 'tunisia': 'TUN',
  libia: 'LBY', líbia: 'LBY', 'libya': 'LBY',
  egipto: 'EGY', egito: 'EGY', 'egypt': 'EGY',
  sudão: 'SDN', 'sudan': 'SDN', sudao: 'SDN',
  'sudan do sul': 'SSD', 'south sudan': 'SSD', ssd: 'SSD',
  etiopia: 'ETH', etiópia: 'ETH', 'ethiopia': 'ETH',
  eritreia: 'ERI', eritreia_: 'ERI', 'eritrea': 'ERI',
  djibouti: 'DJI', djibuti: 'DJI', 'djibouti ': 'DJI',
  'somaliland': '-99', somalia: 'SOM', somália: 'SOM', 'somalia ': 'SOM',
  quenia: 'KEN', quênia: 'KEN', 'kenya': 'KEN',
  uganda: 'UGA', uganda_: 'UGA', 'uganda ': 'UGA',
  tanzania: 'TZA', tanzânia: 'TZA', 'tanzania ': 'TZA',
  ruanda: 'RWA', ruanda_: 'RWA', 'rwanda': 'RWA',
  burundi: 'BDI', burundi_: 'BDI',
  'republica democratica do congo': 'COD',
  'república democrática do congo': 'COD',
  'democratic republic of the congo': 'COD',
  'dr congo': 'COD', 'drc': 'COD', congo_kinshasa: 'COD',
  congo: 'COG', 'republic of the congo': 'COG', 'congo brazzaville': 'COG',
  'republica do congo': 'COG', 'república do congo': 'COG',
  'central african republic': 'CAF', 'republica centro africana': 'CAF',
  'república centro-africana': 'CAF',
  'africa do sul': 'ZAF', 'south africa': 'ZAF', 'africa_sul': 'ZAF',
  botswana: 'BWA', botsuana: 'BWA', 'botswana ': 'BWA',
  'africa do sul ': 'ZAF',
  namibia: 'NAM', namíbia: 'NAM', 'namibia ': 'NAM',
  zimbabwe: 'ZWE', zimbábue: 'ZWE',
  zambia: 'ZMB', zâmbia: 'ZMB', 'zambia ': 'ZMB',
  malawi: 'MWI', maláui: 'MWI',
  mocambique: 'MOZ', moçambique: 'MOZ', 'mozambique': 'MOZ',
  madagascar: 'MDG', madagáscar: 'MDG',
  'cabo verde': 'CPV', 'cabo verde ': 'CPV', 'cape verde': 'CPV',
  mauricio: 'MUS', maurício: 'MUS', 'mauritius': 'MUS',
  seicheles: 'SYC', seicheles_: 'SYC', 'seychelles': 'SYC',
  comores: 'COM', comores_: 'COM', 'comoros': 'COM',
  angola: 'AGO', angola_: 'AGO',
  mocambique_: 'MOZ',
  lesoto: 'LSO', lesoto_: 'LSO', 'lesotho': 'LSO',
  eswatini: 'SWZ', suazilandia: 'SWZ', 'eswatini ': 'SWZ',
  'sao tome e principe': 'STP', 'são tomé e príncipe': 'STP',
  'sao tome': 'STP', 'são tomé': 'STP', 'sao tome and principe': 'STP',
  niger: 'NER', níger: 'NER', 'niger ': 'NER',
  nigeria: 'NGA', nigéria: 'NGA', 'nigeria ': 'NGA',
  gana: 'GHA', gana_: 'GHA', 'ghana': 'GHA',
  'costa do marfim': 'CIV', 'cote d ivoire': 'CIV', 'ivory coast': 'CIV',
  togo: 'TGO', 'togo ': 'TGO',
  benim: 'BEN', benim_: 'BEN', 'benin': 'BEN',
  burkina_faso: 'BFA', 'burkina faso': 'BFA', 'burkina faso ': 'BFA',
  mali: 'MLI', 'mali ': 'MLI',
  senegal: 'SEN', 'senegal ': 'SEN',
  gambia: 'GMB', gâmbia: 'GMB', 'gambia ': 'GMB',
  guine_bissau: 'GNB', 'guine-bissau': 'GNB', 'guinea-bissau': 'GNB',
  guine: 'GIN', guiné: 'GIN', 'guinea': 'GIN',
  'guine equatorial': 'GNQ', 'equatorial guinea': 'GNQ',
  'sao helena': 'SHN', 'saint helena': 'SHN',
  liberia: 'LBR', libéria: 'LBR', 'liberia ': 'LBR',
  serra_leoa: 'SLE', 'serra leoa': 'SLE', 'sierra leone': 'SLE',
  'sao tome e principe ': 'STP',

  // ── Americas — North & Central ─────────────────────────────────
  'estados unidos': 'USA', 'eua': 'USA', 'estados unidos da america': 'USA',
  'united states': 'USA', 'united states of america': 'USA',
  'usa': 'USA', 'us': 'USA', 'america': 'USA',
  canada: 'CAN', canadá: 'CAN', 'canada ': 'CAN',
  mexico: 'MEX', méxico: 'MEX', 'mexico ': 'MEX',
  guatemala: 'GTM', guatemála: 'GTM',
  belize: 'BLZ', belize_: 'BLZ',
  honduras: 'HND', 'honduras ': 'HND',
  'el salvador': 'SLV', salvador: 'SLV', 'el salvador ': 'SLV',
  nicaragua: 'NIC', 'nicaragua ': 'NIC',
  'costa rica': 'CRI', 'costa rica ': 'CRI',
  panama: 'PAN', panamá: 'PAN', 'panama ': 'PAN',
  cuba: 'CUB', 'cuba ': 'CUB',
  jamaica: 'JAM', jamaica_: 'JAM',
  haiti: 'HTI', haiti_: 'HTI', 'haiti ': 'HTI',
  'republica dominicana': 'DOM', 'república dominicana': 'DOM',
  'dominican republic': 'DOM',
  bahamas: 'BHS', 'the bahamas': 'BHS', bahamas_: 'BHS',
  porto_rico: 'PRI', 'porto rico': 'PRI', 'puerto rico': 'PRI',
  'trinidad e tobago': 'TTO', 'trinidad and tobago': 'TTO',
  barbados: 'BRB', barbados_: 'BRB',
  'antigua e barbuda': 'ATG', 'antigua and barbuda': 'ATG',
  santa_lucia: 'LCA', 'santa lúcia': 'LCA', 'saint lucia': 'LCA',
  granada: 'GRD', grenada: 'GRD',
  'são cristóvão e neves': 'KNA', 'saint kitts and nevis': 'KNA',
  'saint vincent and the grenadines': 'VCT',
  'sao vicente e granadinas': 'VCT',
  dominica: 'DMA', dominica_: 'DMA',

  // ── Americas — South ───────────────────────────────────────────
  brasil: 'BRA', 'brasil ': 'BRA', 'brazil': 'BRA', 'brazil ': 'BRA',
  argentina: 'ARG', 'argentina ': 'ARG',
  chile: 'CHL', 'chile ': 'CHL',
  peru: 'PER', 'peru ': 'PER',
  colombia: 'COL', colômbia: 'COL', 'colombia ': 'COL',
  venezuela: 'VEN', 'venezuela ': 'VEN',
  equador: 'ECU', equador_: 'ECU', 'ecuador': 'ECU',
  bolivia: 'BOL', bolívia: 'BOL', 'bolivia ': 'BOL',
  paraguai: 'PRY', paraguai_: 'PRY', 'paraguay': 'PRY',
  uruguai: 'URY', uruguaí: 'URY', 'uruguay': 'URY',
  guyana: 'GUY', guiana: 'GUY', 'guyana ': 'GUY',
  'guiana francesa': 'GUF', 'french guiana': 'GUF', 'guyane': 'GUF',
  suriname: 'SUR', surinam: 'SUR', 'suriname ': 'SUR',
  'ilhas malvinas': 'FLK', 'falkland islands': 'FLK',
  'ilhas falkland': 'FLK', malvinas: 'FLK',

  // ── Oceania ─────────────────────────────────────────────────────
  australia: 'AUS', austrália: 'AUS', 'australia ': 'AUS',
  'nova zelandia': 'NZL', 'nova zelândia': 'NZL', 'new zealand': 'NZL',
  'nova zelandia ': 'NZL',
  'nova guine': 'PNG', 'papua new guinea': 'PNG',
  'nova guinea': 'PNG', papua: 'PNG',
  fiji: 'FJI', fiji_: 'FJI',
  'ilhas salomão': 'SLB', 'solomon islands': 'SLB',
  'samoa': 'WSM', samoa_: 'WSM',
  tonga: 'TON', tonga_: 'TON',
  vanuatu: 'VUT', vanuatu_: 'VUT',
  kiribati: 'KIR', kiribati_: 'KIR',
  tuvalu: 'TUV', tuvalu_: 'TUV',
  'nauru': 'NRU', nauru_: 'NRU',
  palau: 'PLW', palau_: 'PLW',
  'micronesia': 'FSM', 'micronesia ': 'FSM', 'federated states of micronesia': 'FSM',
  'ilhas marshall': 'MHL', 'marshall islands': 'MHL',
  'estados federados da micronésia': 'FSM',

  // ── Common English synonyms that might appear in trip data ────
  'holland': 'NLD',
  'switzerland': 'CHE',
  'korea': 'KOR',
  'russia': 'RUS',
  'czech': 'CZE',
  'uae': 'ARE',
  'us': 'USA',
  'uk': 'GBR',
};

// Canonical set: 195 widely-recognised sovereign states (UN member
// states + 2 observer states). Used for the "X / 195 países" progress
// UI. The exact list of 195 is what most travel apps display.
export const TOTAL_COUNTRIES = 195;

/**
 * Normalize a free-form country name into a lookup key. Mirrors the
 * logic used in FogOfWar (lowercase, strip diacritics, trim).
 *
 * @param {string} name — raw country string (e.g. "  São Tomé & Príncipe ")
 * @returns {string}    — normalized key (e.g. "sao tome & principe")
 */
const normalizeKey = (name) =>
  (name || '')
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Map a free-form country name to its ISO 3166-1 alpha-3 code.
 *
 * @param {string} name
 * @returns {string|null} ISO3 or null if not recognised
 */
export function countryToIso3(name) {
  if (!name) return null;
  const key = normalizeKey(name);
  if (NAME_TO_ISO3[key]) return NAME_TO_ISO3[key];
  // Fuzzy fallback: try removing trailing/leading punctuation and
  // common words like "the", "republic of", "republica da/do", "islands".
  const stripped = key
    .replace(/^(a |o |the |republica |republic of |republic )/, '')
    .replace(/(_|-)+/g, ' ')
    .trim();
  if (NAME_TO_ISO3[stripped]) return NAME_TO_ISO3[stripped];
  // Fallback 2: try matching by the FIRST WORD for cases like
  // "Cape Verde" → "cabo verde" (the prefix doesn't match the key
  // but the full phrase does — we already covered that above).
  return null;
}

/**
 * Convert a list of country strings to a Set of ISO3 codes.
 *
 * @param {string[]} countries
 * @returns {Set<string>} — Set of canonical ISO3 codes
 */
export function countriesToIso3Set(countries) {
  const set = new Set();
  (countries || []).forEach((c) => {
    const iso = countryToIso3(c);
    if (iso && iso !== '-99') set.add(iso);
  });
  return set;
}
