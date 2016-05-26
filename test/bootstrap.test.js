/* eslint-disable quote-props */
  // Quoting all properties in a mock file tree looks much more elegant
  // than quoting only some.

const tape = require('tape-catch');
const mockFs = require('mock-fs');
const fs = require('fs');
const asObject = require('as/object');
const stripAnsi = require('strip-ansi');

const bootstrap = require('../bootstrap');

const test = Object.assign(
  (message, callback) => tape(`bootstrap: ${message}`, callback),
  tape
);
const naked = error => stripAnsi(String(error));
const projectPath = '/my/project';
const packages = [
  'my-package',
  'another-package',
];

test('Makes global dependencies available to packages', (is) => {
  mockFs({ [projectPath]: {
    'node_modules': {},
    'packages': asObject(packages.map(name => ({
      key: name,
      value: {},
    }))),
  } });

  bootstrap({ path: projectPath });

  const packageDepsDirs = packages.map((name) => (
    `${projectPath}/packages/${name}/node_modules`
  ));
  try {
    const links = packageDepsDirs.map(dir => fs.lstatSync(dir));
    is.ok(
      links.every(link => link.isSymbolicLink()),
      'creates symlinks at every `packages/*/node_modules`'
    );

    const linkPaths = packageDepsDirs.map(dir => fs.readlinkSync(dir));
    is.ok(
      linkPaths.every(path => path === `${projectPath}/node_modules`),
      'each symlink points at the root node_modules'
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    is.fail(
      'creates files at `packages/*/node_modules`'
    );
  }

  mockFs.restore();
  is.end();
});

test('Fails gracefully when there is no `packages` dir', (is) => {
  is.plan(1);
  mockFs({ [projectPath]: {} });

  try {
    bootstrap({ path: projectPath });
  } catch (error) {
    is.ok(
      /a subdirectory packages/i.test(naked(error)),
      'throws a helpful message'
    );
  }

  mockFs.restore();
  is.end();
});

test.skip('makes packages available to each other');