# dom interceptor [![Build Status](https://travis-ci.org/angular/dom-interceptor.svg?branch=master)](https://travis-ci.org/angular/dom-interceptor) [![Code Climate](https://codeclimate.com/github/angular/dom-interceptor/badges/gpa.svg)](https://codeclimate.com/github/angular/dom-interceptor)

# Background

This library is designed for use with [angular-hint-dom](https://github.com/angular/angular-hint-dom), a runtime hinting tool that detects manipulation of the `DOM` in AngularJS applications to warn developers about best practices. The goal of this
library is to explore different ways of 'intercepting' or patching `DOM` APIs in order to provide this hinting.

To provide this service, the library creates a main `manipulationListener` that is used by `angular-hint-dom`. This listener is the `interceptor` that listens for use of certain DOM APIs.

The library also contains other methods for patching individual element properties and using proxies that are not used by the current `manipulationListener`. These methods were developed as part of an exploration of how to effectively listen for DOM manipulation.

Especially, the library aims to detect the use of methods such as:
  - retrieval methods such as `document.getElementById()`
  - `element.remove`
  - `element.insertBefore`
  - `element.appendChild`

Originally, other manipulative methods like `element.innerHTML` and `element.parentElement` were also identified as goal methods for the overall `manipulationListener` to detect. However, detecting these DOM APIs requires patching of individual elements. The methods patchExistingElements() and patchElementProperties() were implemented to fill this need. For the best effort goal
of detecting DOM manipulation, patching individual elements was deemed too heavy-handed, dangerous, and costly in terms of performance. For example, some browsers such
as Safari do not allow the patching of element properties. Moreover, these patched elements do not have the same behavior as unpatched elements. A better solution than
patchExistingElements() or patchElementProperties() for providing this interception on
the level of individual elements is to use proxies. The commented out method `domInterceptor.patchAccess` uses the [harmony-reflect library](https://github.com/tvcutsem/harmony-reflect) to provide this service. However, proxies are still considered experimental javascript. In Chrome for instance this javascript feature can only be enabled by setting the flag `chrome://flags/#enable-javascript-harmony`. Hence, these features are not used be the current `manipulationListener`. However, they are interesting explorations of the methods for patching elements.

#Listener Customizations

Since the listener is intended for use by AngularHintDOM, it uses
the AngularHint logging module AngularHintLog to provide warnings
to the developer about DOM manipulation.

These warnings can come in the form of errors, debugger breaks, or various console messages depending on what listener defaults are used. The default is for the listener to provide warnings to the console.

`domInterceptor.setListenerDefaults` may be passed parameters in order to alter this behavior.

## License
Apache 2.0
