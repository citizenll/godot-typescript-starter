interface WebAPIModule {
	tick?: (now: number) => void;
	initialize?: () => void;
	uninitialize?: () => void;
	exports?: Record<string, any>
}

let registered_modules: WebAPIModule[] = [];

export function initialize(modules: WebAPIModule[]) {
	Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true });
	for (const m of modules) {
		if (m.initialize) m.initialize();
		if (!m.exports) continue;
		for (const key in m.exports) {
			Object.defineProperty(window, key, { value: m.exports[key], configurable: true, enumerable: true, writable: true });
		}
	}
	registered_modules = modules;
	console.log('global modules:', Object.keys(window))
}

export function finalize() {
	for (const m of registered_modules) {
		if (m.uninitialize) m.uninitialize();
	}
}

export function tick() {
	for (const m of registered_modules) {
		if (m.tick && WebAPI.getHighResTimeStamp) {
			m.tick(WebAPI.getHighResTimeStamp());
		}
	}
}
Object.defineProperty(globalThis, 'self', { value: undefined, configurable: true, enumerable: true });
Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true, enumerable: true });
Object.defineProperty(globalThis, "WebAPI", {
	value: {
		tick,
		finalize,
		getHighResTimeStamp: Date.now,
	}
});
