import type { Dictionary } from "./types";

export const es: Dictionary = {
	shared: {
		versionSuffix: ({ version }) => ` Versión: ${version}.`,
		contactLabels: {
			legalName: () => "Razón social:",
			address: () => "Dirección:",
			email: () => "Correo electrónico:",
			phone: () => "Teléfono:",
			dpo: () => "Delegado de Protección de Datos:",
		},
		legalBasisLabels: {
			consent: () => "Consentimiento (artículo 6, apartado 1, letra a) del RGPD)",
			contract: () => "Ejecución de un contrato (artículo 6, apartado 1, letra b) del RGPD)",
			legal_obligation: () =>
				"Cumplimiento de una obligación legal (artículo 6, apartado 1, letra c) del RGPD)",
			vital_interests: () =>
				"Protección de intereses vitales (artículo 6, apartado 1, letra d) del RGPD)",
			public_task: () =>
				"Cumplimiento de una misión de interés público (artículo 6, apartado 1, letra e) del RGPD)",
			legitimate_interests: () => "Intereses legítimos (artículo 6, apartado 1, letra f) del RGPD)",
		},
	},
	privacy: {
		introduction: {
			heading: () => "Introducción",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`La presente Política de Privacidad describe cómo ${companyName} («nosotros», «nos» o «nuestro») recopila, utiliza y comparte información sobre usted cuando utiliza nuestros servicios. Fecha de entrada en vigor: ${effectiveDate}.${versionSuffix}`,
			contactLine: ({ contactEmail }) =>
				`Si tiene preguntas sobre esta política, póngase en contacto con nosotros en ${contactEmail}.`,
		},
		childrenPrivacy: {
			heading: () => "Privacidad de los menores",
			body: ({ underAge }) =>
				`Nuestros servicios no están dirigidos a menores de ${underAge} años. No recopilamos a sabiendas datos personales de menores de ${underAge} años. Si cree que hemos recopilado información de un menor, póngase en contacto con nosotros de inmediato.`,
			noticeLinkPrefix: () => "Para más información, consulte nuestro ",
			noticeLinkText: () => "Aviso de privacidad para menores",
		},
		dataCollected: {
			heading: () => "Información que recopilamos",
			intro: {
				withGdpr: () =>
					"Recopilamos las siguientes categorías de datos personales con las finalidades descritas a continuación. En virtud del artículo 6 del RGPD, nos basamos en las bases jurídicas indicadas para cada finalidad de tratamiento:",
				withoutGdpr: () =>
					"Recopilamos las siguientes categorías de datos personales con las finalidades descritas a continuación:",
			},
			headers: {
				withGdpr: () => ["Categoría", "Campos recopilados", "Finalidad", "Base jurídica"],
				withoutGdpr: () => ["Categoría", "Campos recopilados", "Finalidad"],
			},
		},
		consentWithdrawal: {
			heading: () => "Derecho a retirar el consentimiento",
			body: ({ contactEmail }) =>
				`Cuando nos basemos en su consentimiento para el tratamiento de sus datos personales, tiene derecho a retirar dicho consentimiento en cualquier momento poniéndose en contacto con nosotros en ${contactEmail}. La retirada de su consentimiento no afectará a la licitud del tratamiento realizado con anterioridad. Cuando el consentimiento sea necesario para prestar una determinada funcionalidad o servicio, su retirada puede implicar que ya no podamos ofrecerle dicha funcionalidad o servicio.`,
		},
		automatedDecisionMaking: {
			heading: () => "Decisiones automatizadas y elaboración de perfiles",
			empty: () =>
				"No realizamos decisiones automatizadas ni elaboración de perfiles que produzcan efectos jurídicos sobre usted o le afecten de modo similar de manera significativa, en el sentido del artículo 22 del RGPD.",
			intro: () =>
				"Utilizamos los siguientes tratamientos automatizados que pueden producir efectos jurídicos sobre usted o afectarle de modo similar de manera significativa. Para cada uno describimos la lógica aplicada y la importancia y consecuencias previstas:",
			significanceLabel: () => "Importancia:",
			humanReview: {
				label: () => "Derecho a la intervención humana.",
				body: ({ contactEmail }) =>
					` Tiene derecho a no ser objeto de una decisión basada únicamente en el tratamiento automatizado, incluida la elaboración de perfiles. Para solicitar intervención humana, expresar su punto de vista o impugnar una decisión, póngase en contacto con nosotros en ${contactEmail}.`,
			},
		},
		dataRetention: {
			heading: () => "Conservación de los datos",
			intro: () => "Conservamos sus datos durante los siguientes plazos:",
			headers: () => ["Categoría", "Plazo de conservación"],
		},
		provisionRequirement: {
			heading: () => "Carácter obligatorio o facultativo de la facilitación de los datos",
			body: () =>
				"Para cada categoría de datos personales que recopilamos, indicamos a continuación si está obligado/a a facilitarlos — por ley, en virtud de nuestro contrato con usted o como condición previa a la celebración de un contrato — o si su facilitación es voluntaria, así como las consecuencias de no facilitarlos.",
			headers: () => ["Categoría", "Carácter", "Consecuencias"],
		},
		cookies: {
			heading: () => "Cookies y seguimiento",
			empty: () => "No utilizamos cookies ni tecnologías de seguimiento similares.",
			intro: () => "Utilizamos los siguientes tipos de cookies y tecnologías de seguimiento:",
			headers: () => ["Categoría", "Base jurídica"],
		},
		thirdParties: {
			heading: () => "Servicios de terceros",
			empty: () =>
				"No compartimos sus datos personales con terceros, salvo cuando la ley lo exija.",
			intro: () => "Compartimos datos con los siguientes servicios de terceros:",
			headers: () => ["Servicio", "Finalidad", "Política de privacidad"],
			linkText: () => "Consultar",
		},
		userRights: {
			heading: () => "Sus derechos",
			intro: () => "Dispone de los siguientes derechos en relación con sus datos personales:",
			labels: {
				access: () => "Derecho de acceso a sus datos personales",
				rectification: () => "Derecho de rectificación de datos inexactos",
				erasure: () => "Derecho de supresión de sus datos",
				portability: () => "Derecho a la portabilidad de sus datos",
				restriction: () => "Derecho a la limitación del tratamiento",
				objection: () => "Derecho de oposición al tratamiento",
				opt_out_sale: () => "Derecho a oponerse a la venta de su información personal",
				non_discrimination: () =>
					"Derecho a un trato no discriminatorio por el ejercicio de sus derechos",
			},
		},
		dpo: {
			present: {
				trailing: () =>
					". Puede dirigirse directamente a nuestro Delegado de Protección de Datos para cualquier consulta sobre la presente política o sobre cómo tratamos sus datos personales.",
			},
			absentRequiredFalse: ({ reason }) =>
				`No hemos designado un Delegado de Protección de Datos. Nuestras actividades de tratamiento no alcanzan los umbrales del artículo 37, apartado 1, del RGPD que exigirían su designación.${reason}`,
			absentFallback: () =>
				"No hemos designado un Delegado de Protección de Datos. Nuestras actividades de tratamiento no alcanzan los umbrales del artículo 37, apartado 1, del RGPD que exigirían su designación. Para cualquier consulta sobre la presente política o sobre cómo tratamos sus datos personales, utilice los datos de contacto indicados anteriormente.",
		},
		euRepresentative: {
			body: ({ address, email }) => ({
				prefix:
					"Nuestro representante en la Unión Europea a los efectos del artículo 27 del RGPD es ",
				suffix: `, ${address}, ${email}.`,
			}),
		},
		gdprSupplement: {
			heading: () => "Información complementaria del RGPD",
			scope: () =>
				"Esta sección se aplica a las personas situadas en el Espacio Económico Europeo (EEE) en virtud del Reglamento General de Protección de Datos (RGPD).",
			dataControllerLabel: () => "Responsable del tratamiento: ",
			complaintBody: {
				prefix: () =>
					"Tiene derecho a presentar una reclamación ante la autoridad de control de protección de datos de su país de residencia, lugar de trabajo o del lugar de la presunta infracción. La lista de autoridades de control del EEE está disponible en ",
				linkText: () => "edpb.europa.eu/about-edpb/about-edpb/members_en",
				suffix: () => ".",
			},
			transferBody: {
				prefix: () =>
					"Cuando transferimos sus datos personales fuera del EEE, nos basamos en una o varias de las garantías previstas en el capítulo V del RGPD: (a) transferencias a países sobre los que la Comisión Europea haya adoptado una decisión de adecuación (la lista actualizada se publica en ",
				adequacyLinkText: () => "commission.europa.eu/.../adequacy-decisions_en",
				middle: () =>
					"); (b) Cláusulas Contractuales Tipo (CCT) adoptadas por la Comisión Europea con arreglo al artículo 46, apartado 2, letra c); y (c) Normas Corporativas Vinculantes (NCV) aprobadas en virtud del artículo 47, cuando proceda. Puede solicitar más información sobre las garantías específicas aplicadas a una transferencia concreta poniéndose en contacto con nosotros en ",
				email: ({ contactEmail }) => `${contactEmail}.`,
			},
		},
		ukGdprSupplement: {
			heading: () => "Derechos de privacidad en el Reino Unido (UK-GDPR)",
			scope: () =>
				"Esta sección se aplica a las personas situadas en el Reino Unido en virtud del UK General Data Protection Regulation (UK-GDPR), adaptado por la Data Protection Act 2018.",
			dataControllerLabel: () => "Responsable del tratamiento: ",
			ico: {
				prefix: () => "La autoridad de control de protección de datos en el Reino Unido es la ",
				label: () => "Information Commissioner's Office (ICO)",
				suffix: () =>
					". Si considera que no hemos tratado sus datos conforme al derecho británico de protección de datos, tiene derecho a presentar una reclamación ante la ICO en ",
				linkText: () => "ico.org.uk/make-a-complaint",
				suffix2: () => ".",
			},
			transferBody: () =>
				"Cuando transferimos sus datos personales fuera del Reino Unido, garantizamos la existencia de salvaguardias adecuadas conforme al UK-GDPR, incluidos el UK International Data Transfer Agreement o el UK Addendum a las Cláusulas Contractuales Tipo de la UE, cuando proceda.",
		},
		ccpaSupplement: {
			heading: () => "Derechos de privacidad en California (CCPA)",
			intro: () => "Si reside en California, dispone de los siguientes derechos adicionales:",
			rights: {
				know: () =>
					"Derecho a saber — Puede solicitar la divulgación de la información personal que recopilamos, utilizamos y compartimos sobre usted.",
				delete: () =>
					"Derecho de supresión — Puede solicitar la supresión de la información personal que hayamos recopilado sobre usted.",
				optOut: () =>
					"Derecho de oposición a la venta — Puede oponerse a la venta de su información personal.",
				nonDiscrimination: () =>
					"Derecho a no ser discriminado — No le discriminaremos por ejercer sus derechos CCPA.",
			},
			submitting: {
				label: () => "Presentación de solicitudes.",
				body: () =>
					" Para ejercer cualquiera de estos derechos, póngase en contacto con nosotros mediante uno de los métodos indicados a continuación. Responderemos dentro de los plazos exigidos por la sección 1798.130 del CCPA.",
			},
		},
		contact: {
			heading: () => "Contacto",
			intro: () => "Póngase en contacto con nosotros:",
		},
		provisionBasisLabels: {
			statutory: () => "Obligatorio por ley",
			contractual: () => "Obligatorio en virtud del contrato",
			"contract-prerequisite": () => "Condición previa para la celebración de un contrato",
			voluntary: () => "Voluntario",
		},
		cookieCategoryLabels: {
			essential: () => "Cookies esenciales — necesarias para el funcionamiento del servicio",
			analytics: () => "Cookies analíticas — nos ayudan a entender cómo se utiliza el servicio",
			functional: () => "Cookies funcionales — recuerdan sus preferencias y ajustes",
			marketing: () => "Cookies de marketing — utilizadas para mostrar publicidad relevante",
		},
		cookieCategoryFallback: ({ key }) => `Cookies de ${key}`,
	},
	cookie: {
		introduction: {
			heading: () => "Política de cookies",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`La presente Política de Cookies explica cómo ${companyName} («nosotros», «nos» o «nuestro») utiliza cookies y tecnologías de seguimiento similares en nuestros servicios. Fecha de entrada en vigor: ${effectiveDate}.${versionSuffix}`,
		},
		whatAreCookies: {
			heading: () => "¿Qué son las cookies?",
			body1: () =>
				"Las cookies son pequeños archivos de texto que se colocan en su dispositivo desde los sitios web que visita. Se utilizan ampliamente para que los sitios funcionen de forma más eficiente y para proporcionar información a sus propietarios.",
			body2: () =>
				"Las cookies pueden ser «de sesión» (se eliminan al cerrar el navegador) o «persistentes» (permanecen en su dispositivo hasta que caducan o las elimina).",
		},
		types: {
			heading: () => "Tipos de cookies que utilizamos",
			empty: () => "Actualmente no utilizamos cookies.",
			headers: () => ["Tipo", "Descripción"],
			labels: {
				essential: {
					label: () => "Cookies esenciales",
					description: () =>
						"Necesarias para el funcionamiento básico de nuestros servicios. No pueden desactivarse.",
				},
				analytics: {
					label: () => "Cookies analíticas",
					description: () =>
						"Nos ayudan a entender cómo interactúan los visitantes con nuestros servicios para poder mejorarlos.",
				},
				functional: {
					label: () => "Cookies funcionales",
					description: () =>
						"Permiten una funcionalidad mejorada y la personalización, como recordar sus preferencias.",
				},
				marketing: {
					label: () => "Cookies de marketing",
					description: () =>
						"Utilizadas para mostrarle anuncios más relevantes para usted y sus intereses.",
				},
			},
			fallback: ({ key }) => ({
				label: `Cookies de ${key}`,
				description: "",
			}),
		},
		trackingTechnologies: {
			heading: () => "Otras tecnologías de seguimiento",
			intro: () => "Además de cookies, podemos utilizar las siguientes tecnologías de seguimiento:",
		},
		thirdParties: {
			heading: () => "Cookies de terceros",
			intro: () =>
				"Los siguientes terceros pueden establecer cookies a través de nuestros servicios:",
			headers: () => ["Servicio", "Finalidad", "Política de privacidad"],
			linkText: () => "Consultar",
		},
		consent: {
			heading: () => "Su consentimiento",
			banner: () =>
				"Mostramos un banner de consentimiento de cookies en su primera visita a nuestros servicios.",
			panel: () =>
				"Puede gestionar sus preferencias de cookies en cualquier momento a través de nuestro panel de preferencias.",
			withdraw: () =>
				"Puede retirar su consentimiento en cualquier momento; no obstante, ello no afectará a la licitud del tratamiento basado en el consentimiento previo a la retirada.",
		},
		managing: {
			heading: () => "Gestión de cookies",
			intro: () =>
				"La mayoría de los navegadores web le permiten controlar las cookies a través de sus ajustes. Puede:",
			items: {
				delete: () => "Eliminar las cookies ya almacenadas en su dispositivo",
				block: () => "Bloquear el establecimiento de cookies en su dispositivo",
				notify: () =>
					"Configurar su navegador para que le notifique cuando se establezca una cookie",
			},
			footer: () =>
				"Tenga en cuenta que restringir las cookies puede afectar a la funcionalidad de nuestros servicios. Consulte la documentación de ayuda de su navegador para obtener instrucciones sobre la gestión de cookies.",
		},
		jurisdictionEuUk: {
			heading: {
				euAndUk: () => "Usuarios de la UE y del Reino Unido (RGPD / UK-GDPR)",
				eu: () => "Usuarios de la Unión Europea (RGPD)",
				uk: () => "Usuarios del Reino Unido (UK-GDPR)",
			},
			body: ({ region }) =>
				`Si se encuentra en ${region}, nos basamos en su consentimiento como base jurídica para la instalación de cookies no esenciales. Tiene derecho a retirar su consentimiento en cualquier momento.`,
			region: {
				euAndUk: () => "el Espacio Económico Europeo o el Reino Unido",
				eu: () => "el Espacio Económico Europeo",
				uk: () => "el Reino Unido",
			},
			essentialBody: () =>
				"Las cookies esenciales se instalan sobre la base de nuestro interés legítimo en ofrecerle un servicio operativo.",
		},
		contact: {
			heading: () => "Contacto",
			intro: () =>
				"Si tiene preguntas sobre esta Política de Cookies, póngase en contacto con nosotros:",
		},
	},
};
