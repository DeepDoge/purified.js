import { fragment, ref, tags } from "purify-js";

const { div, input, label } = tags;

export function PickPill() {
	const picked = ref<"red" | "blue">("red");

	return fragment(
		div().children("Picked: ", picked),

		input()
			.id("blue-pill")
			.type("radio")
			.checked(
				picked.derive(
					(picked) => picked === "blue",
				),
			)
			.onchange(() => (picked.val = "blue")),
		label({ for: "blue-pill" }).children("Blue pill"),

		input()
			.id("red-pill")
			.type("radio")
			.checked(
				picked.derive((picked) => picked === "red"),
			)
			.onchange(() => (picked.val = "red")),
		label({ for: "red-pill" }).children("Red pill"),
	);
}
