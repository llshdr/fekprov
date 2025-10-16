// Datastruktur: { id, topic, question, answer, tags }
// Källa: Användarens anteckningar (svenska, kapitel 3-6)

const DATA = [
  // Kap 3 – Affärsidé och entreprenörskap
  { id: 'k3-entre-def', topic: 'Kap 3: Affärsidé', question: 'Vad är entreprenörskap?', answer: 'En dynamisk och social process där man identifierar möjligheter och idéer och omsätter dem i praktiska, målinriktade aktiviteter.', tags: ['entreprenörskap'] },
  { id: 'k3-entre-skill', topic: 'Kap 3: Affärsidé', question: 'Nämn viktiga egenskaper hos entreprenörer.', answer: 'Driven, målmedveten, risktagare, självsäker, disciplinerad, beslutsam, söker frihet, kreativ, handlingskraftig.', tags: ['entreprenörskap'] },
  { id: 'k3-affarside-def', topic: 'Kap 3: Affärsidé', question: 'Vad är en affärsidé?', answer: 'Vad företaget ska göra och vad som ska säljas till vem.', tags: ['affärsidé'] },
  { id: 'k3-usp', topic: 'Kap 3: Affärsidé', question: 'Vad är en USP (Unique Selling Point)?', answer: 'Det unika värde som särskiljer erbjudandet, t.ex. personal, lokal, frakt, grossister, marknadsföring eller öppettider.', tags: ['affärsidé','usp'] },
  { id: 'k3-franchise', topic: 'Kap 3: Affärsidé', question: 'Vad innebär franchising?', answer: 'Att hyra en affärsidé/varumärke och driva under samma koncept, t.ex. McDonald’s, ICA, Taco Bell.', tags: ['franchising'] },
  { id: 'k3-grundstenar', topic: 'Kap 3: Affärsidé', question: 'Vilka är de fyra grundstenarna i en affärsidé?', answer: 'Problem (varför?), Målgrupp (åt vem?), Lösning (vad erbjuds?), Resurser (hur förverkligas?).', tags: ['affärsidé'] },
  { id: 'k3-swot-def', topic: 'Kap 3: Affärsidé', question: 'Vad är en SWOT-analys?', answer: 'Analys av styrkor, svagheter (interna) och möjligheter, hot (externa) för en affärsidé.', tags: ['swot'] },
  { id: 'k3-swot-ex', topic: 'Kap 3: Affärsidé', question: 'Ge exempel på styrkor/svagheter/möjligheter/hot i SWOT.', answer: 'Styrkor: välutbildad personal, lojala kunder, unik produkt. Svagheter: ny på marknaden, litet startkapital, höga fasta kostnader. Möjligheter: trender, säsong (jul), miljöfokus. Hot: krig, inflation, lågt intresse.', tags: ['swot'] },

  // Kap 4 – Företagsformer
  { id: 'k4-former', topic: 'Kap 4: Företagsformer', question: 'Vilka är vanliga bolagsformer?', answer: 'Enskild firma, handelsbolag (HB), aktiebolag (AB), ekonomisk förening.', tags: ['bolagsformer'] },
  { id: 'k4-enskild', topic: 'Kap 4: Företagsformer', question: 'När passar enskild firma?', answer: 'När man är ny och vill testa lågriskaffärsidéer. Ingen skillnad mellan privat- och företagsekonomi, ägaren bär risken och vinsten är lön.', tags: ['enskild firma'] },
  { id: 'k4-hb', topic: 'Kap 4: Företagsformer', question: 'Vad kännetecknar handelsbolag (HB)?', answer: 'Flera delägare med solidariskt ansvar. Juridisk person. Viktigt med avtal. Möjligt från 16 år med målsmans godkännande.', tags: ['handelsbolag'] },
  { id: 'k4-ab', topic: 'Kap 4: Företagsformer', question: 'Vad kännetecknar aktiebolag (AB)?', answer: 'Juridisk person. Ägarna riskerar aktier, inte privat ekonomi. Styrelse, bolagsstämma utser styrelse och VD. Aktiekapital minst 25 000 kr (publikt 500 000).', tags: ['aktiebolag'] },
  { id: 'k4-ab-roller', topic: 'Kap 4: Företagsformer', question: 'Vilka roller finns i AB och vad gör de?', answer: 'Bolagsstämma (alla aktieägare) utser styrelse. Styrelsen leder, utser VD, ansvarar för redovisning/skatter. VD driver verksamheten.', tags: ['aktiebolag','styrning'] },
  { id: 'k4-efor', topic: 'Kap 4: Företagsformer', question: 'Vad är en ekonomisk förening?', answer: 'Kooperativ ägd av medlemmar (minst 3), ex. Coop, Arla. Medlemmarna har rösträtt.', tags: ['ekonomisk förening'] },
  { id: 'k4-reg', topic: 'Kap 4: Företagsformer', question: 'Vad måste alla företag göra vid start?', answer: 'Registrera hos Bolagsverket och Skatteverket samt godkännas för F-skatt. Ålderskrav: 18 år (16 år för enskild firma med målsmans godkännande).', tags: ['registrering'] },

  // Kap 5 – Finansiering
  { id: 'k5-orga', topic: 'Kap 5: Finansiering', question: 'Vilka organisationer hjälper nystartade företag?', answer: 'Almi (utbildning, lån), Tillväxtverket (råd, finansiering), Business Sweden (exportstöd), inkubatorer (rådgivning/kapital).', tags: ['finansiering'] },
  { id: 'k5-alt', topic: 'Kap 5: Finansiering', question: 'Nämn finansieringsalternativ.', answer: 'Eget kapital, riskkapital, affärsänglar, crowdfunding, banklån, kreditinstitut, factoring (sälja fakturor), leasing.', tags: ['finansiering'] },
  { id: 'k5-faser', topic: 'Kap 5: Finansiering', question: 'Hur förändras kapitalbehov över tid?', answer: 'Start: ägarkapital, Almi, riskkapital, crowdfunding, affärsänglar. Expansion: banklån, fler ägare. Moget: banklån, factoring, leasing.', tags: ['finansiering'] },

  // Kap 6 – Organisation och kultur
  { id: 'k6-ledarstruktur', topic: 'Kap 6: Organisation & kultur', question: 'Hur ser ledarstrukturen ut i AB?', answer: 'Bolagsstämma → Styrelse → VD. VD strukturerar organisationen under sig.', tags: ['organisation'] },
  { id: 'k6-funktionsindelad', topic: 'Kap 6: Organisation & kultur', question: 'Vad är en funktionsindelad organisation?', answer: 'Avdelningar efter funktion (produktion, marknad, ekonomi, adm, kvalitet/miljö). +Tydligt för små bolag. –Samarbetssvårigheter mellan avdelningar.', tags: ['organisation'] },
  { id: 'k6-produktorienterad', topic: 'Kap 6: Organisation & kultur', question: 'Vad är produkt/kund/regionsindelad organisation?', answer: 'Uppdelning efter produkt/segment (t.ex. H&M Home, H&M Barn). +Tydlig uppföljning. –Risk för rivalitet, dubbelarbete, kommunikationsproblem.', tags: ['organisation'] },
  { id: 'k6-chef-ledare', topic: 'Kap 6: Organisation & kultur', question: 'Skillnad chef vs ledare?', answer: 'Chef: formell position med mandat. Ledare: formell/informell, bygger på förtroende och förtjänst (expertis/förebild).', tags: ['ledarskap'] },
  { id: 'k6-sit-ledarskap', topic: 'Kap 6: Organisation & kultur', question: 'Vad är situationsanpassat ledarskap?', answer: 'Att variera ledarskap efter situation: ibland strikt, ibland lyssnande, ibland lekfullt.', tags: ['ledarskap'] },
  { id: 'k6-xy-teori', topic: 'Kap 6: Organisation & kultur', question: 'Vad beskriver X- och Y-teorin?', answer: 'X: ser anställda som lata, styr med order/kontroll; lön som drivkraft. Y: ser anställda som meningssökande, delaktighet; utveckling och frihet som drivkrafter.', tags: ['ledarskap','McGregor'] },
  { id: 'k6-kultur', topic: 'Kap 6: Organisation & kultur', question: 'Vad är företagskultur?', answer: 'Normer, värderingar och beteenden som “sitter i väggarna”, märks internt och externt.', tags: ['kultur'] },
];

// Hjälpfunktioner för att hämta data per kapitel
const Topics = Array.from(new Set(DATA.map(x => x.topic)));
function getByTopic(topic) {
  return DATA.filter(x => x.topic === topic);
}


