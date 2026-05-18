import type { Dictionary } from "./types";

export const fr: Dictionary = {
	shared: {
		versionSuffix: ({ version }) => ` Version : ${version}.`,
		contactLabels: {
			legalName: () => "Raison sociale :",
			address: () => "Adresse :",
			email: () => "E-mail :",
			url: () => "Site web :",
			phone: () => "Téléphone :",
			dpo: () => "Délégué à la protection des données :",
		},
		legalBasisLabels: {
			consent: () => "Consentement (article 6, paragraphe 1, point a))",
			contract: () => "Exécution d'un contrat (article 6, paragraphe 1, point b))",
			legal_obligation: () => "Respect d'une obligation légale (article 6, paragraphe 1, point c))",
			vital_interests: () => "Sauvegarde des intérêts vitaux (article 6, paragraphe 1, point d))",
			public_task: () =>
				"Exécution d'une mission d'intérêt public (article 6, paragraphe 1, point e))",
			legitimate_interests: () => "Intérêts légitimes (article 6, paragraphe 1, point f))",
		},
	},
	privacy: {
		introduction: {
			heading: () => "Introduction",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`La présente politique de confidentialité décrit la manière dont ${companyName} (« nous », « notre » ou « nos ») collecte, utilise et partage les informations vous concernant lorsque vous utilisez nos services. Date d'entrée en vigueur : ${effectiveDate}.${versionSuffix}`,
			contactLine: ({ contactEmail }) =>
				`Si vous avez des questions concernant la présente politique, veuillez nous contacter à l'adresse ${contactEmail}.`,
		},
		childrenPrivacy: {
			heading: () => "Vie privée des enfants",
			body: ({ underAge }) =>
				`Nos services ne sont pas destinés aux enfants âgés de moins de ${underAge} ans. Nous ne collectons pas sciemment de données à caractère personnel auprès d'enfants de moins de ${underAge} ans. Si vous pensez que nous avons collecté des informations concernant un enfant, veuillez nous contacter immédiatement.`,
			noticeLinkPrefix: () => "Pour plus d'informations, consultez notre ",
			noticeLinkText: () => "Avis de confidentialité destiné aux enfants",
		},
		dataCollected: {
			heading: () => "Données que nous collectons",
			intro: {
				withGdpr: () =>
					"Nous collectons les catégories de données à caractère personnel ci-dessous aux fins décrites. En application de l'article 6 du RGPD, nous nous appuyons sur les bases légales indiquées pour chaque finalité de traitement :",
				withoutGdpr: () =>
					"Nous collectons les catégories de données à caractère personnel ci-dessous aux fins décrites :",
			},
			headers: {
				withGdpr: () => ["Catégorie", "Champs collectés", "Finalité", "Base légale"],
				withoutGdpr: () => ["Catégorie", "Champs collectés", "Finalité"],
			},
		},
		consentWithdrawal: {
			heading: () => "Droit de retirer son consentement",
			body: ({ contactEmail }) =>
				`Lorsque nous nous appuyons sur votre consentement pour traiter vos données à caractère personnel, vous avez le droit de retirer ce consentement à tout moment en nous contactant à l'adresse ${contactEmail}. Le retrait de votre consentement n'affecte pas la licéité du traitement effectué avant ce retrait. Lorsque le consentement est requis pour fournir une fonctionnalité ou un service particulier, son retrait peut signifier que nous ne sommes plus en mesure de proposer cette fonctionnalité ou ce service.`,
		},
		automatedDecisionMaking: {
			heading: () => "Décision automatisée et profilage",
			empty: () =>
				"Nous n'effectuons pas de prise de décision automatisée ni de profilage produisant à votre égard des effets juridiques ou vous affectant de manière significative de façon similaire, au sens de l'article 22 du RGPD.",
			intro: () =>
				"Nous utilisons les traitements automatisés suivants pouvant produire à votre égard des effets juridiques ou vous affecter de manière significative de façon similaire. Pour chacun, nous décrivons la logique sous-jacente ainsi que l'importance et les conséquences prévues :",
			significanceLabel: () => "Importance :",
			humanReview: {
				label: () => "Droit à une intervention humaine.",
				body: ({ contactEmail }) =>
					` Vous avez le droit de ne pas faire l'objet d'une décision fondée exclusivement sur un traitement automatisé, y compris le profilage. Pour demander une intervention humaine, exprimer votre point de vue ou contester une décision, contactez-nous à l'adresse ${contactEmail}.`,
			},
		},
		dataRetention: {
			heading: () => "Conservation des données",
			intro: () => "Nous conservons vos données pendant les durées suivantes :",
			headers: () => ["Catégorie", "Durée de conservation"],
		},
		provisionRequirement: {
			heading: () => "Caractère obligatoire ou facultatif de la fourniture des données",
			body: () =>
				"Pour chaque catégorie de données à caractère personnel que nous collectons, nous indiquons ci-dessous si vous êtes tenu(e) de la fournir — en vertu de la loi, de notre contrat avec vous, ou en tant que condition préalable à la conclusion d'un contrat — ou si sa fourniture est facultative, ainsi que les conséquences d'un défaut de fourniture.",
			headers: () => ["Catégorie", "Caractère", "Conséquences"],
		},
		cookies: {
			heading: () => "Cookies et technologies de suivi",
			empty: () => "Nous n'utilisons pas de cookies ni de technologies de suivi similaires.",
			intro: () => "Nous utilisons les types de cookies et de technologies de suivi suivants :",
			headers: () => ["Catégorie", "Base légale"],
		},
		thirdParties: {
			heading: () => "Services tiers",
			empty: () =>
				"Nous ne partageons pas vos informations personnelles avec des tiers, sauf si la loi l'exige.",
			intro: () => "Nous partageons des données avec les services tiers suivants :",
			headers: () => ["Service", "Finalité", "Politique de confidentialité"],
			linkText: () => "Consulter",
		},
		userRights: {
			heading: () => "Vos droits",
			intro: () =>
				"Vous disposez des droits suivants concernant vos données à caractère personnel :",
			labels: {
				access: () => "Droit d'accès à vos données à caractère personnel",
				rectification: () => "Droit de rectification des données inexactes",
				erasure: () => "Droit à l'effacement de vos données",
				portability: () => "Droit à la portabilité de vos données",
				restriction: () => "Droit à la limitation du traitement",
				objection: () => "Droit d'opposition au traitement",
				opt_out_sale: () => "Droit de refuser la vente de vos informations personnelles",
				non_discrimination: () =>
					"Droit à un traitement non discriminatoire pour l'exercice de vos droits",
			},
		},
		dpo: {
			present: {
				trailing: () =>
					". Vous pouvez contacter directement notre Délégué à la protection des données pour toute question relative à la présente politique ou à la manière dont nous traitons vos données à caractère personnel.",
			},
			absentRequiredFalse: ({ reason }) =>
				`Nous n'avons pas désigné de Délégué à la protection des données. Nos activités de traitement n'atteignent pas les seuils prévus à l'article 37, paragraphe 1, du RGPD imposant cette désignation.${reason}`,
			absentFallback: () =>
				"Nous n'avons pas désigné de Délégué à la protection des données. Nos activités de traitement n'atteignent pas les seuils prévus à l'article 37, paragraphe 1, du RGPD imposant cette désignation. Pour toute question relative à la présente politique ou à la manière dont nous traitons vos données à caractère personnel, veuillez utiliser les coordonnées ci-dessus.",
		},
		euRepresentative: {
			body: ({ address, email }) => ({
				prefix: "Notre représentant dans l'Union européenne au sens de l'article 27 du RGPD est ",
				suffix: `, ${address}, ${email}.`,
			}),
		},
		gdprSupplement: {
			heading: () => "Informations complémentaires RGPD",
			scope: () =>
				"La présente section s'applique aux personnes situées dans l'Espace économique européen (EEE) au titre du Règlement général sur la protection des données (RGPD).",
			dataControllerLabel: () => "Responsable du traitement : ",
			complaintBody: {
				prefix: () =>
					"Vous avez le droit d'introduire une réclamation auprès de l'autorité de contrôle de la protection des données de votre pays de résidence, de votre lieu de travail ou du lieu de la violation présumée. La liste des autorités de contrôle de l'EEE est disponible à l'adresse ",
				linkText: () => "edpb.europa.eu/about-edpb/about-edpb/members_en",
				suffix: () => ".",
			},
			transferBody: {
				prefix: () =>
					"Lorsque nous transférons vos données à caractère personnel hors de l'EEE, nous nous appuyons sur l'une ou plusieurs des garanties prévues au chapitre V du RGPD : (a) les transferts vers des pays bénéficiant d'une décision d'adéquation de la Commission européenne (la liste à jour est publiée à l'adresse ",
				adequacyLinkText: () => "commission.europa.eu/.../adequacy-decisions_en",
				middle: () =>
					") ; (b) les Clauses contractuelles types (CCT) adoptées par la Commission européenne en application de l'article 46, paragraphe 2, point c) ; et (c) les Règles d'entreprise contraignantes (BCR) approuvées au titre de l'article 47, le cas échéant. Vous pouvez demander des informations complémentaires sur les garanties spécifiques appliquées à un transfert particulier en nous contactant à l'adresse ",
				email: ({ contactEmail }) => `${contactEmail}.`,
			},
		},
		ukGdprSupplement: {
			heading: () => "Droits relatifs à la vie privée au Royaume-Uni (UK-GDPR)",
			scope: () =>
				"La présente section s'applique aux personnes situées au Royaume-Uni au titre du règlement UK-GDPR, tel qu'adapté par le Data Protection Act 2018.",
			dataControllerLabel: () => "Responsable du traitement : ",
			ico: {
				prefix: () => "L'autorité de contrôle de la protection des données au Royaume-Uni est l'",
				label: () => "Information Commissioner's Office (ICO)",
				suffix: () =>
					". Si vous estimez que nous n'avons pas traité vos données conformément au droit britannique de la protection des données, vous avez le droit d'introduire une réclamation auprès de l'ICO à l'adresse ",
				linkText: () => "ico.org.uk/make-a-complaint",
				suffix2: () => ".",
			},
			transferBody: () =>
				"Si nous transférons vos données à caractère personnel hors du Royaume-Uni, nous veillons à ce que des garanties appropriées soient en place conformément au UK-GDPR, notamment l'accord international de transfert de données du Royaume-Uni (IDTA) ou l'avenant britannique aux clauses contractuelles types de l'UE, le cas échéant.",
		},
		ccpaSupplement: {
			heading: () => "Droits relatifs à la vie privée en Californie (CCPA)",
			intro: () =>
				"Si vous résidez en Californie, vous disposez des droits supplémentaires suivants :",
			rights: {
				know: () =>
					"Droit à l'information — Vous pouvez demander la communication des informations personnelles que nous collectons, utilisons et partageons à votre sujet.",
				delete: () =>
					"Droit à la suppression — Vous pouvez demander la suppression des informations personnelles que nous avons collectées à votre sujet.",
				optOut: () =>
					"Droit d'opposition à la vente — Vous pouvez vous opposer à la vente de vos informations personnelles.",
				nonDiscrimination: () =>
					"Droit à la non-discrimination — Nous ne vous traiterons pas de manière discriminatoire pour l'exercice de vos droits CCPA.",
			},
			submitting: {
				label: () => "Soumission des demandes.",
				body: () =>
					" Pour exercer l'un de ces droits, contactez-nous via l'une des méthodes indiquées ci-dessous. Nous répondrons dans les délais prévus par la section 1798.130 du CCPA.",
			},
		},
		contact: {
			heading: () => "Nous contacter",
			intro: () => "Nous contacter :",
		},
		provisionBasisLabels: {
			statutory: () => "Imposé par la loi",
			contractual: () => "Imposé par notre contrat avec vous",
			"contract-prerequisite": () => "Préalable à la conclusion d'un contrat",
			voluntary: () => "Facultatif",
		},
		cookieCategoryLabels: {
			essential: () => "Cookies essentiels — requis pour le fonctionnement du service",
			analytics: () =>
				"Cookies d'analyse — nous aident à comprendre comment le service est utilisé",
			functional: () => "Cookies fonctionnels — mémorisent vos préférences et paramètres",
			marketing: () => "Cookies marketing — utilisés pour diffuser des publicités pertinentes",
		},
		cookieCategoryFallback: ({ key }) => `Cookies ${key}`,
	},
	cookie: {
		introduction: {
			heading: () => "Politique relative aux cookies",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`La présente politique relative aux cookies explique comment ${companyName} (« nous », « notre » ou « nos ») utilise les cookies et les technologies de suivi similaires sur nos services. Date d'entrée en vigueur : ${effectiveDate}.${versionSuffix}`,
		},
		whatAreCookies: {
			heading: () => "Qu'est-ce qu'un cookie ?",
			body1: () =>
				"Les cookies sont de petits fichiers texte déposés sur votre appareil par les sites web que vous visitez. Ils sont largement utilisés pour faire fonctionner les sites plus efficacement et fournir des informations à leurs propriétaires.",
			body2: () =>
				"Les cookies peuvent être « de session » (supprimés à la fermeture de votre navigateur) ou « persistants » (conservés sur votre appareil jusqu'à leur expiration ou suppression).",
		},
		types: {
			heading: () => "Types de cookies que nous utilisons",
			empty: () => "Nous n'utilisons actuellement aucun cookie.",
			headers: () => ["Type", "Description"],
			labels: {
				essential: {
					label: () => "Cookies essentiels",
					description: () =>
						"Requis pour le fonctionnement de base de nos services. Ils ne peuvent pas être désactivés.",
				},
				analytics: {
					label: () => "Cookies d'analyse",
					description: () =>
						"Nous aident à comprendre comment les visiteurs interagissent avec nos services afin de les améliorer.",
				},
				functional: {
					label: () => "Cookies fonctionnels",
					description: () =>
						"Activent une fonctionnalité améliorée et la personnalisation, comme la mémorisation de vos préférences.",
				},
				marketing: {
					label: () => "Cookies marketing",
					description: () =>
						"Utilisés pour diffuser des publicités plus pertinentes pour vous et vos centres d'intérêt.",
				},
			},
			fallback: ({ key }) => ({
				label: `Cookies ${key}`,
				description: "",
			}),
		},
		trackingTechnologies: {
			heading: () => "Autres technologies de suivi",
			intro: () => "Outre les cookies, nous pouvons utiliser les technologies de suivi suivantes :",
		},
		thirdParties: {
			heading: () => "Cookies tiers",
			intro: () => "Les tiers suivants sont susceptibles de déposer des cookies via nos services :",
			headers: () => ["Service", "Finalité", "Politique de confidentialité"],
			linkText: () => "Consulter",
		},
		consent: {
			heading: () => "Votre consentement",
			banner: () =>
				"Nous affichons une bannière de consentement aux cookies lors de votre première visite sur nos services.",
			panel: () =>
				"Vous pouvez gérer vos préférences en matière de cookies à tout moment via notre panneau de préférences.",
			withdraw: () =>
				"Vous pouvez retirer votre consentement à tout moment ; toutefois, cela n'affectera pas la licéité du traitement fondé sur le consentement effectué avant ce retrait.",
		},
		managing: {
			heading: () => "Gestion des cookies",
			intro: () =>
				"La plupart des navigateurs web vous permettent de contrôler les cookies via leurs paramètres. Vous pouvez :",
			items: {
				delete: () => "Supprimer les cookies déjà stockés sur votre appareil",
				block: () => "Bloquer le dépôt de cookies sur votre appareil",
				notify: () =>
					"Configurer votre navigateur pour qu'il vous avertisse lorsqu'un cookie est déposé",
			},
			footer: () =>
				"Veuillez noter que la restriction des cookies peut affecter la fonctionnalité de nos services. Consultez la documentation d'aide de votre navigateur pour obtenir des instructions sur la gestion des cookies.",
		},
		jurisdictionEuUk: {
			heading: {
				euAndUk: () => "Utilisateurs de l'Union européenne et du Royaume-Uni (RGPD / UK-GDPR)",
				eu: () => "Utilisateurs de l'Union européenne (RGPD)",
				uk: () => "Utilisateurs du Royaume-Uni (UK-GDPR)",
			},
			body: ({ region }) =>
				`Si vous résidez dans ${region}, nous nous appuyons sur votre consentement comme base légale pour le dépôt de cookies non essentiels. Vous avez le droit de retirer votre consentement à tout moment.`,
			region: {
				euAndUk: () => "l'Espace économique européen ou le Royaume-Uni",
				eu: () => "l'Espace économique européen",
				uk: () => "le Royaume-Uni",
			},
			essentialBody: () =>
				"Les cookies essentiels sont déposés au titre de notre intérêt légitime à vous fournir un service fonctionnel.",
		},
		contact: {
			heading: () => "Nous contacter",
			intro: () =>
				"Si vous avez des questions concernant la présente politique relative aux cookies, veuillez nous contacter :",
		},
	},
};
