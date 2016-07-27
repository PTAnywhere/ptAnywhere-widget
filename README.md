# ptAnywhere-widget

This project contains an Angular JS application to create a GUI for PTAnywhere.

## Usage

This project uses Bower.
Simply add the following dependency:

```js
{
  ...
  "dependencies": {
    ...
    "pt-anywhere": "git://github.com/PTAnywhere/ptAnywhere-widget.git",
    ...
  }
  ...
}
```

## Configuration

Simply set one of these variables as constants:
```js
angular.module('ptAnywhere.locale').constant('use', 'locale_en');
angular.module('ptAnywhere.api').constant('url', 'http://ptanywhere.kmi.open.ac.uk/api/v1');

angular.module('ptAnywhere.widget.configuration')
        .constant('imagesUrl', 'http://ptanywhere.kmi.open.ac.uk/widget/imgs')
        .constant('fileToOpen', 'http://ptanywhere.kmi.open.ac.uk/myTopology.pkt');
```

## Setting up your own language

First, load the locale file:

```html
<script src="path/ptanywhere_es.js"></script>
```

Then, make sure that you set the locale that you added.

```js
angular.module('ptAnywhere.locale').constant('use', 'locale_es');
```

To create your locale file, I recommend you to copy and edit _locale/en.js_.

## Developers

### Install

Install via npm:

    $ npm install

Install via bower:

    $ bower install  # Or bower update

### Run tests

Use one of the following alternatives:

    $ npm test
    $ gulp test

### Bump version

__Version-type__ can be "major", "minor", "patch" or "prerelease".
 
    $ npm run release [version-type]

(Do not forget to tag the version after committing it)

    $ git tag "v0.0.1"
    $ git push origin --tags