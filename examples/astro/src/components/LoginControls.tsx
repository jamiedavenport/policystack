import { useState } from "react";

export default function LoginControls() {
	const [signedIn, setSignedIn] = useState(false);

	return (
		<button type="button" onClick={() => setSignedIn((value) => !value)}>
			{signedIn ? "Signed in" : "Sign in"}
		</button>
	);
}
