import { useVirtualizer } from "@tanstack/react-virtual";
import {
	type KeyboardEvent,
	type ReactNode,
	type TouchEvent,
	useEffect,
	useRef,
	useState,
	type WheelEvent,
} from "react";
import { cn } from "@/lib/utils";
import { TerminalLine } from "./terminal-line";
import { isNearBottom, type LogLine, scrolledUp } from "./utils";

const VERTICAL_PADDING = 16;
// Above this, render only visible rows; below it, keep every row in the DOM so Ctrl+F works.
const VIRTUALIZE_THRESHOLD = 5000;

interface Props {
	logs: LogLine[];
	className?: string;
	noTimestamp?: boolean;
	searchTerm?: string;
	children?: ReactNode;
}

export const VirtualLogList = ({
	logs,
	className,
	noTimestamp,
	searchTerm,
	children,
}: Props) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const lastScrollTop = useRef(0);
	const lastScrollHeight = useRef(0);
	const awaitingLeave = useRef(false);
	const touchStartY = useRef<number | null>(null);
	const following = useRef(true);
	const [autoScroll, setAutoScroll] = useState(true);
	const setFollowing = (value: boolean) => {
		following.current = value;
		setAutoScroll(value);
	};
	const virtualize = logs.length > VIRTUALIZE_THRESHOLD;

	const virtualizer = useVirtualizer({
		count: logs.length,
		enabled: virtualize,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => 20,
		overscan: 20,
		paddingStart: VERTICAL_PADDING,
		paddingEnd: VERTICAL_PADDING,
		// Without this, align "end" stops short of paddingEnd and the bottom check below fails.
		scrollPaddingEnd: VERTICAL_PADDING,
	});

	const stopFollowing = () => {
		if (!scrollRef.current || scrollRef.current.scrollTop <= 0) {
			// At the top, input can't produce the scroll event that would clear the latch.
			return;
		}
		virtualizer.cancelScroll();
		awaitingLeave.current = true;
		setFollowing(false);
	};

	const handleScroll = () => {
		if (!scrollRef.current) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
		const previous = {
			scrollTop: lastScrollTop.current,
			scrollHeight: lastScrollHeight.current,
		};
		lastScrollTop.current = scrollTop;
		lastScrollHeight.current = scrollHeight;
		const nearBottom = isNearBottom({ scrollTop, scrollHeight, clientHeight });
		if (awaitingLeave.current) {
			if (!nearBottom) awaitingLeave.current = false;
		} else if (nearBottom) {
			setFollowing(true);
		} else if (
			// A shrinking scrollHeight reflects the virtualize switch or a reset, not user intent.
			scrolledUp({ scrollTop, scrollHeight }, previous)
		) {
			setFollowing(false);
		}
	};

	const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
		if (event.deltaY < 0) {
			stopFollowing();
			return;
		}

		const element = scrollRef.current;
		if (
			event.deltaY > 0 &&
			element &&
			element.scrollHeight - element.scrollTop - element.clientHeight <=
				event.deltaY + 10
		) {
			awaitingLeave.current = false;
			setFollowing(true);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (["ArrowUp", "PageUp", "Home"].includes(event.key)) {
			stopFollowing();
		} else if (event.key === "End") {
			awaitingLeave.current = false;
			setFollowing(true);
		}
	};

	const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
		touchStartY.current = event.touches[0]?.clientY ?? null;
	};

	const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
		const startY = touchStartY.current;
		const clientY = event.touches[0]?.clientY;
		if (startY !== null && clientY !== undefined && clientY > startY) {
			stopFollowing();
		}
	};

	useEffect(() => {
		// The ref, not state: input can land between a commit and this effect.
		if (!following.current || logs.length === 0) return;
		if (virtualize) {
			virtualizer.scrollToIndex(logs.length - 1, { align: "end" });
		} else if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [logs, autoScroll, virtualize]);

	return (
		<div
			// biome-ignore lint/a11y/noNoninteractiveTabindex: The log viewport must receive keyboard scroll input.
			tabIndex={0}
			ref={scrollRef}
			onScroll={handleScroll}
			onWheel={handleWheel}
			onKeyDown={handleKeyDown}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			className={cn(
				"overflow-y-auto border rounded custom-logs-scrollbar",
				virtualize ? "px-4" : "p-4",
				className,
			)}
		>
			{virtualize ? (
				<div
					className="relative w-full"
					style={{ height: virtualizer.getTotalSize() }}
				>
					{virtualizer.getVirtualItems().map((item) => (
						<div
							key={item.key}
							data-index={item.index}
							ref={virtualizer.measureElement}
							className="absolute left-0 top-0 w-full"
							style={{ transform: `translateY(${item.start}px)` }}
						>
							<TerminalLine
								log={logs[item.index]!}
								noTimestamp={noTimestamp}
								searchTerm={searchTerm}
							/>
						</div>
					))}
				</div>
			) : logs.length > 0 ? (
				logs.map((log, index) => (
					<TerminalLine
						key={`${log.rawTimestamp ?? ""}-${index}`}
						log={log}
						noTimestamp={noTimestamp}
						searchTerm={searchTerm}
					/>
				))
			) : (
				children
			)}
		</div>
	);
};
