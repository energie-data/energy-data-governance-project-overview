# Export van projects_interoperability.json

## id: energiewet_nl
naam: Energiewet (NL) – begrippen, rollen en randvoorwaarden voor gegevensbeheer
familie: Juridisch kader / definities
geografische_scope: Nederland
status_2023: Wetgevingsproces lopend; kader in wording voor rollen/registraties en gegevensuitwisseling.
status_2026: In werking (per 1 januari 2026); normerend begrippenkader en basis voor governance rond energiedata.

### korte_omschrijving
Land van oorsprong: Nederland. Organisatie/consortium: Rijksoverheid / Ministerie van Klimaat en Groene Groei. Normerend wettelijk kader dat kernbegrippen en rollen definieert en randvoorwaarden stelt voor gegevensbeheer en gegevensuitwisseling in het energiedomein.

### ontwikkelingen_sinds_publicatie
Inwerkingtreding en verdere concretisering in implementatiepraktijk (rollen, processen, registraties).

### bijdrage_datagovernance_interoperabiliteit
Verankert verantwoordelijkheden/rechten/plichten; stimuleert eenduidige begripsvorming en afdwingbaarheid van afspraken.

### relevantie_en_advies
Zeer relevant; opnemen als normerend fundament en koppelen aan semantische standaarden.

### verwante_of_nieuwe_initiatieven
VIVET/Geonovum Begrippenkader; CIM/CGMES; NBility.

### bronnen
- FILE_RATHENAU_PARL
- FILE_RAPPORT_HOOFD
- FILE_BIJLAGEN_6_1

## id: vivet_begrippenkader
naam: VIVET/Geonovum – Begrippenkader Energie
familie: Begrippenkader / semantische governance
geografische_scope: Nederland
status_2023: In doorontwikkeling; positionering als online begrippenkader voor energiedata.
status_2026: Bredere inzet als centrale referentie; belang toegenomen door groei aan modellen en ketenintegraties.

### korte_omschrijving
Land van oorsprong: Nederland. Organisatie/consortium: Programma VIVET / Geonovum. Begrippenkader met definities en relaties tussen energieconcepten; bedoeld als referentie voor semantische afstemming en beheer.

### ontwikkelingen_sinds_publicatie
Meer nadruk op beheer (governance), hergebruik en mapping naar informatiemodellen.

### bijdrage_datagovernance_interoperabiliteit
Ondersteunt semantische governance (terminologiebeheer, definities); maakt model-alignments beheersbaar.

### relevantie_en_advies
Kerninitiatief; behouden en expliciet verbinden met informatiemodellen en ketenafspraken.

### verwante_of_nieuwe_initiatieven
LinkED/MHM (harmonisatie); ESDL; NBility; CIM-profielen.

### bronnen
- FILE_BIJLAGEN_6_1
- FILE_UPDATE_H61

## id: cim_cgmes
naam: CIM / CGMES (IEC 61970/61968 + ENTSO-E profiel)
familie: Semantische standaard (netten)
geografische_scope: Europa/Nederland/internationaal
status_2023: Breed ingezet (TSO/DSO); conformance en profielen actief; CGMES als standaard voor grid model exchange.
status_2026: Doorlopende updates; conformance/SV-IOP tests volwassen; ruggengraat voor netmodel-interoperabiliteit.

### korte_omschrijving
Land van oorsprong: internationaal / Europa. Organisatie/consortium: IEC TC57; ENTSO-E; UCAIug. IEC Common Information Model (CIM) en ENTSO-E CGMES-profiel voor uitwisseling van net- en gridmodellen.

### ontwikkelingen_sinds_publicatie
ENTSO-E introduceerde jaarlijkse SV-IOP; het testrapport uit 2024 is gepubliceerd, met governance rond NC-profielen.

### bijdrage_datagovernance_interoperabiliteit
Levert gedeelde semantiek + syntaxis én conformance governance via profielen, tests en change management.

### relevantie_en_advies
Kern; expliciet positioneren als authoritative semantiek voor netwerkdata.

### verwante_of_nieuwe_initiatieven
ENTSO-E CGMES Library; ENTSO-E CIM Conformity & Interoperability; OneNet; INT:NET/IOP; OpenFMB.

### bronnen
- WEB_ENTSOE_CGMES
- WEB_ENTSOE_SVIOP_2024
- WEB_ZENODO_SVIOP_2024
- WEB_INTNET_IOP_PDF

