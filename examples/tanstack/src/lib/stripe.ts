import { sharing, thirdParty } from "@openpolicy/sdk";

thirdParty("Stripe", "Payment processing", "https://stripe.com/privacy");

// Mock Stripe calls
export async function reportCharge(email: string, amountCents: number) {
	return fetch("https://api.stripe.com/v1/charges", {
		method: "POST",
		body: JSON.stringify(sharing("Account Information", "Stripe", { email, amountCents })),
	});
}
