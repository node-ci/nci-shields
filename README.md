# nci-shields
[![Build Status](https://travis-ci.org/fleg/nci-shields.svg?branch=master)](https://travis-ci.org/fleg/nci-shields)

Pretty svg status shields plugin for [nci](https://github.com/node-ci/nci)

## Dependencies

[nci-express](https://github.com/fleg/nci-express)

## Installation

```sh
npm install nci-shields
```

## Usage

Add this plugin to the `plugins` section at server config
```yml
plugins:
    - nci-shields
```
after that you can get status shields:

* `http://localhost:3000/shields/:projectName.svg` for project
* `http://localhost:3000/shields/builds/:id.svg` for build
* `http://localhost:3000/shields/:projectName/revs/:rev.svg` for project revision
(any scm revision, tag, branch that was selected as target for the build)

## Legal

Shields generated with [shields.io](http://shields.io/)

## License

[The MIT License](https://raw.githubusercontent.com/fleg/nci-shields/master/LICENSE)