## id: esdl
naam: ESDL (Energy System Description Language)
familie: Semantisch model (energiesysteem, multi-vector)
geografische_scope: Nederland/Europa
status_2023: Groeiend toegepast in NL energiesysteem-analyse; tooling/community in opbouw.
status_2026: Breed toegepast; geschikt als koppeltaal voor integrale systeemrepresentaties en scenario-uitwisseling.

### korte_omschrijving
Land van oorsprong: Nederland. Organisatie/consortium: TNO / Quintel / Nederlandse energiesysteemmodellering-community. Modeltaal om energiesystemen (elektra, warmte, gas) integraal te beschrijven; gebruikt in systeemstudies en scenario’s.

### ontwikkelingen_sinds_publicatie
Meer nadruk op hergebruik, repositories en mapping naar andere standaarden.

### bijdrage_datagovernance_interoperabiliteit
Biedt gedeelde semantiek voor integrale energiesystemen; maakt aannames/datasets transparanter.

### relevantie_en_advies
Kern; behouden en expliciet koppelen aan CIM/SAREF/asset-identificatie via mappings.

### verwante_of_nieuwe_initiatieven
OEO; LinkED/MHM; InterConnect (voor gebouw/IoT-koppelingen).

### bronnen
- FILE_UPDATE_H61
- FILE_BIJLAGEN_6_1

## id: nbility
naam: NBility
familie: Bedrijfsobjectenmodel / netbeheersemantiek
geografische_scope: Nederland
status_2023: Breed gebruikt als semantische laag voor netbeheerobjecten en processen.
status_2026: Nog steeds kernonderdeel van Nederlandse semantiek voor netbeheer en ketenprocessen.

### korte_omschrijving
Land van oorsprong: Nederland. Organisatie/consortium: Netbeheer Nederland / netbeheer-ecosysteem. Bedrijfsobjectenmodel en semantische laag voor assets, aansluitingen, klanten en processen in netbeheercontext.

### ontwikkelingen_sinds_publicatie
Sterkere koppeling met begrippenkaders en procesafspraken; bruikbaar gebleven als bedrijfsobjectenmodel.

### bijdrage_datagovernance_interoperabiliteit
Maakt expliciet welke bedrijfsobjecten bestaan, hoe ze samenhangen en hoe organisaties daar consistent over kunnen werken.

### relevantie_en_advies
Zeer hoog; expliciet verbinden met CIM, ESDL en juridische begrippen.

### verwante_of_nieuwe_initiatieven
VIVET begrippenkader; EDSN; MFFBAS/Het Normo; CIM.

### bronnen
- FILE_UPDATE_H61
- FILE_BIJLAGEN_6_1

## id: linked_mhm
naam: LinkED Energy Data – Model Harmonisatie Methodiek (MHM)
familie: Methodiek voor harmonisatie
geografische_scope: Nederland
status_2023: Beschikbaar als werkwijze; waarde in expliciteren van keuzes en mappings.
status_2026: Nog relevanter door groei aan model-ecosystemen; inzetbaar als governance-instrument voor mappings.

### korte_omschrijving
Land van oorsprong: Nederland. Organisatie/consortium: LinkED Energy Data consortium. Methodiek om informatiemodellen en ontologieën te koppelen via mappings en governance voor wijzigingsbeheer.

### ontwikkelingen_sinds_publicatie
Toegenomen noodzaak aan systematische mappings; meer tooling rond vocabulaire- en ontologiebeheer.

### bijdrage_datagovernance_interoperabiliteit
Borgt besluitvorming en wijzigingsbeheer rond mappings; bevordert herbruikbaarheid van harmonisatiepatronen.

### relevantie_en_advies
Hoog als werkwijze; opnemen als methodische bouwsteen.

### verwante_of_nieuwe_initiatieven
InterConnect SIF; LF Energy SEF; BD4NRG methodiek.

### bronnen
- FILE_BIJLAGEN_6_1
- FILE_UPDATE_H61

## id: saref
naam: ETSI SAREF
familie: Ontologie (IoT/gebouw/achter-de-meter)
geografische_scope: Europa
status_2023: EU-referentieontologie; relevant voor achter-de-meter en smart building use-cases.
status_2026: Suite actief doorontwikkeld; belangrijker door koppelingen tussen gebouw/energie-data en semantische frameworks.

