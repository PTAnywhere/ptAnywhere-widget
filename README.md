# ptAnywhere-widget

This project contains an Angular JS application to create a GUI for PTAnywhere.


## Build it

 1. Install node and npm
 1. ``npm install``
 1. ``bower install`` (or update if it has already been installed)
 1. ``gulp``


## Configuration

Simply set one of these variables as constants:
 * baseUrl
 * imagesUrl
 * apiUrl
 * fileToOpen
 * useLocale

```javascript
angular.module('ptAnywhere')
        .constant('baseUrl', '${base}')
        .constant('imagesUrl', '${base}/img')
        .constant('apiUrl', '${apiUrl}')
        .constant('fileToOpen', '${fileToOpen}')
        .constant('useLocale', 'locale_es');
```

## Setting up your own language

First, load the locale file:

```html
<script src="path/ptanywhere_es.js"></script>
```

Then, make sure that you set the locale that you added.

```javascript
angular.module('ptAnywhere').constant('useLocale', 'locale_es');
```

To create your locale file, I recommend you to copy and edit _locale/en.js_.