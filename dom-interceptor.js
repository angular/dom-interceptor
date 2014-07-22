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
domInterceptor.originalProperties = {};

/**
* Helper method to collect all properties of a given prototype.
* When patching is removed, all prototype properties
* are set back to these original values
**/
domInterceptor.collectUnalteredPrototypeProperties = function(type, typeName) {
  domInterceptor.listener = domInterceptor._listener;
  if(!type || !type.prototype) {
    throw new Error('collectUnalteredPrototypeProperties() needs a .prototype to collect properties from. ' +
      type + '.prototype is undefined.');
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
  domInterceptor.originalProperties[typeName] = objectProperties;
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
    throw new Error('collectPrototypeProperties() needs a .prototype to collect properties from. ' + type + '.prototype is undefined.');
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
        type.prototype[prop] = domInterceptor.originalProperties[typeName][prop];
      }
    }
    catch(e) {}
  });
  domInterceptor.listener = domInterceptor.savedListener;
};

/**************************************************************************************************/
/** EXTRA PATCHING METHODS NOT USED IN MAIN DOM-MANIPULATION DETECTOR **/

/**
* List of DOM API properties to patch on individual elements.
* These are properties not covered by patching of the prototypes
* and must therefore be patched on the elements themselves.
**/
domInterceptor.propertiesToPatch = ['innerHTML', 'parentElement'];

/**
* Object to hold original version of patched elements
*/
domInterceptor.savedElements = {};

/**
* While patching prototypes patches many of the DOM APIs,
* some properties exist only on the elements themselves. This
* function retrieves all the current elements on the page and
* patches them to call the given listener function if manipulated.
* THE CURRENT LISTENER DOES NOT USE THIS FEATURE. Patching the DOM
* elements was seen as too high of a cost for little return.
* Additionally, using proxies (which are not yet common to browsers) would
* be safer than actually patching elements. This method and its
* helper patchElementProperties are left as interesting individual methods.
* This method will cause errors in Safari where patching of properties is not allowed.
*/
domInterceptor.patchExistingElements = function(listener) {
  domInterceptor.listener = domInterceptor._listener;
  domInterceptor.savedListener = listener;
  var elements = document.getElementsByTagName('*');
  for(var i = 0, length = elements.length; i < length; i++) {
    domInterceptor.save(elements[i], i);
    domInterceptor.patchElementProperties(elements[i]);
  }
  domInterceptor.listener = domInterceptor.savedListener;
};

/**
* Function to patch specified properties of a given
* element to call the listener function on getting or setting
* NOT USED BY THE CURRENT LISTENER.
* This method will cause errors in Safari where patching of properties is not allowed.
**/
domInterceptor.patchElementProperties = function(element) {
  domInterceptor.listener = domInterceptor._listener;
  var real = {};
  domInterceptor.propertiesToPatch.forEach(function(prop) {
    real[prop] = element[prop];
    Object.defineProperty(element, prop, {
      configurable: true,
      get: function() {
        domInterceptor.listener(prop);
        return real[prop];
      },
      set: function(newValue) {
        domInterceptor.listener(prop);
        real[prop] = element[prop];
      }
    });
  });
  domInterceptor.listener = domInterceptor.savedListener;
  return element;
};

/**
* Function to save properties that will be patched
* Each element has an object associating with it the patched properties
**/
domInterceptor.save = function(element, index) {
  domInterceptor.listener = domInterceptor._listener;
  var elementProperties = {};
  domInterceptor.propertiesToPatch.forEach(function(prop) {
    elementProperties[prop] = element[prop];
  });
  domInterceptor.savedElements[index] = elementProperties;
  domInterceptor.listener = domInterceptor.savedListener;
};


/**
* Unpatches all the elements on the page that were patched.
*/
domInterceptor.unpatchExistingElements = function() {
  domInterceptor.listener = domInterceptor._listener;
  var elements = document.getElementsByTagName('*');
  for(var i = 0; i < elements.length; i++) {
    var originalElement = domInterceptor.savedElements[i];
    domInterceptor.unpatchElementProperties(elements[i], originalElement);
  }
  domInterceptor.listener = domInterceptor.savedListener;
};