### korte_omschrijving
Land van oorsprong: Europa. Organisatie/consortium: ETSI. Suite van ontologieën voor slimme apparaten/IoT met extensies; inzetbaar voor device/sensor semantiek en mapping naar energiedomein.

### ontwikkelingen_sinds_publicatie
Doorlopende updates via ETSI; meer praktijktesten in projecten (o.a. InterConnect).

### bijdrage_datagovernance_interoperabiliteit
Biedt gedeelde begrippen voor device/sensor data; faciliteert mapping naar domeinmodellen.

### relevantie_en_advies
Belangrijk maar afgebakend: inzetten waar IoT/gebouwdata onderdeel is van energiedata.

### verwante_of_nieuwe_initiatieven
InterConnect SIF; LF Energy SEF; CSIP-AUS; CSIP California.

### bronnen
- WEB_SAREF_PORTAL
- WEB_INTERCONNECT_D23
- WEB_LFENERGY_SEF

## id: interconnect_sif
naam: InterConnect – ontologieën & Semantic Interoperability Framework (SIF)
familie: EU project (ontologie/semantiek)
geografische_scope: Europa
status_2023: Project actief; publieke deliverable D2.3 over standards and ontologies beschikbaar (2023).
status_2026: Project afgerond; resultaten gecontinueerd richting LF Energy SEF (open governance).

### korte_omschrijving
Land van oorsprong: Europa. Organisatie/consortium: H2020 InterConnect consortium. InterConnect ontwikkelde ontologieën en een semantic interoperability framework (SIF) voor smart home/building/grid/IoT use-cases.

### ontwikkelingen_sinds_publicatie
Consolidatie van SIF-resultaten en transitie naar open source/industry governance.

### bijdrage_datagovernance_interoperabiliteit
Levert herbruikbare ontologieën, methoden en specificaties voor semantische interoperabiliteit tussen services en databronnen.

### relevantie_en_advies
Zeer relevant als EU-best practice; toepassen voor gebouw/IoT ↔ energie koppelingen en als methodebron.

### verwante_of_nieuwe_initiatieven
LF Energy SEF; ETSI SAREF; EDSO DSOi paper (SIF integratie).

### bronnen
- WEB_INTERCONNECT_D23
- WEB_LFENERGY_SEF
- WEB_EDSO_DSOI_PAPER

## id: lfenergy_sef
naam: LF Energy – Semantic Energy Framework (SEF)
familie: Open source semantic framework
geografische_scope: Europa/Internationaal
status_2023: SEF nog niet zichtbaar als apart LF Energy project; SIF in InterConnect in ontwikkeling.
status_2026: SEF actief als LF Energy project; positioneert SIF-resultaten als herbruikbaar framework.

### korte_omschrijving
Land van oorsprong: internationaal. Organisatie/consortium: LF Energy / Linux Foundation. Open governance vervolg op InterConnect SIF dat semantische assets, mappings en richtlijnen consolideert.

### ontwikkelingen_sinds_publicatie
Start/opschaling als open governance laag voor semantische assets.

### bijdrage_datagovernance_interoperabiliteit
Ondersteunt beheer, versiebeheer en hergebruik van semantische assets (ontologieën, mappings, guidelines).

### relevantie_en_advies
Relevant; opnemen als mogelijke landingsplek voor semantische assets en alignment.

### verwante_of_nieuwe_initiatieven
InterConnect SIF; ETSI SAREF.

### bronnen
- WEB_LFENERGY_SEF
- WEB_INTERCONNECT_D23

## id: onenet_interop
naam: OneNet – interoperabiliteitsrichtlijnen en dataspecificaties
familie: EU project (interoperabiliteit richtlijnen/specs)
geografische_scope: Europa
status_2023: Project actief; deliverables gepubliceerd.
status_2026: Projectresultaten publiek; bruikbaar als referentie/benchmark.

### korte_omschrijving
Land van oorsprong: Europa. Organisatie/consortium: H2020 OneNet consortium. OneNet publiceerde richtlijnen en deliverables voor interoperabiliteit, incl. technische specs voor datamodellen en middleware (o.a. D5.5).

### ontwikkelingen_sinds_publicatie
Van deliverables naar replicability/lessons learned; CIM/CGMES blijft centraal.

