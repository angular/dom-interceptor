(function (domInterceptor) {

'use strict';

/**
* Controls the patching process by patching all necessary
* prototypes as well as triggering the patching of individual
* HTML elements.
**/
domInterceptor.addManipulationListener = function(loudError, debugStatement, propOnly) {
  domInterceptor.listener = domInterceptor._listener;
  domInterceptor.setListenerDefaults(loudError, debugStatement, propOnly);
  domInterceptor.collectUnalteredPrototypeProperties(Element, 'Element');
  domInterceptor.patchOnePrototype(Element);
  domInterceptor.collectUnalteredPrototypeProperties(Node, 'Node');
  domInterceptor.patchOnePrototype(Node);
  domInterceptor.collectUnalteredPrototypeProperties(EventTarget, 'EventTarget');
  domInterceptor.patchOnePrototype(EventTarget);
  domInterceptor.collectUnalteredPrototypeProperties(Document, 'Document');
  domInterceptor.patchOnePrototype(Document);
  domInterceptor.patchExistingElements();
  domInterceptor.listener = domInterceptor.savedListener;
};

/**
* Set the listener function to a custom value
* if the provided listener is not undefined and
* is a function. If the parameter does not meet these
* standards, leave domInterceptor.callListenerWithMessage as the default error
* throwing function.
*/
domInterceptor.setListenerDefaults = function(loudError, debugBreak, propOnly) {
  loudError ? domInterceptor.loudError = true : domInterceptor.loudError = false;
  debugBreak ? domInterceptor.debugBreak = true : domInterceptor.debugBreak = false;
  propOnly ? domInterceptor.propOnly = true : domInterceptor.propOnly = false;
};

domInterceptor._listener = domInterceptor.NOOP = function() {};

domInterceptor.listener;

domInterceptor.savedListener = function(messageProperties) {
  domInterceptor.callListenerWithMessage(messageProperties);
};

/**
* Error function thrown on detection of DOM manipulation.
* May be overriden to throw custom error function if desired.
*/
domInterceptor.callListenerWithMessage = function(messageProperties) {
  var message = messageProperties.property;
  if(!domInterceptor.propOnly) {
    message = messageProperties.message + ' ' + message;
  }

  if(domInterceptor.loudError) {
    throw new Error(message);
  }
  else if(domInterceptor.debugBreak) {
    debugger;
  }
  else {
    console.log(message);
  }
};

/**
* Default formatting of error to be thrown on DOM API manipulation from
* a controller.
*/
domInterceptor.defaultError = 'Angular best practices are to manipulate the DOM in the view. ' +
'Remove DOM manipulation from the controller. ' +
'Warning because of manipulating property:';

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
domInterceptor.patchOnePrototype = function(type) {
  domInterceptor.listener = domInterceptor._listener;
  if (!type || !type.prototype) {
    throw new Error('collectPrototypeProperties() needs a .prototype to collect properties from. ' +
      type + '.prototype is undefined.');
  }
  var objectProperties = Object.getOwnPropertyNames(type.prototype);
  objectProperties.forEach(function(prop) {
    //Access of some prototype values may throw an error
    var desc = Object.getOwnPropertyDescriptor(type.prototype, prop);
    if (desc) {
      if (desc.configurable) {
        if (desc.value) {
          if (typeof desc.value === 'function') {
            var originalValue = desc.value;
            desc.value = function () {
              domInterceptor.listener({message: domInterceptor.message, property: prop});
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
            domInterceptor.callListenerWithMessage({message: domInterceptor.message, property: prop});
            return original.apply(this, arguments);
          };
        }
        catch (e) {}
      }
    }
  });
  domInterceptor.listener = domInterceptor._listener;
};

/**
* While patching prototypes patches many of the DOM APIs,
* some properties exist only on the elements themselves. This
* function retrieves all the current elements on the page and
* patches them to call the given listener function if manipulated.
*/
domInterceptor.patchExistingElements = function() {
  domInterceptor.listener = domInterceptor._listener;
  var elements = document.getElementsByTagName('*');
  for(var i = 0; i < elements.length; i++) {
    domInterceptor.save(elements[i], i);
    domInterceptor.patchElementProperties(elements[i]);
  }
  domInterceptor.listener = domInterceptor.savedListener;
};

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
* Helper function to patch specified properties of a given
* element to call the listener function on getting or setting
**/
domInterceptor.patchElementProperties = function(element) {
  domInterceptor.listener = domInterceptor._listener;
  var real = {};
  domInterceptor.propertiesToPatch.forEach(function(prop) {
    real[prop] = element[prop];
    Object.defineProperty(element, prop, {
      configurable: true,
      get: function() {
        domInterceptor.listener({message: domInterceptor.message, property: prop});
        return real[prop];
      },
      set: function(newValue) {
        domInterceptor.listener({message: domInterceptor.message, property: prop});
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
  domInterceptor.listener = domInterceptor._listener;
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
  domInterceptor.unpatchOnePrototype(EventTarget, 'EventTarget');
  domInterceptor.unpatchOnePrototype(Document, 'Document');
  domInterceptor.unpatchExistingElements();
  domInterceptor.listener = domInterceptor._listener;
};


/**
* Helper function to unpatch one prototype.
* Sets all properties of the given type back to the
* original values that were collected.
**/
domInterceptor.unpatchOnePrototype = function(type, typeName) {
  domInterceptor.listener = domInterceptor._listener;
  if(typeName == undefined) {
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
  domInterceptor.listener = domInterceptor._listener;
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
  domInterceptor.listener = domInterceptor._listener;
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
  domInterceptor.listener = domInterceptor._listener;
};

}((typeof module !== 'undefined' && module && module.exports) ?
      module.exports : (window.domInterceptor = {}) ));
