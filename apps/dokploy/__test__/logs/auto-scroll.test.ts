import { expect, test } from "vitest";
import {
	isNearBottom,
	scrolledUp,
} from "@/components/dashboard/docker/logs/utils";

test("detects the bottom", () => {
	expect(
		isNearBottom({ scrollTop: 500, scrollHeight: 1000, clientHeight: 500 }),
	).toBe(true);
});

test("detects positions within ten pixels of the bottom", () => {
	expect(
		isNearBottom({ scrollTop: 491, scrollHeight: 1000, clientHeight: 500 }),
	).toBe(true);
});

test("rejects positions beyond ten pixels of the bottom", () => {
	expect(
		isNearBottom({ scrollTop: 489, scrollHeight: 1000, clientHeight: 500 }),
	).toBe(false);
});

test("rejects a stale position after content grows", () => {
	expect(
		isNearBottom({ scrollTop: 500, scrollHeight: 1500, clientHeight: 500 }),
	).toBe(false);
});

test("detects upward movement at the same content height", () => {
	expect(
		scrolledUp(
			{ scrollTop: 300, scrollHeight: 1000 },
			{ scrollTop: 400, scrollHeight: 1000 },
		),
	).toBe(true);
});

test("detects upward movement while content grows", () => {
	expect(
		scrolledUp(
			{ scrollTop: 300, scrollHeight: 1100 },
			{ scrollTop: 400, scrollHeight: 1000 },
		),
	).toBe(true);
});

test("ignores upward movement while content shrinks", () => {
	expect(
		scrolledUp(
			{ scrollTop: 101274, scrollHeight: 102568 },
			{ scrollTop: 165498, scrollHeight: 166216 },
		),
	).toBe(false);
});

test("ignores an unchanged scroll position", () => {
	expect(
		scrolledUp(
			{ scrollTop: 400, scrollHeight: 1000 },
			{ scrollTop: 400, scrollHeight: 1000 },
		),
	).toBe(false);
});

test("ignores downward movement", () => {
	expect(
		scrolledUp(
			{ scrollTop: 500, scrollHeight: 1000 },
			{ scrollTop: 400, scrollHeight: 1000 },
		),
	).toBe(false);
});