### bijdrage_datagovernance_interoperabiliteit
Analyse en aanbevelingen voor interoperabiliteit; concrete technische specs voor datamodellen en middleware (D5.5).

### relevantie_en_advies
Relevant als Europese referentie; koppelen aan CIM/CGMES en nationale ketens.

### verwante_of_nieuwe_initiatieven
ENTSO-E SV-IOP; CIM/CGMES; optioneel Smart Data Models/NGSI-LD bij FIWARE-keuze.

### bronnen
- WEB_ONENET_DELIVERABLES
- WEB_ONENET_ZENODO_D55

## id: openfmb_us
naam: OpenFMB (Open Field Message Bus)
familie: Grid-edge interoperabiliteitsstandaard / common data model
geografische_scope: Verenigde Staten/Noord-Amerika
status_2023: Actief gebruikersgroep- en implementatie-ecosysteem; adapter-tooling beschikbaar.
status_2026: Nog steeds actief; toolkit en community worden onderhouden.

### korte_omschrijving
Land van oorsprong: Verenigde Staten. Organisatie/consortium: UCAIug OpenFMB Users Group / NAESB-context. Grid-edge interoperabiliteitsstandaard met common data model en protocolinterfaces, afgeleid van IEC 61850 en IEC CIM.

### ontwikkelingen_sinds_publicatie
OpenFMB blijft een duidelijk Noord-Amerikaans interoperabiliteitsproduct voor DER en grid-edge use-cases.

### bijdrage_datagovernance_interoperabiliteit
Brengt CIM en 61850 samen in een praktisch interoperabiliteitsmodel voor veldapparatuur en DER-integratie.

### relevantie_en_advies
Sterk vergelijkbaar met H6.1-doelen; toevoegen als belangrijk VS-voorbeeld.

### verwante_of_nieuwe_initiatieven
CIM/CGMES; IEC 61850; GridAPPS-D.

### bronnen
- FILE_UPDATE_H61

## id: multispeak_us
naam: MultiSpeak
familie: Interoperabiliteitsspecificatie voor utility enterprise systems
geografische_scope: Verenigde Staten/Noord-Amerika
status_2023: Langlopende, breed gebruikte specificatie; nog steeds actief.
status_2026: Nog steeds onderhouden en toegepast.

### korte_omschrijving
Land van oorsprong: Verenigde Staten. Organisatie/consortium: National Rural Electric Cooperative Association (NRECA) met utilities en softwareleveranciers. Specificatie van gestandaardiseerde interfaces tussen utility softwareapplicaties.

### ontwikkelingen_sinds_publicatie
Geen nieuw semantisch paradigma, maar wel blijvende praktische relevantie als enterprise-interoperabiliteitsstandaard in Noord-Amerika.

### bijdrage_datagovernance_interoperabiliteit
Standaardiseert interfacecontracten en gegevensuitwisseling tussen utility-systemen.

### relevantie_en_advies
Opnemen als VS-contrast met CIM/OpenFMB: meer interface-gedreven dan ontologie-gedreven.

### verwante_of_nieuwe_initiatieven
OpenFMB; CIM.

### bronnen
- FILE_UPDATE_H61

## id: csip_aus
naam: CSIP-AUS (Common Smart Inverter Profile – Australia)
familie: Interoperabiliteitsprofiel voor DER/smart inverters
geografische_scope: Australië
status_2023: CSIP-AUS v1.1a beschikbaar; beleids- en standaardiseringstraject actief.
status_2026: Actief nationaal harmonisatietraject met reference implementation en test harness.

### korte_omschrijving
Land van oorsprong: Australië. Organisatie/consortium: DEIP Interoperability Steering Committee; ANU; ARENA; ENA; AEMO en partners. Australisch interoperabiliteitsprofiel voor DER-communicatie, gebaseerd op IEEE 2030.5 en geoperationaliseerd met testen/certificering.

### ontwikkelingen_sinds_publicatie
Sinds 2025 is er expliciete nationale harmonisatie via een nieuw test- en certificeringstraject.

### bijdrage_datagovernance_interoperabiliteit
Zorgt voor één technische taal tussen DER-apparaten, netbeheerders en energiebeheersystemen; combineert profiel + testgovernance.

### relevantie_en_advies
Zeer relevant; waarschijnlijk het sterkste niet-Europese H6.1-voorbeeld buiten de VS.

