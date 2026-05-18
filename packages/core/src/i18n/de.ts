import type { Dictionary } from "./types";

export const de: Dictionary = {
	shared: {
		versionSuffix: ({ version }) => ` Version: ${version}.`,
		contactLabels: {
			legalName: () => "Firmenname:",
			address: () => "Anschrift:",
			email: () => "E-Mail:",
			url: () => "Website:",
			phone: () => "Telefon:",
			dpo: () => "Datenschutzbeauftragter:",
		},
		legalBasisLabels: {
			consent: () => "Einwilligung (Artikel 6 Absatz 1 Buchstabe a DSGVO)",
			contract: () => "Erfüllung eines Vertrags (Artikel 6 Absatz 1 Buchstabe b DSGVO)",
			legal_obligation: () =>
				"Erfüllung einer rechtlichen Verpflichtung (Artikel 6 Absatz 1 Buchstabe c DSGVO)",
			vital_interests: () =>
				"Schutz lebenswichtiger Interessen (Artikel 6 Absatz 1 Buchstabe d DSGVO)",
			public_task: () =>
				"Wahrnehmung einer Aufgabe im öffentlichen Interesse (Artikel 6 Absatz 1 Buchstabe e DSGVO)",
			legitimate_interests: () => "Berechtigte Interessen (Artikel 6 Absatz 1 Buchstabe f DSGVO)",
		},
	},
	privacy: {
		introduction: {
			heading: () => "Einleitung",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`Diese Datenschutzerklärung beschreibt, wie ${companyName} („wir", „uns" oder „unser") Informationen über Sie erhebt, verwendet und weitergibt, wenn Sie unsere Dienste nutzen. Datum des Inkrafttretens: ${effectiveDate}.${versionSuffix}`,
			contactLine: ({ contactEmail }) =>
				`Wenn Sie Fragen zu dieser Erklärung haben, wenden Sie sich bitte an ${contactEmail}.`,
		},
		childrenPrivacy: {
			heading: () => "Datenschutz für Kinder",
			body: ({ underAge }) =>
				`Unsere Dienste richten sich nicht an Kinder unter ${underAge} Jahren. Wir erheben wissentlich keine personenbezogenen Daten von Kindern unter ${underAge} Jahren. Wenn Sie glauben, dass wir Informationen von einem Kind erhoben haben, kontaktieren Sie uns bitte umgehend.`,
			noticeLinkPrefix: () => "Weitere Informationen finden Sie in unserem ",
			noticeLinkText: () => "Datenschutzhinweis für Kinder",
		},
		dataCollected: {
			heading: () => "Welche Daten wir erheben",
			intro: {
				withGdpr: () =>
					"Wir erheben die folgenden Kategorien personenbezogener Daten zu den unten beschriebenen Zwecken. Gemäß Artikel 6 DSGVO stützen wir uns für jeden Verarbeitungszweck auf die angegebenen Rechtsgrundlagen:",
				withoutGdpr: () =>
					"Wir erheben die folgenden Kategorien personenbezogener Daten zu den unten beschriebenen Zwecken:",
			},
			headers: {
				withGdpr: () => ["Kategorie", "Erhobene Felder", "Zweck", "Rechtsgrundlage"],
				withoutGdpr: () => ["Kategorie", "Erhobene Felder", "Zweck"],
			},
		},
		consentWithdrawal: {
			heading: () => "Recht auf Widerruf der Einwilligung",
			body: ({ contactEmail }) =>
				`Soweit wir uns für die Verarbeitung Ihrer personenbezogenen Daten auf Ihre Einwilligung stützen, haben Sie das Recht, diese Einwilligung jederzeit zu widerrufen, indem Sie uns unter ${contactEmail} kontaktieren. Der Widerruf Ihrer Einwilligung berührt nicht die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung. Soweit die Einwilligung für die Bereitstellung einer bestimmten Funktion oder Dienstleistung erforderlich ist, kann ihr Widerruf bedeuten, dass wir Ihnen diese Funktion oder Dienstleistung nicht mehr anbieten können.`,
		},
		automatedDecisionMaking: {
			heading: () => "Automatisierte Entscheidungsfindung und Profiling",
			empty: () =>
				"Wir führen keine automatisierte Entscheidungsfindung oder Profiling durch, die Ihnen gegenüber rechtliche Wirkung entfaltet oder Sie in ähnlicher Weise erheblich beeinträchtigt im Sinne von Artikel 22 DSGVO.",
			intro: () =>
				"Wir setzen die folgenden automatisierten Verarbeitungen ein, die Ihnen gegenüber rechtliche Wirkung entfalten oder Sie in ähnlicher Weise erheblich beeinträchtigen können. Für jede beschreiben wir die involvierte Logik sowie die Tragweite und die angestrebten Auswirkungen:",
			significanceLabel: () => "Tragweite:",
			humanReview: {
				label: () => "Recht auf menschliche Überprüfung.",
				body: ({ contactEmail }) =>
					` Sie haben das Recht, nicht einer ausschließlich auf automatisierter Verarbeitung – einschließlich Profiling – beruhenden Entscheidung unterworfen zu werden. Um menschliches Eingreifen zu verlangen, Ihren Standpunkt darzulegen oder eine Entscheidung anzufechten, kontaktieren Sie uns unter ${contactEmail}.`,
			},
		},
		dataRetention: {
			heading: () => "Aufbewahrungsdauer",
			intro: () => "Wir bewahren Ihre Daten für die folgenden Zeiträume auf:",
			headers: () => ["Kategorie", "Aufbewahrungsdauer"],
		},
		provisionRequirement: {
			heading: () => "Verpflichtung zur Bereitstellung der Daten",
			body: () =>
				"Für jede Kategorie personenbezogener Daten, die wir erheben, geben wir nachfolgend an, ob Sie zu ihrer Bereitstellung verpflichtet sind – kraft Gesetzes, im Rahmen unseres Vertrags mit Ihnen oder als Voraussetzung für einen Vertragsabschluss – oder ob die Bereitstellung freiwillig ist, sowie die Folgen einer Nichtbereitstellung.",
			headers: () => ["Kategorie", "Charakter", "Folgen"],
		},
		cookies: {
			heading: () => "Cookies und Tracking",
			empty: () => "Wir verwenden keine Cookies oder vergleichbaren Tracking-Technologien.",
			intro: () => "Wir verwenden die folgenden Arten von Cookies und Tracking-Technologien:",
			headers: () => ["Kategorie", "Rechtsgrundlage"],
		},
		thirdParties: {
			heading: () => "Drittanbieter",
			empty: () =>
				"Wir geben Ihre personenbezogenen Daten nicht an Dritte weiter, außer wenn dies gesetzlich vorgeschrieben ist.",
			intro: () => "Wir teilen Daten mit den folgenden Drittanbietern:",
			headers: () => ["Dienst", "Zweck", "Datenschutzerklärung"],
			linkText: () => "Anzeigen",
		},
		userRights: {
			heading: () => "Ihre Rechte",
			intro: () => "Sie haben die folgenden Rechte bezüglich Ihrer personenbezogenen Daten:",
			labels: {
				access: () => "Recht auf Auskunft über Ihre personenbezogenen Daten",
				rectification: () => "Recht auf Berichtigung unrichtiger Daten",
				erasure: () => "Recht auf Löschung Ihrer Daten",
				portability: () => "Recht auf Datenübertragbarkeit",
				restriction: () => "Recht auf Einschränkung der Verarbeitung",
				objection: () => "Recht auf Widerspruch gegen die Verarbeitung",
				opt_out_sale: () => "Recht, dem Verkauf Ihrer personenbezogenen Daten zu widersprechen",
				non_discrimination: () =>
					"Recht auf diskriminierungsfreie Behandlung bei der Ausübung Ihrer Rechte",
			},
		},
		dpo: {
			present: {
				trailing: () =>
					". Sie können sich für alle Fragen zu dieser Erklärung oder zum Umgang mit Ihren personenbezogenen Daten direkt an unseren Datenschutzbeauftragten wenden.",
			},
			absentRequiredFalse: ({ reason }) =>
				`Wir haben keinen Datenschutzbeauftragten benannt. Unsere Verarbeitungstätigkeiten erreichen nicht die Schwellen nach Artikel 37 Absatz 1 DSGVO, die eine Benennung erfordern würden.${reason}`,
			absentFallback: () =>
				"Wir haben keinen Datenschutzbeauftragten benannt. Unsere Verarbeitungstätigkeiten erreichen nicht die Schwellen nach Artikel 37 Absatz 1 DSGVO, die eine Benennung erfordern würden. Für Fragen zu dieser Erklärung oder zum Umgang mit Ihren personenbezogenen Daten verwenden Sie bitte die oben angegebenen Kontaktdaten.",
		},
		euRepresentative: {
			body: ({ address, email }) => ({
				prefix: "Unser Vertreter in der Europäischen Union im Sinne von Artikel 27 DSGVO ist ",
				suffix: `, ${address}, ${email}.`,
			}),
		},
		gdprSupplement: {
			heading: () => "Ergänzende Hinweise nach DSGVO",
			scope: () =>
				"Dieser Abschnitt gilt für Personen im Europäischen Wirtschaftsraum (EWR) gemäß der Datenschutz-Grundverordnung (DSGVO).",
			dataControllerLabel: () => "Verantwortlicher: ",
			complaintBody: {
				prefix: () =>
					"Sie haben das Recht, bei der Datenschutzaufsichtsbehörde Ihres Wohnsitzlandes, Ihres Arbeitsorts oder des Orts des mutmaßlichen Verstoßes Beschwerde einzulegen. Eine Liste der Aufsichtsbehörden im EWR finden Sie unter ",
				linkText: () => "edpb.europa.eu/about-edpb/about-edpb/members_en",
				suffix: () => ".",
			},
			transferBody: {
				prefix: () =>
					"Soweit wir Ihre personenbezogenen Daten außerhalb des EWR übermitteln, stützen wir uns auf eine oder mehrere der in Kapitel V DSGVO vorgesehenen Garantien: (a) Übermittlungen in Länder, für die die Europäische Kommission ein angemessenes Schutzniveau festgestellt hat (die aktuelle Liste ist veröffentlicht unter ",
				adequacyLinkText: () => "commission.europa.eu/.../adequacy-decisions_en",
				middle: () =>
					"); (b) Standardvertragsklauseln (SCC), die von der Europäischen Kommission gemäß Artikel 46 Absatz 2 Buchstabe c erlassen wurden; und (c) verbindliche interne Datenschutzvorschriften (BCR), die gemäß Artikel 47 genehmigt wurden, sofern anwendbar. Weitere Informationen zu den auf eine bestimmte Übermittlung angewandten Garantien können Sie unter ",
				email: ({ contactEmail }) => `${contactEmail} anfordern.`,
			},
		},
		ukGdprSupplement: {
			heading: () => "Datenschutzrechte im Vereinigten Königreich (UK-GDPR)",
			scope: () =>
				"Dieser Abschnitt gilt für Personen im Vereinigten Königreich gemäß der UK-Datenschutz-Grundverordnung (UK-GDPR), wie sie durch den Data Protection Act 2018 angepasst wurde.",
			dataControllerLabel: () => "Verantwortlicher: ",
			ico: {
				prefix: () => "Die Datenschutzaufsichtsbehörde im Vereinigten Königreich ist das ",
				label: () => "Information Commissioner's Office (ICO)",
				suffix: () =>
					". Wenn Sie der Auffassung sind, dass wir Ihre Daten nicht gemäß dem britischen Datenschutzrecht behandelt haben, haben Sie das Recht, beim ICO unter ",
				linkText: () => "ico.org.uk/make-a-complaint",
				suffix2: () => " Beschwerde einzulegen.",
			},
			transferBody: () =>
				"Soweit wir Ihre personenbezogenen Daten außerhalb des Vereinigten Königreichs übermitteln, stellen wir sicher, dass angemessene Garantien im Einklang mit der UK-GDPR vorhanden sind, einschließlich des UK International Data Transfer Agreement oder des UK Addendum zu den EU-Standardvertragsklauseln, sofern anwendbar.",
		},
		ccpaSupplement: {
			heading: () => "Datenschutzrechte in Kalifornien (CCPA)",
			intro: () =>
				"Wenn Sie in Kalifornien ansässig sind, haben Sie die folgenden zusätzlichen Rechte:",
			rights: {
				know: () =>
					"Recht auf Auskunft – Sie können die Offenlegung der personenbezogenen Informationen verlangen, die wir über Sie erheben, verwenden und weitergeben.",
				delete: () =>
					"Recht auf Löschung – Sie können die Löschung der personenbezogenen Informationen verlangen, die wir über Sie erhoben haben.",
				optOut: () =>
					"Widerspruchsrecht gegen den Verkauf – Sie können dem Verkauf Ihrer personenbezogenen Informationen widersprechen.",
				nonDiscrimination: () =>
					"Recht auf Nichtdiskriminierung – Wir werden Sie für die Ausübung Ihrer CCPA-Rechte nicht diskriminieren.",
			},
			submitting: {
				label: () => "Einreichung von Anträgen.",
				body: () =>
					" Um eines dieser Rechte auszuüben, kontaktieren Sie uns über eine der unten angegebenen Methoden. Wir werden innerhalb der in CCPA §1798.130 vorgeschriebenen Fristen antworten.",
			},
		},
		contact: {
			heading: () => "Kontakt",
			intro: () => "Kontaktieren Sie uns:",
		},
		provisionBasisLabels: {
			statutory: () => "Gesetzlich vorgeschrieben",
			contractual: () => "Vertraglich vorgeschrieben",
			"contract-prerequisite": () => "Voraussetzung für einen Vertragsabschluss",
			voluntary: () => "Freiwillig",
		},
		cookieCategoryLabels: {
			essential: () => "Essenzielle Cookies – erforderlich für die Funktion des Dienstes",
			analytics: () => "Analyse-Cookies – helfen uns zu verstehen, wie der Dienst genutzt wird",
			functional: () => "Funktionale Cookies – speichern Ihre Einstellungen und Präferenzen",
			marketing: () => "Marketing-Cookies – dienen der Auslieferung relevanter Werbung",
		},
		cookieCategoryFallback: ({ key }) => `${key}-Cookies`,
	},
	cookie: {
		introduction: {
			heading: () => "Cookie-Richtlinie",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`Diese Cookie-Richtlinie erläutert, wie ${companyName} („wir", „uns" oder „unser") Cookies und vergleichbare Tracking-Technologien auf unseren Diensten verwendet. Datum des Inkrafttretens: ${effectiveDate}.${versionSuffix}`,
		},
		whatAreCookies: {
			heading: () => "Was sind Cookies?",
			body1: () =>
				"Cookies sind kleine Textdateien, die von den von Ihnen besuchten Websites auf Ihrem Gerät abgelegt werden. Sie werden weithin eingesetzt, damit Websites effizienter funktionieren und um Informationen an die Website-Betreiber bereitzustellen.",
			body2: () =>
				'Cookies können „Sitzungs-Cookies" sein (werden beim Schließen des Browsers gelöscht) oder „dauerhafte Cookies" (verbleiben auf Ihrem Gerät, bis sie ablaufen oder gelöscht werden).',
		},
		types: {
			heading: () => "Arten der von uns verwendeten Cookies",
			empty: () => "Wir verwenden derzeit keine Cookies.",
			headers: () => ["Art", "Beschreibung"],
			labels: {
				essential: {
					label: () => "Essenzielle Cookies",
					description: () =>
						"Erforderlich für die grundlegende Funktion unserer Dienste. Sie können nicht deaktiviert werden.",
				},
				analytics: {
					label: () => "Analyse-Cookies",
					description: () =>
						"Helfen uns zu verstehen, wie Besucher mit unseren Diensten interagieren, damit wir sie verbessern können.",
				},
				functional: {
					label: () => "Funktionale Cookies",
					description: () =>
						"Ermöglichen erweiterte Funktionen und Personalisierung, etwa das Speichern Ihrer Einstellungen.",
				},
				marketing: {
					label: () => "Marketing-Cookies",
					description: () =>
						"Werden eingesetzt, um Ihnen relevantere Werbung anzuzeigen, die auf Ihre Interessen abgestimmt ist.",
				},
			},
			fallback: ({ key }) => ({
				label: `${key.charAt(0).toUpperCase()}${key.slice(1)}-Cookies`,
				description: "",
			}),
		},
		trackingTechnologies: {
			heading: () => "Weitere Tracking-Technologien",
			intro: () =>
				"Zusätzlich zu Cookies setzen wir möglicherweise die folgenden Tracking-Technologien ein:",
		},
		thirdParties: {
			heading: () => "Cookies von Drittanbietern",
			intro: () => "Folgende Dritte können über unsere Dienste Cookies setzen:",
			headers: () => ["Dienst", "Zweck", "Datenschutzerklärung"],
			linkText: () => "Anzeigen",
		},
		consent: {
			heading: () => "Ihre Einwilligung",
			banner: () =>
				"Beim ersten Besuch unserer Dienste zeigen wir ein Cookie-Einwilligungsbanner an.",
			panel: () =>
				"Sie können Ihre Cookie-Einstellungen jederzeit über unser Präferenzpanel verwalten.",
			withdraw: () =>
				"Sie können Ihre Einwilligung jederzeit widerrufen; dies berührt jedoch nicht die Rechtmäßigkeit der bis zum Widerruf auf Grundlage der Einwilligung erfolgten Verarbeitung.",
		},
		managing: {
			heading: () => "Verwaltung von Cookies",
			intro: () =>
				"Die meisten Webbrowser ermöglichen es Ihnen, Cookies über ihre Einstellungen zu steuern. Sie können:",
			items: {
				delete: () => "Bereits auf Ihrem Gerät gespeicherte Cookies löschen",
				block: () => "Das Setzen von Cookies auf Ihrem Gerät blockieren",
				notify: () =>
					"Ihren Browser so einstellen, dass er Sie benachrichtigt, wenn ein Cookie gesetzt wird",
			},
			footer: () =>
				"Bitte beachten Sie, dass das Beschränken von Cookies die Funktionalität unserer Dienste beeinträchtigen kann. Eine Anleitung zur Verwaltung von Cookies finden Sie in der Hilfe-Dokumentation Ihres Browsers.",
		},
		jurisdictionEuUk: {
			heading: {
				euAndUk: () => "Nutzer in der EU und im Vereinigten Königreich (DSGVO / UK-GDPR)",
				eu: () => "Nutzer in der Europäischen Union (DSGVO)",
				uk: () => "Nutzer im Vereinigten Königreich (UK-GDPR)",
			},
			body: ({ region }) =>
				`Wenn Sie sich in ${region} befinden, stützen wir uns für das Setzen nicht-essenzieller Cookies auf Ihre Einwilligung als Rechtsgrundlage. Sie haben das Recht, Ihre Einwilligung jederzeit zu widerrufen.`,
			region: {
				euAndUk: () => "dem Europäischen Wirtschaftsraum oder im Vereinigten Königreich",
				eu: () => "dem Europäischen Wirtschaftsraum",
				uk: () => "dem Vereinigten Königreich",
			},
			essentialBody: () =>
				"Essenzielle Cookies werden auf Grundlage unseres berechtigten Interesses gesetzt, Ihnen einen funktionierenden Dienst bereitzustellen.",
		},
		contact: {
			heading: () => "Kontakt",
			intro: () => "Bei Fragen zu dieser Cookie-Richtlinie kontaktieren Sie uns bitte:",
		},
	},
};
