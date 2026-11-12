import { expect, test } from "vitest";
import { nextAutoScroll } from "@/components/dashboard/docker/logs/utils";

test("enables auto-scroll at the bottom", () => {
	expect(
		nextAutoScroll(false, {
			scrollTop: 400,
			scrollHeight: 1000,
			clientHeight: 600,
			previousScrollTop: 0,
		}),
	).toBe(true);
});

test("keeps auto-scroll enabled for a stale event after content growth", () => {
	expect(
		nextAutoScroll(true, {
			scrollTop: 400,
			scrollHeight: 1400,
			clientHeight: 600,
			previousScrollTop: 400,
		}),
	).toBe(true);
});

test("keeps auto-scroll enabled while the scroll position increases", () => {
	expect(
		nextAutoScroll(true, {
			scrollTop: 500,
			scrollHeight: 1400,
			clientHeight: 600,
			previousScrollTop: 400,
		}),
	).toBe(true);
});

test("disables auto-scroll when the scroll position decreases", () => {
	expect(
		nextAutoScroll(true, {
			scrollTop: 300,
			scrollHeight: 1400,
			clientHeight: 600,
			previousScrollTop: 400,
		}),
	).toBe(false);
});

test("keeps auto-scroll disabled while scrolling down toward the bottom", () => {
	expect(
		nextAutoScroll(false, {
			scrollTop: 500,
			scrollHeight: 1400,
			clientHeight: 600,
			previousScrollTop: 400,
		}),
	).toBe(false);
});

test("enables auto-scroll within ten pixels of the bottom", () => {
	expect(
		nextAutoScroll(false, {
			scrollTop: 391,
			scrollHeight: 1000,
			clientHeight: 600,
			previousScrollTop: 400,
		}),
	).toBe(true);
});