### verwante_of_nieuwe_initiatieven
CSIP California; IEEE 2030.5; OpenFMB.

### bronnen
- FILE_UPDATE_H61

## id: cee_map_canada
naam: Canadian Energy End-use Mapping (CEE Map)
familie: Building-energy/geospatial interoperability product
geografische_scope: Canada
status_2023: Project actief (2019–2024) en in uitvoering.
status_2026: Project formeel afgerond; resultaten en aanpak blijven bruikbaar als Canada-specifieke interoperabiliteitsreferentie.

### korte_omschrijving
Land van oorsprong: Canada. Organisatie/consortium: Natural Resources Canada (NRCan) / CanmetENERGY, met OGC Testbed-partners. Project voor building-energy mapping dat datasets, best practices en standaarden combineert.

### ontwikkelingen_sinds_publicatie
Het project heeft aantoonbaar geospatial interoperability standards benut voor online energiemaps en building-energy integratie.

### bijdrage_datagovernance_interoperabiliteit
Relevant als Canadees voorbeeld van standaardgebaseerde interoperabiliteit tussen gebouw- en geodata; minder een ontologie, meer een product/standaarden-implementatie.

### relevantie_en_advies
Opnemen als best-matching Canadees voorbeeld, maar expliciet markeren als gedeeltelijke match.

### verwante_of_nieuwe_initiatieven
OGC Testbed building-energy interoperability; LF Research/NRCan interoperability studies.

### bronnen
- FILE_UPDATE_H61

## id: japan_fepc_eci
naam: Japan – ECHONET Lite / smart energy interoperability in HEMS-BEMS context
familie: Interoperabiliteitsspecificatie voor smart energy devices
geografische_scope: Japan
status_2023: Actief als marktgedragen interoperabiliteitslaag in de Japanse smart home en energy management context.
status_2026: Nog steeds relevant als nationaal dominant interoperabiliteitskader voor apparaten en HEMS-koppelingen.

### korte_omschrijving
Land van oorsprong: Japan. Organisatie/consortium: ECHONET Consortium en verwante smart energy/HEMS-ecosystemen. Specificaties voor slimme apparaten en home/building energy management die in de Japanse markt een rol spelen als interoperabiliteitslaag.

### ontwikkelingen_sinds_publicatie
Blijvende rol als praktisch interoperabiliteitskader rond slimme apparaten, gebouwbeheer en energiesturing; minder als generiek semantisch netmodel.

### bijdrage_datagovernance_interoperabiliteit
Ondersteunt interoperabiliteit tussen energiegerelateerde apparaten en systemen in gebouwen en woningen.

### relevantie_en_advies
Toevoegen als Japans voorbeeld, met de kanttekening dat het dichter bij device/HEMS-interoperabiliteit ligt dan bij een breed energiedomein-ontologiemodel.

### verwante_of_nieuwe_initiatieven
SAREF; smart appliance interoperability; HEMS/BEMS-protocollen.

### bronnen
- FILE_UPDATE_H61

## id: new_zealand_note
naam: Nieuw-Zeeland – geen direct equivalent gevonden binnen H6.1-scope
familie: Landennotitie / markering ontbrekend equivalent
geografische_scope: Nieuw-Zeeland
status_2023: Geen duidelijk semantisch of informatiemodel-initiatief in deze scope geïdentificeerd.
status_2026: Nog steeds geen duidelijk direct equivalent geïdentificeerd binnen de H6.1-afbakening.

### korte_omschrijving
Land van oorsprong: Nieuw-Zeeland. Organisatie/consortium: n.v.t. In de huidige onderzoeksbasis is geen duidelijk nationaal initiatief gevonden dat direct vergelijkbaar is met CIM/CGMES, ESDL, OpenFMB of CSIP-AUS als formeel semantisch model of interoperabiliteitsprofiel.

### ontwikkelingen_sinds_publicatie
Activiteit lijkt sterker te liggen op open APIs, datasets en coördinatie rond systeemontwikkeling dan op expliciete nationale ontologieën of profielen.

### bijdrage_datagovernance_interoperabiliteit
Relevant als markering van een lacune in de internationale vergelijking.

### relevantie_en_advies
Kort opnemen als notitie; niet als volwaardig equivalent presenteren.

### verwante_of_nieuwe_initiatieven
Open APIs; system operation / DSO-coördinatie trajecten.

### bronnen
- FILE_UPDATE_H61
