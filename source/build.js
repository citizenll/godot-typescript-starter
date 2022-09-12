const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const colors = require('colors/safe');
const filesize = require('filesize');
const { glob } = require('glob');
const scripts = require('./build.config.json');

const options = {
	sourceRoot: 'src',
	outRoot: path.resolve(__dirname, scripts.output),
	tsconfig: 'tsconfig.json',
}

function normalize_path(path) {
	return path.replace(/\\/g, '/');
}

function update_entries() {
	let patterns = scripts.bundles || [];
	scripts.bundles = [];
	for (const p of patterns) {
		const inputs = glob.sync(p);
		scripts.bundles = scripts.bundles.concat(inputs);
	}
	patterns = scripts.compile_only || [];
	scripts.compile_only = [];
	for (const p of patterns) {
		const inputs = glob.sync(p);
		scripts.compile_only = scripts.compile_only.concat(inputs);
	}
}

function clean() {
	fs.rmSync(options.outRoot, { recursive: true });
}

function watch() {
	update_entries();
	chokidar.watch(options.sourceRoot).on('all', (event, input) => {
		if (!fs.existsSync(input) || !fs.statSync(input).isFile()) return;
		input = normalize_path(input);
		let output = null;
		switch (event) {
			case 'add':
				update_entries();
				output = get_build_target(input);
			case 'change':
				output = get_build_target(input);
				break;
			case 'unlink': {
				const last = get_build_target(input);
				update_entries();
				output = get_build_target(input);
				if (!output && last) {
					console.log('移除', last);
				}
			} break;
		}
		if (output) {
			build_entry(input, output);
		}
	});
}

function check_output_dir() {
	if (!fs.existsSync(options.outRoot)) {
		fs.mkdirSync(options.outRoot)
	}
}
function get_build_target(input) {
	const matches = input.match(/(\.d)?(\.[t|j]sx?)/);
	if (!matches) return;
	if (matches[0] === '.d.ts') return;
	if (scripts.bundles.indexOf(input) == -1 && scripts.compile_only.indexOf(input) == -1) return;
	const target = path.join(options.outRoot, input).replace('.ts', '.js');
	return normalize_path(target);
}

function entry_is_bundle(input) {
	return scripts.bundles.indexOf(input) != -1;
}
const REPLACE_DIR = path.resolve(__dirname, '../').replace(/\\/g, "/");
async function build_entry(input, output) {
	const start = Date.now();
	const outfile = output.replace('src/', '')
	try {
		esbuild.buildSync({
			entryPoints: [input],
			outfile,//remove src dir
			target: 'esnext',
			format: 'esm',
			tsconfig: options.tsconfig,
			sourcemap: true,
			bundle: entry_is_bundle(input)
		});
		// console.log(`[${Date.now() - start}ms]`, colors.green(`Build ${input} ==> ${output.replace(REPLACE_DIR, '')}`), colors.grey(filesize(fs.statSync(outfile).size)));
	} catch (error) {
	}
}
check_output_dir()
clean(); watch();
