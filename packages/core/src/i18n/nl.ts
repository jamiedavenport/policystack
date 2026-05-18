import type { Dictionary } from "./types";

export const nl: Dictionary = {
	shared: {
		versionSuffix: ({ version }) => ` Versie: ${version}.`,
		contactLabels: {
			legalName: () => "Bedrijfsnaam:",
			address: () => "Adres:",
			email: () => "E-mail:",
			url: () => "Website:",
			phone: () => "Telefoon:",
			dpo: () => "Functionaris voor gegevensbescherming:",
		},
		legalBasisLabels: {
			consent: () => "Toestemming (artikel 6, lid 1, onder a) AVG)",
			contract: () => "Uitvoering van een overeenkomst (artikel 6, lid 1, onder b) AVG)",
			legal_obligation: () =>
				"Naleving van een wettelijke verplichting (artikel 6, lid 1, onder c) AVG)",
			vital_interests: () => "Bescherming van vitale belangen (artikel 6, lid 1, onder d) AVG)",
			public_task: () =>
				"Vervulling van een taak van algemeen belang (artikel 6, lid 1, onder e) AVG)",
			legitimate_interests: () => "Gerechtvaardigde belangen (artikel 6, lid 1, onder f) AVG)",
		},
	},
	privacy: {
		introduction: {
			heading: () => "Inleiding",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`Dit privacybeleid beschrijft hoe ${companyName} ('wij', 'ons' of 'onze') informatie over u verzamelt, gebruikt en deelt wanneer u onze diensten gebruikt. Ingangsdatum: ${effectiveDate}.${versionSuffix}`,
			contactLine: ({ contactEmail }) =>
				`Als u vragen heeft over dit beleid, neem dan contact met ons op via ${contactEmail}.`,
		},
		childrenPrivacy: {
			heading: () => "Privacy van kinderen",
			body: ({ underAge }) =>
				`Onze diensten zijn niet gericht op kinderen onder de ${underAge} jaar. Wij verzamelen niet bewust persoonsgegevens van kinderen onder de ${underAge} jaar. Als u vermoedt dat wij informatie over een kind hebben verzameld, neem dan onmiddellijk contact met ons op.`,
			noticeLinkPrefix: () => "Raadpleeg voor meer informatie onze ",
			noticeLinkText: () => "privacyverklaring voor kinderen",
		},
		dataCollected: {
			heading: () => "Welke gegevens wij verzamelen",
			intro: {
				withGdpr: () =>
					"Wij verzamelen de volgende categorieën persoonsgegevens voor de hieronder beschreven doeleinden. Op grond van artikel 6 AVG beroepen wij ons voor elk verwerkingsdoel op de aangegeven rechtsgronden:",
				withoutGdpr: () =>
					"Wij verzamelen de volgende categorieën persoonsgegevens voor de hieronder beschreven doeleinden:",
			},
			headers: {
				withGdpr: () => ["Categorie", "Verzamelde velden", "Doel", "Rechtsgrond"],
				withoutGdpr: () => ["Categorie", "Verzamelde velden", "Doel"],
			},
		},
		consentWithdrawal: {
			heading: () => "Recht om toestemming in te trekken",
			body: ({ contactEmail }) =>
				`Voor zover wij ons voor de verwerking van uw persoonsgegevens beroepen op uw toestemming, heeft u te allen tijde het recht deze toestemming in te trekken door contact met ons op te nemen via ${contactEmail}. Het intrekken van uw toestemming doet geen afbreuk aan de rechtmatigheid van de verwerking die heeft plaatsgevonden vóór de intrekking. Wanneer toestemming vereist is om een bepaalde functie of dienst te leveren, kan intrekking ervan betekenen dat wij die functie of dienst niet meer kunnen aanbieden.`,
		},
		automatedDecisionMaking: {
			heading: () => "Geautomatiseerde besluitvorming en profilering",
			empty: () =>
				"Wij voeren geen geautomatiseerde besluitvorming of profilering uit die ten aanzien van u rechtsgevolgen heeft of u op vergelijkbare wijze aanmerkelijk treft in de zin van artikel 22 AVG.",
			intro: () =>
				"Wij gebruiken de volgende geautomatiseerde verwerkingen die ten aanzien van u rechtsgevolgen kunnen hebben of u op vergelijkbare wijze aanmerkelijk kunnen treffen. Voor elke verwerking beschrijven wij de onderliggende logica, het belang en de verwachte gevolgen:",
			significanceLabel: () => "Belang:",
			humanReview: {
				label: () => "Recht op menselijke tussenkomst.",
				body: ({ contactEmail }) =>
					` U heeft het recht niet te worden onderworpen aan een uitsluitend op geautomatiseerde verwerking, waaronder profilering, gebaseerd besluit. Om menselijke tussenkomst te verzoeken, uw standpunt kenbaar te maken of een besluit aan te vechten, neemt u contact met ons op via ${contactEmail}.`,
			},
		},
		dataRetention: {
			heading: () => "Bewaartermijnen",
			intro: () => "Wij bewaren uw gegevens gedurende de volgende perioden:",
			headers: () => ["Categorie", "Bewaartermijn"],
		},
		provisionRequirement: {
			heading: () => "Verplicht of vrijwillig karakter van het verstrekken van gegevens",
			body: () =>
				"Voor elke categorie persoonsgegevens die wij verzamelen, geven wij hieronder aan of u verplicht bent deze te verstrekken — op grond van de wet, op grond van onze overeenkomst met u, of als voorwaarde voor het sluiten van een overeenkomst — dan wel of de verstrekking vrijwillig is, alsmede de gevolgen van niet-verstrekking.",
			headers: () => ["Categorie", "Karakter", "Gevolgen"],
		},
		cookies: {
			heading: () => "Cookies en tracking",
			empty: () => "Wij gebruiken geen cookies of vergelijkbare trackingtechnologieën.",
			intro: () => "Wij gebruiken de volgende typen cookies en trackingtechnologieën:",
			headers: () => ["Categorie", "Rechtsgrond"],
		},
		thirdParties: {
			heading: () => "Diensten van derden",
			empty: () => "Wij delen uw persoonsgegevens niet met derden, tenzij wettelijk vereist.",
			intro: () => "Wij delen gegevens met de volgende diensten van derden:",
			headers: () => ["Dienst", "Doel", "Privacybeleid"],
			linkText: () => "Bekijken",
		},
		userRights: {
			heading: () => "Uw rechten",
			intro: () => "U beschikt over de volgende rechten met betrekking tot uw persoonsgegevens:",
			labels: {
				access: () => "Recht op inzage in uw persoonsgegevens",
				rectification: () => "Recht op rectificatie van onjuiste gegevens",
				erasure: () => "Recht op wissing van uw gegevens",
				portability: () => "Recht op overdraagbaarheid van uw gegevens",
				restriction: () => "Recht op beperking van de verwerking",
				objection: () => "Recht van bezwaar tegen de verwerking",
				opt_out_sale: () =>
					"Recht om bezwaar te maken tegen de verkoop van uw persoonlijke informatie",
				non_discrimination: () =>
					"Recht op niet-discriminerende behandeling bij de uitoefening van uw rechten",
			},
		},
		dpo: {
			present: {
				trailing: () =>
					". U kunt voor alle vragen over dit beleid of over de wijze waarop wij uw persoonsgegevens verwerken rechtstreeks contact opnemen met onze Functionaris voor gegevensbescherming.",
			},
			absentRequiredFalse: ({ reason }) =>
				`Wij hebben geen Functionaris voor gegevensbescherming aangewezen. Onze verwerkingsactiviteiten bereiken niet de drempels van artikel 37, lid 1, AVG die een dergelijke aanwijzing zouden vereisen.${reason}`,
			absentFallback: () =>
				"Wij hebben geen Functionaris voor gegevensbescherming aangewezen. Onze verwerkingsactiviteiten bereiken niet de drempels van artikel 37, lid 1, AVG die een dergelijke aanwijzing zouden vereisen. Voor vragen over dit beleid of over de wijze waarop wij uw persoonsgegevens verwerken, gebruikt u de bovenstaande contactgegevens.",
		},
		euRepresentative: {
			body: ({ address, email }) => ({
				prefix: "Onze vertegenwoordiger in de Europese Unie in de zin van artikel 27 AVG is ",
				suffix: `, ${address}, ${email}.`,
			}),
		},
		gdprSupplement: {
			heading: () => "Aanvullende AVG-informatie",
			scope: () =>
				"Dit gedeelte is van toepassing op personen in de Europese Economische Ruimte (EER) op grond van de Algemene Verordening Gegevensbescherming (AVG).",
			dataControllerLabel: () => "Verwerkingsverantwoordelijke: ",
			complaintBody: {
				prefix: () =>
					"U heeft het recht een klacht in te dienen bij de toezichthoudende autoriteit voor gegevensbescherming van het land waarin u woont, waar u werkt of waar de vermeende inbreuk heeft plaatsgevonden. Een lijst met toezichthoudende autoriteiten in de EER vindt u op ",
				linkText: () => "edpb.europa.eu/about-edpb/about-edpb/members_en",
				suffix: () => ".",
			},
			transferBody: {
				prefix: () =>
					"Wanneer wij uw persoonsgegevens doorgeven buiten de EER, beroepen wij ons op een of meer van de waarborgen voorzien in hoofdstuk V AVG: (a) doorgiften naar landen waarvoor de Europese Commissie een adequaatheidsbesluit heeft genomen (de actuele lijst is gepubliceerd op ",
				adequacyLinkText: () => "commission.europa.eu/.../adequacy-decisions_en",
				middle: () =>
					"); (b) standaardcontractbepalingen (SCC's) vastgesteld door de Europese Commissie op grond van artikel 46, lid 2, onder c); en (c) bindende bedrijfsvoorschriften (BCR's) goedgekeurd op grond van artikel 47, voor zover van toepassing. Voor aanvullende informatie over de specifieke waarborgen die op een bepaalde doorgifte van toepassing zijn, kunt u contact met ons opnemen via ",
				email: ({ contactEmail }) => `${contactEmail}.`,
			},
		},
		ukGdprSupplement: {
			heading: () => "Privacyrechten in het Verenigd Koninkrijk (UK-GDPR)",
			scope: () =>
				"Dit gedeelte is van toepassing op personen in het Verenigd Koninkrijk op grond van de UK General Data Protection Regulation (UK-GDPR), zoals aangepast door de Data Protection Act 2018.",
			dataControllerLabel: () => "Verwerkingsverantwoordelijke: ",
			ico: {
				prefix: () =>
					"De toezichthoudende autoriteit voor gegevensbescherming in het Verenigd Koninkrijk is het ",
				label: () => "Information Commissioner's Office (ICO)",
				suffix: () =>
					". Als u van mening bent dat wij uw gegevens niet hebben behandeld in overeenstemming met het Britse gegevensbeschermingsrecht, heeft u het recht een klacht in te dienen bij het ICO via ",
				linkText: () => "ico.org.uk/make-a-complaint",
				suffix2: () => ".",
			},
			transferBody: () =>
				"Indien wij uw persoonsgegevens doorgeven buiten het Verenigd Koninkrijk, zorgen wij ervoor dat passende waarborgen aanwezig zijn in overeenstemming met de UK-GDPR, waaronder de UK International Data Transfer Agreement of het UK-addendum bij de standaardcontractbepalingen van de EU, voor zover van toepassing.",
		},
		ccpaSupplement: {
			heading: () => "Privacyrechten in Californië (CCPA)",
			intro: () =>
				"Als u inwoner van Californië bent, beschikt u over de volgende aanvullende rechten:",
			rights: {
				know: () =>
					"Recht op informatie — U kunt verzoeken om openbaarmaking van de persoonlijke informatie die wij over u verzamelen, gebruiken en delen.",
				delete: () =>
					"Recht op verwijdering — U kunt verzoeken om verwijdering van de persoonlijke informatie die wij over u hebben verzameld.",
				optOut: () =>
					"Recht om bezwaar te maken tegen verkoop — U kunt zich verzetten tegen de verkoop van uw persoonlijke informatie.",
				nonDiscrimination: () =>
					"Recht op niet-discriminatie — Wij zullen u niet discrimineren wegens de uitoefening van uw CCPA-rechten.",
			},
			submitting: {
				label: () => "Indienen van verzoeken.",
				body: () =>
					" Om een van deze rechten uit te oefenen, neemt u contact met ons op via een van de hieronder vermelde methoden. Wij zullen reageren binnen de termijnen voorgeschreven door CCPA §1798.130.",
			},
		},
		contact: {
			heading: () => "Contact",
			intro: () => "Neem contact met ons op:",
		},
		provisionBasisLabels: {
			statutory: () => "Wettelijk verplicht",
			contractual: () => "Contractueel verplicht",
			"contract-prerequisite": () => "Voorwaarde voor het sluiten van een overeenkomst",
			voluntary: () => "Vrijwillig",
		},
		cookieCategoryLabels: {
			essential: () => "Essentiële cookies — vereist voor het functioneren van de dienst",
			analytics: () => "Analytische cookies — helpen ons te begrijpen hoe de dienst wordt gebruikt",
			functional: () => "Functionele cookies — onthouden uw voorkeuren en instellingen",
			marketing: () => "Marketingcookies — gebruikt om relevante advertenties weer te geven",
		},
		cookieCategoryFallback: ({ key }) => `${key}-cookies`,
	},
	cookie: {
		introduction: {
			heading: () => "Cookiebeleid",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`Dit cookiebeleid legt uit hoe ${companyName} ('wij', 'ons' of 'onze') cookies en vergelijkbare trackingtechnologieën gebruikt op onze diensten. Ingangsdatum: ${effectiveDate}.${versionSuffix}`,
		},
		whatAreCookies: {
			heading: () => "Wat zijn cookies?",
			body1: () =>
				"Cookies zijn kleine tekstbestanden die op uw apparaat worden geplaatst door websites die u bezoekt. Ze worden veel gebruikt om websites efficiënter te laten werken en om informatie te leveren aan de eigenaren van de website.",
			body2: () =>
				"Cookies kunnen 'sessiecookies' zijn (worden verwijderd bij het sluiten van uw browser) of 'permanente cookies' (blijven op uw apparaat totdat ze verlopen of u ze verwijdert).",
		},
		types: {
			heading: () => "Soorten cookies die wij gebruiken",
			empty: () => "Wij gebruiken op dit moment geen cookies.",
			headers: () => ["Type", "Omschrijving"],
			labels: {
				essential: {
					label: () => "Essentiële cookies",
					description: () =>
						"Vereist voor het basisfunctioneren van onze diensten. Deze kunnen niet worden uitgeschakeld.",
				},
				analytics: {
					label: () => "Analytische cookies",
					description: () =>
						"Helpen ons te begrijpen hoe bezoekers met onze diensten omgaan zodat wij ze kunnen verbeteren.",
				},
				functional: {
					label: () => "Functionele cookies",
					description: () =>
						"Maken uitgebreide functionaliteit en personalisatie mogelijk, zoals het onthouden van uw voorkeuren.",
				},
				marketing: {
					label: () => "Marketingcookies",
					description: () =>
						"Gebruikt om advertenties te tonen die relevanter zijn voor u en uw interesses.",
				},
			},
			fallback: ({ key }) => ({
				label: `${key.charAt(0).toUpperCase()}${key.slice(1)}-cookies`,
				description: "",
			}),
		},
		trackingTechnologies: {
			heading: () => "Andere trackingtechnologieën",
			intro: () => "Naast cookies kunnen wij de volgende trackingtechnologieën gebruiken:",
		},
		thirdParties: {
			heading: () => "Cookies van derden",
			intro: () => "De volgende derden kunnen via onze diensten cookies plaatsen:",
			headers: () => ["Dienst", "Doel", "Privacybeleid"],
			linkText: () => "Bekijken",
		},
		consent: {
			heading: () => "Uw toestemming",
			banner: () =>
				"Wij tonen bij uw eerste bezoek aan onze diensten een banner voor cookietoestemming.",
			panel: () =>
				"U kunt uw cookievoorkeuren op elk gewenst moment beheren via ons voorkeurenpaneel.",
			withdraw: () =>
				"U kunt uw toestemming op elk moment intrekken; dit doet echter geen afbreuk aan de rechtmatigheid van de op toestemming gebaseerde verwerking die heeft plaatsgevonden vóór de intrekking.",
		},
		managing: {
			heading: () => "Cookies beheren",
			intro: () =>
				"De meeste webbrowsers stellen u in staat cookies te beheren via hun instellingen. U kunt:",
			items: {
				delete: () => "Reeds op uw apparaat opgeslagen cookies verwijderen",
				block: () => "Het plaatsen van cookies op uw apparaat blokkeren",
				notify: () =>
					"Uw browser zo instellen dat u een melding krijgt wanneer een cookie wordt geplaatst",
			},
			footer: () =>
				"Houd er rekening mee dat het beperken van cookies de functionaliteit van onze diensten kan beïnvloeden. Raadpleeg de helpdocumentatie van uw browser voor instructies over het beheren van cookies.",
		},
		jurisdictionEuUk: {
			heading: {
				euAndUk: () => "Gebruikers in de Europese Unie en het Verenigd Koninkrijk (AVG / UK-GDPR)",
				eu: () => "Gebruikers in de Europese Unie (AVG)",
				uk: () => "Gebruikers in het Verenigd Koninkrijk (UK-GDPR)",
			},
			body: ({ region }) =>
				`Als u zich bevindt in ${region}, beroepen wij ons op uw toestemming als rechtsgrond voor het plaatsen van niet-essentiële cookies. U heeft te allen tijde het recht uw toestemming in te trekken.`,
			region: {
				euAndUk: () => "de Europese Economische Ruimte of het Verenigd Koninkrijk",
				eu: () => "de Europese Economische Ruimte",
				uk: () => "het Verenigd Koninkrijk",
			},
			essentialBody: () =>
				"Essentiële cookies worden geplaatst op grond van ons gerechtvaardigd belang om u een functionerende dienst te bieden.",
		},
		contact: {
			heading: () => "Contact",
			intro: () => "Als u vragen heeft over dit cookiebeleid, neem dan contact met ons op:",
		},
	},
};