/**
* Helper function to unpatch all properties of a given element
*/
domInterceptor.unpatchElementProperties = function(element, originalElement) {
  domInterceptor.listener = domInterceptor._listener;
  domInterceptor.propertiesToPatch.forEach(function(prop) {
    Object.defineProperty(element, prop, {
      configurable: true,
      get: function() {
        return originalElement[prop];
      },
      set: function(newValue) {
        element.prop = newValue;
      }
    });
  });
  domInterceptor.listener = domInterceptor.savedListener;
};


// /**
// * Methods to patch DOM Access based on the harmony-reflect library and
// * the use of proxies. Currently proxies are considered experimental javascript.
// * In chrome, proxies can be enabled with the enable-javascript-harmony flag.
// * When support of proxies is more common, these functions could be used to patch
// * DOM elements on retrieval so that only the proxies are patched.
// */
// domInterceptor.accessFunctions = ['getElementsByClassName', 'getElementsByName',
// 'getElementsByTagName', 'getElementsByTagNameNS'];
// domInterceptor.unpatchedFunctions = {};
// domInterceptor.patchAccess = function() {
//   var originalIndividual = Document.prototype['getElementById'];
//   domInterceptor.unpatchedFunctions['getElementById'] = originalIndividual;
//   Document.prototype['getElementById'] = function() {
//     return domInterceptor.getProxy(originalIndividual.apply(this, arguments));
//   }
//   domInterceptor.accessFunctions.forEach(function(accessFunction) {
//     var originalFunction = Document.prototype[accessFunction];
//     domInterceptor.unpatchedFunctions[accessFunction] = originalFunction;
//     Document.prototype[accessFunction] = function() {
//       return domInterceptor.getProxyList(originalFunction.apply(this, arguments));
//     }
//   });
// };

// /**
// * Attempts to create a proxy element in place of a created element when the method
// * is called. Currently causes the proxy to be null.
// */
// domInterceptor.patchCreation = function() {
//   var originalCreate = Document.prototype['createElement'];
//   domInterceptor.unpatchedFunctions['createElement'] = Document.prototype['createElement'];
//   Document.prototype['createElement'] = function() {
//     return domInterceptor.getProxy(originalCreate.apply(this, arguments));
//   }
// }

// /**
// * Helper method to get a list of proxies for methods that access
// * lists of DOM elements such as getElementsByTagName()
// */
// domInterceptor.getProxyList = function(elementList) {
//   var elems = {};
//   for(var i = 0; i < Object.keys(elementList).length - 1; i++) {
//     if(elementList[i]) {
//       elems[i] = domInterceptor.getProxy(elementList[i]);
//     }
//   }
//   return elems;
// };

// /**
// * Creates a proxy element that is accessed instead of a given DOM element.
// * This proxy is patched to call the desired listener function.
// * Hence, the proxy has the functionality necessary to detect DOM manipulation,
// * but the original element is still fully functional.
// */
// domInterceptor.getProxy = function(element) {
//   var proxyElement = new Proxy(element, {
//     get: function(target, name, receiver) {
//       domInterceptor.savedListener(name);
//       return Reflect.get(target, name, receiver);
//     },
//     set: function(target, name, value, receiver) {
//       domInterceptor.savedListener(name);
//       return Reflect.set(target, name, value, receiver);
//     }
//   });
//   return proxyElement;
// };

// /**
// * Removes proxies of elements.
// */
// domInterceptor.unPatchAccess = function() {
//   Document.prototype['getElementById'] = domInterceptor.unpatchedFunctions['getElementById'];
//   domInterceptor.accessFunctions.forEach(function(accessFunction) {
//     Document.prototype[accessFunction] = domInterceptor.unpatchedFunctions[accessFunction];
//   });
// };

}((typeof module !== 'undefined' && module && module.exports) ?
      (module.exports = window.domInterceptor = {}) : (window.domInterceptor = {}) ));
