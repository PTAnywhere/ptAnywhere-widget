# ptAnywhere-widget

This project contains an Angular JS application to create a GUI for PTAnywhere.


## Build it

 1. Install node and npm
 1. ``npm install``
 1. ``bower install`` (or update if it has already been installed)
 1. ``gulp``


## Configuration

Simply set one of these variables as constants:
```javascript
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

```javascript
angular.module('ptAnywhere.locale').constant('use', 'locale_es');
```

To create your locale file, I recommend you to copy and edit _locale/en.js_.

## Run tests

Use one of the following alternatives:

 * ``npm test``
 * ``gulp test``