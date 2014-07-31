# dom interceptor [![Build Status](https://travis-ci.org/angular/dom-interceptor.svg?branch=master)](https://travis-ci.org/angular/dom-interceptor) [![Code Climate](https://codeclimate.com/github/angular/dom-interceptor/badges/gpa.svg)](https://codeclimate.com/github/angular/dom-interceptor)

  - [Background](#background)
  - [API](#api)

See the [NPM module](https://www.npmjs.org/package/dom-interceptor).

##<a name="background"></a> Background

This library is designed for use with [AngularHintDom](https://github.com/angular/angular-hint-dom), a runtime hinting tool that depends on detecting manipulation of the `DOM` in AngularJS applications to warn developers about best practices. The goal of this
library is to explore different ways of 'intercepting' or patching `DOM` APIs in order to provide this hinting.

To provide this service, the library creates a main `manipulationListener` that is used by AngularHintDom. This listener is the `interceptor` that listens for use of certain DOM APIs.

Previously this library contained other methods for patching individual element properties and using proxies that are not used by the current `manipulationListener`. These methods were developed as part of an exploration of how to effectively listen for DOM manipulation.

Especially, the library aims to detect the use of methods such as:
  - retrieval methods such as `document.getElementById()`
  - `element.remove`
  - `element.insertBefore`
  - `element.appendChild`

Originally, other manipulative methods like `element.innerHTML` and `element.parentElement` were also identified as goal methods for the overall `manipulationListener` to detect. However, detecting these DOM APIs in certain browsers requires patching of individual elements (Firefox attaches properties like `.innerHTML` to `Element.prototype` so patching get/set properties of the prototypes would be sufficient in that browser). In an earlier iteration, methods `patchExistingElements()` and `patchElementProperties()` were implemented to fill this need. However, for the best effort goal of detecting DOM manipulation, patching individual elements was deemed too heavy-handed, dangerous, and costly in terms of performance. For example, some browsers such
as Safari do not allow the patching of element properties. Moreover, these patched elements do not have the same behavior as unpatched elements.

A better solution than patchExistingElements() or patchElementProperties() for providing this interception on
the level of individual elements is to use proxies. In one iteration, the method `patchAccess()` used the [harmony-reflect library](https://github.com/tvcutsem/harmony-reflect) to provide this service.

However, proxies are still considered experimental javascript. In Chrome for instance this javascript feature can only be enabled by setting the flag `chrome://flags/#enable-javascript-harmony`. Hence, these features are not used be the current `manipulationListener`. Instead, the manipulationListener provides a 'best-effort' detection of the majority of DOM API calls
by patching functions on the prototypes of `Element`, `Node`, and `Document`.

##<a name="api"></a> API

####[addManipulationListener](https://github.com/angular/dom-interceptor/blob/master/dom-interceptor.js#L7)
----------------
#####Use as: addManipulationListener(newListener)

Add a `listener` - a function - that will be fired when use of DOM APIs is detected.

####Example

```javascript
var domInterceptor = require('dom-interceptor');
var listenerFunction = function(message) {
  console.log(message);
};
//Will console.log the given message when manipulation is detected
domInterceptor.addManipulationListener(listenerFunction);
```

####Params
Param | Type | Description
---   | ---  | ---
newListener | function | A function that will be triggered when use of DOM APIs is detected


####[enableLineNumbers](https://github.com/angular/dom-interceptor/blob/master/dom-interceptor.js#L38)
----------------
#####Use as: enableLineNumbers(stackTraceLocation)

Enable the listener message passed to the given listener to include the line number of the call that
manipulated the DOM. A `stackTraceLocation` is required in order to pick a line from the stack
trace that is not within the domInterceptor code.

####Example

```javascript
var domInterceptor = require('dom-interceptor');
domInterceptor.enableLineNumbers(3);
```

####Params
Param | Type | Description
---   | ---  | ---
stackTraceLocation | number | The line of the stack trace that is of interest to the user

####[patchOnePrototype](https://github.com/angular/dom-interceptor/blob/master/dom-interceptor.js#L79)
----------------
#####Use as: patchOnePrototype(type, typeName)

Patch all functions on a given type.prototype to trigger the manipulationListener when called.

####Example

```javascript
var domInterceptor = require('dom-interceptor');
domInterceptor.patchOnePrototype(Document, 'Document');
//Triggers the manipulationListener
document.getElementById('foo');
```

####Params
Param | Type | Description
---   | ---  | ---
type| function | A function whose prototype should be patched.
typeName | String | The string name of the function whose prototype should be patched

####[removeManipulationListener](https://github.com/angular/dom-interceptor/blob/master/dom-interceptor.js#L153)
----------------
#####Use as: removeManipulationListener()

Remove the manipulationListener.

####Example

```javascript
var domInterceptor = require('dom-interceptor');
var listenerFunction = function(message) {
  console.log(message);
};
//Will console.log the given message when manipulation is detected
domInterceptor.addManipulationListener(listenerFunction);
//triggers console.log
document.getElementById('foo');

domInterceptor.removeManipulationListener();
//does not trigger console.log
document.getElementById('foo');
```

####[unpatchOnePrototype](https://github.com/angular/dom-interceptor/blob/master/dom-interceptor.js#L166)
----------------
#####Use as: unpatchOnePrototype(type, typeName)

Unpatch all functions on a given type.prototype that had been patched to trigger the manipulationListener.

####Example

```javascript
var domInterceptor = require('dom-interceptor');
domInterceptor.patchOnePrototype(Document, 'Document');
//Triggers the manipulationListener
document.getElementById('foo');
domInterceptor.unpatchOnePrototype(Document, 'Document');
//Does not trigger the manipulationListener
document.getElementById('foo');
```

####Params
Param | Type | Description
---   | ---  | ---
type| function | A function whose prototype should be unpatched.
typeName | String | The string name of the function whose prototype should be unpatched

## License
Apache 2.0
