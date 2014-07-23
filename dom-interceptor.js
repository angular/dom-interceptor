(function (domInterceptor) {
'use strict';

/**
* Initializes the listener by setting defaults. These defaults are
* used by the HintLog module to decide how the user should be notified of errors.
* Controls the patching process by patching all necessary
* prototypes. The unpatched state of the prototype is saved so that
* it can be safely reverted later.
**/
domInterceptor.addManipulationListener = function(listener) {
  domInterceptor.listener = domInterceptor._listener;
  domInterceptor.savedListener = listener;
  domInterceptor.patchOnePrototype(Element, 'Element');
  domInterceptor.patchOnePrototype(Node, 'Node');
  domInterceptor.patchOnePrototype(Document, 'Document');
  domInterceptor.listener = domInterceptor.savedListener;
};

/**
* The DOM-interceptor should not throw errors because
* of its own access to the DOM. Within the interceptor
* the listener should have no behavior
*/
domInterceptor._listener = domInterceptor.NOOP = function() {};
domInterceptor.listener = domInterceptor.savedListener;

domInterceptor.savedListener = function(message) {};

/**
* Object to preserve all the original properties
* that will be restored after patching.
**/
var originalProperties = {};

/**
* Helper method to collect all properties of a given prototype.
* When patching is removed, all prototype properties
* are set back to these original values
**/
domInterceptor.collectUnalteredPrototypeProperties = function(type, typeName) {
  domInterceptor.listener = domInterceptor._listener;
  if(!type || !type.prototype) {
    throw new Error('collectUnalteredPrototypeProperties() needs a .prototype to collect properties' +
      ' from. ' + type + '.prototype is undefined.');
  }
  else if(!typeName) {
    throw new Error('typeName is required to save properties, got: ' + typeName);
  }
  var objectProperties = {};
  var objectPropertyNames = Object.getOwnPropertyNames(type.prototype);
  objectPropertyNames.forEach(function(prop) {
    //Access of some prototype values may throw an error
    try {
      objectProperties[prop] = type.prototype[prop];
    }
    catch(e) {}
  });
  domInterceptor.listener = domInterceptor.savedListener;
  originalProperties[typeName] = objectProperties;
  return objectProperties;
};

/**
* Helper function for patching one prototype.
* Patches the given type with the addition of a
* call to listener, a function passed as a parameter.
* If no listener function is provided, the default listener is used.
*/
domInterceptor.patchOnePrototype = function(type, typeName) {
  domInterceptor.collectUnalteredPrototypeProperties(type, typeName);
  domInterceptor.listener = domInterceptor._listener;
  if (!type || !type.prototype) {
    throw new Error('collectPrototypeProperties() needs a .prototype to collect properties from. '
      + type + '.prototype is undefined.');
  }
  var objectProperties = Object.getOwnPropertyNames(type.prototype);
  objectProperties.forEach(function(prop) {
    //Access of some prototype values may throw an error
    var desc = undefined;
    try {
      desc = Object.getOwnPropertyDescriptor(type.prototype, prop);
    }
    catch(e) {}
    if (desc) {
      if (desc.configurable) {
        if (desc.value) {
          if (typeof desc.value === 'function') {
            var originalValue = desc.value;
            desc.value = function () {
              domInterceptor.listener(prop);
              return originalValue.apply(this, arguments);
            };
          }
        } else {
            if (typeof desc.set === 'function') {
              var originalSet = desc.set;
              desc.set = function () {
                domInterceptor.listener('set:' + prop);
                return originalSet.apply(this, arguments);
              };
            }
            if (typeof desc.get === 'function') {
              var originalGet = desc.get;
              desc.get = function () {
                domInterceptor.listener('get:' + prop);
                return originalGet.apply(this, arguments);
              };
            }
          }
        Object.defineProperty(type.prototype, prop, desc);
      } else if (desc.writable) {
          try {
            var original = type.prototype[prop];
            type.prototype[prop] = function () {
              domInterceptor.listener(prop);
              return original.apply(this, arguments);
            };
          }
          catch (e) {}
        }
    }
  });
  domInterceptor.listener = domInterceptor.savedListener;
};

/**
* Controls the unpatching process by unpatching the
* prototypes as well as disabling the patching of individual
* HTML elements and returning those patched elements to their
* original state.
**/
domInterceptor.removeManipulationListener = function() {
  domInterceptor.listener = domInterceptor._listener;
  domInterceptor.unpatchOnePrototype(Element, 'Element');
  domInterceptor.unpatchOnePrototype(Node, 'Node');
  domInterceptor.unpatchOnePrototype(Document, 'Document');
  domInterceptor.listener = domInterceptor.savedListener;
};

/**
* Helper function to unpatch one prototype.
* Sets all properties of the given type back to the
* original values that were collected.
**/
domInterceptor.unpatchOnePrototype = function(type, typeName) {
  domInterceptor.listener = domInterceptor._listener;
  if(!typeName) {
    throw new Error('typeName must be the name used to save prototype properties. Got: ' + typeName);
  }
  var objectProperties = Object.getOwnPropertyNames(type.prototype);
  objectProperties.forEach(function(prop) {
    //Access of some prototype values may throw an error
    try{
    var alteredElement = type.prototype[prop];
      if(typeof alteredElement === 'function') {
        type.prototype[prop] = originalProperties[typeName][prop];
      }
    }
    catch(e) {}
  });
  domInterceptor.listener = domInterceptor.savedListener;
};

}((typeof module !== 'undefined' && module && module.exports) ?
      (module.exports = window.domInterceptor = {}) : (window.domInterceptor = {}) ));
