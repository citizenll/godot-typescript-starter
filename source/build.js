import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import colors from 'colors';
import filesize from 'filesize';
import glob from 'fast-glob';
import readline from 'readline'

const scripts = JSON.parse(fs.readFileSync('./build.config.json', 'utf-8'))
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const production = process.argv.length == 3 && process.argv[2] == '--release';

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
	patterns = scripts.compile_pattern || [];
	scripts.compile_only = [];
	for (const p of patterns) {
		const inputs = glob.sync(p).filter(file => !file.endsWith('.d.ts'));
		scripts.compile_only = scripts.compile_only.concat(inputs);
	}
	scripts.compile_only = Array.from(new Set(scripts.compile_only));
}

function clean() {
	fs.rmSync(options.outRoot, { recursive: true });
}

function watch() {
	update_entries();
	let compileCount = 0, startTime = Date.now();
	let compiled = false, totalCount = scripts.compile_only.length;
	chokidar.watch(options.sourceRoot).on('all', (event, input) => {
		let unlink = event == 'unlink' || event == 'unlinkDir';
		if (unlink) {
			let isDir = event == 'unlinkDir'
			let target = isDir ? normalize_path(path.join(options.outRoot, input)) : get_build_target(input);
			if (!target) return
			target = target.replace('src/', '')
			if (!isDir) {
				let parse = path.parse(target)
				let prefix = target.replace(parse.base, '')
				['.jsx', '.jsx.map'].map(s => `${prefix}${parse.name}${s}`).forEach((file) => {
					fs.rmSync(file, { recursive: true, force: true });
					console.log(colors.grey("unlink"), colors.grey(`${file}`));
				})
			} else {
				if (!fs.existsSync(target)) return
				fs.rmSync(target, { recursive: true, force: true });
				console.log(colors.grey("unlink"), colors.grey(`${target}`));
			}
			update_entries();
			return
		}
		if (!fs.existsSync(input) || !fs.statSync(input).isFile()) return;
		input = normalize_path(input);
		let output = null;
		switch (event) {
			case 'add':
				update_entries();
				output = get_build_target(input);
				break
			case 'change':
				output = get_build_target(input);
				break;
		}
		if (output) {
			build_entry(input, output, compiled);
			compileCount++;
			if (!compiled && compileCount >= totalCount) {
				clearScreen();
				compiled = true;
				console.log(colors.green(`Compiled finished `), colors.grey(`[${Date.now() - startTime}ms]`));
			}
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
	let normalized = normalize_path(input)
	if (scripts.bundles.indexOf(normalized) == -1 && scripts.compile_only.indexOf(normalized) == -1) return;

	const target = path.join(options.outRoot, input).replace('.ts', '.js');
	return normalize_path(target);
}

function entry_is_bundle(input) {
	return scripts.bundles.indexOf(input) != -1;
}
async function build_entry(input, output, update = false) {
	const start = Date.now();
	const outfile = output.replace('src/', '')
	try {
		esbuild.buildSync({
			minify: production,
			entryPoints: [input],
			outfile,//remove src dir
			target: 'esnext',
			format: 'esm',
			tsconfig: options.tsconfig,
			sourcemap: true,
			bundle: entry_is_bundle(input)
		});
		let time = new Date().toLocaleTimeString();
		console.log(colors.grey(time), colors.green(`[${Date.now() - start}ms]`), colors.grey(`${update ? 'Update' : 'Build'} ${input}`), colors.grey(filesize(fs.statSync(outfile).size)));
	} catch (error) {
	}
}

function clearScreen() {
	readline.cursorTo(process.stdout, 0, 0)
	readline.clearScreenDown(process.stdout)
}
check_output_dir()
clean(); watch();
