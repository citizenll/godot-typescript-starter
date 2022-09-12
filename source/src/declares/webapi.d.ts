//@ts-ignore
declare module globalThis {
	const window: typeof globalThis;
	const WebSocket: any
	const self: typeof undefined
	function cancelAnimationFrame(handle: number): void;
	function requestAnimationFrame(callback: (now: number)=>void): number;
}

declare module WebAPI {
	function tick();
	function finalize();
	function getHighResTimeStamp(): number;
}