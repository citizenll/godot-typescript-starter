import event from './event';
import timer from './timer';
import performance from './performance';
import xhr from './xhr/xhr.godot';
import misc from './misc.godot';
import storage from './storage.godot';
import websocket from './websocket';

import { initialize, finalize } from "./index.common";

initialize([
	event,
	timer,
	performance,
	storage,
	websocket,
	misc, xhr
]);

export default class GodotWebAPISingleton extends godot.Node {
	_ready(): void {
		// let old = localStorage.getItem("version")
		// console.log("get old", old);
		// if (!old) {
		// 	localStorage.setItem("version", "" + 1.0)
		// }
	}

	_exit_tree() {
		finalize();
	}
}