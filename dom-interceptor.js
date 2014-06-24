(function (domInterceptor) {

'use strict';

/**
* Helper method to collect all properties of a given prototype.
* When patching is removed, all prototype properties
* are set back to these original values
**/
domInterceptor.collectPrototypeProperties = function(type) {
  if(type ==  undefined || type.prototype == undefined) {
    throw new Error('collectPrototypeProperties() needs a .prototype to collect properties from. ' +
      type + '.prototype is undefined.');
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
  return objectProperties;
};

/**
* Object to preserve all the original properties
* that will be restored after patching.
**/
domInterceptor.originalProperties = {
  'Element': domInterceptor.collectPrototypeProperties(Element),
  'Node': domInterceptor.collectPrototypeProperties(Node),
  'EventTarget': domInterceptor.collectPrototypeProperties(EventTarget),
  'Document': domInterceptor.collectPrototypeProperties(Document),
  'DocumentCreate': document['createElement']
};

/**
* Helper function for patching one prototype.
* Patches the given type with the addition of a
* call to listener, a function passed as a parameter.
* If no listener function is provided, the default listener is used.
*/
domInterceptor.patchOnePrototype = function(type, listener) {
  domInterceptor.setListener(listener);
  if (!type || !type.prototype) {
    throw new Error('collectPrototypeProperties() needs a .prototype to collect properties from. ' +
      type + '.prototype is undefined.');
  }
  var objectProperties = Object.getOwnPropertyNames(type.prototype);
  objectProperties.forEach(function(prop) {
    //Access of some prototype values may throw an error
    var original = type.prototype[prop];
    if(typeof original === 'function') {
      try {
        type.prototype[prop] = function () {
          domInterceptor.callListenerWithMessage(prop);
          return original.apply(this, arguments);
        };
      }
      catch (e) {}
    }
  });
};

/**
* Helper function to unpatch one prototype.
* Sets all properties of the given type back to the
* original values that were collected.
**/
domInterceptor.unpatchOnePrototype = function(type, typeName) {
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
* Function to save properties that will be patched
* Each element has an object associating with it the patched properties
**/
domInterceptor.save = function(element, index) {
  var elementProperties = {};
  domInterceptor.propertiesToPatch.forEach(function(prop) {
    elementProperties[prop] = element[prop];
  });
  domInterceptor.savedElements[index] = elementProperties;
};


/**
* Helper function to patch specified properties of a given
* element to call the listener function on getting or setting
**/
domInterceptor.patchElementProperties = function(element, listener) {
  domInterceptor.setListener(listener);
  domInterceptor.propertiesToPatch.forEach(function(prop) {
    Object.defineProperty(element, prop, {
      configurable: true,
      get: function() {
        domInterceptor.listener(prop);
        return element.prop;
      },
      set: function(newValue) {
        domInterceptor.listener(prop);
      }
    });
  });
  return element;
};

/**
* Helper function to unpatch all properties of a given element
*/
domInterceptor.unpatchElementProperties = function(element, originalElement) {
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
};

/**
* While patching prototypes patches many of the DOM APIs,
* some properties exist only on the elements themselves. This
* function retrieves all the current elements on the page and
* patches them to call the given listener function if manipulated.
*/
domInterceptor.patchExistingElements = function(listener) {
  domInterceptor.setListener(listener);
  var elements = document.getElementsByTagName('*');
  for(var i = 0; i < elements.length; i++) {
    domInterceptor.save(elements[i], i);
    domInterceptor.patchElementProperties(elements[i], listener);
  }
};

/**
* Unpatches all the elements on the page that were patched.
*/
domInterceptor.unpatchExistingElements = function() {
  var elements = document.getElementsByTagName('*');
  for(var i = 0; i < elements.length; i++) {
    var originalElement = domInterceptor.savedElements[i];
    domInterceptor.unpatchElementProperties(elements[i], originalElement);
  }
};

/**
* Controls the patching process by patching all necessary
* prototypes as well as triggering the patching of individual
* HTML elements.
**/
domInterceptor.addManipulationListener = function(listener) {
  domInterceptor.setListener(listener);
  domInterceptor.patchExistingElements();
  domInterceptor.patchOnePrototype(Element);
  domInterceptor.patchOnePrototype(Node);
  domInterceptor.patchOnePrototype(EventTarget);
  domInterceptor.patchOnePrototype(Document);
};

/**
* Controls the unpatching process by unpatching the
* prototypes as well as disabling the patching of individual
* HTML elements and returning those patched elements to their
* original state.
**/
domInterceptor.removeManipulationListener = function() {
  domInterceptor.unpatchOnePrototype(Element, 'Element');
  domInterceptor.unpatchOnePrototype(Node, 'Node');
  domInterceptor.unpatchOnePrototype(EventTarget, 'EventTarget');
  domInterceptor.unpatchOnePrototype(Document, 'Document');
  domInterceptor.unpatchExistingElements();
};

/**
* Default formatting of error to be thrown on DOM API manipulation from
* a controller.
*/
domInterceptor.defaultError = 'Angular best practices are to manipulate the DOM in the view. ' +
'Remove DOM manipulation from the controller. ' +
'Thrown because of manipulating property:';

/**
* Set the listener function to a custom value
* if the provided listener is not undefined and
* is a function. If the parameter does not meet these
* standards, leave domInterceptor.listener as the default error
* throwing function.
*/
domInterceptor.setListener = function(listener) {
  if(listener != undefined) {
    if(typeof listener === 'function') {
      domInterceptor.listener = listener;
    }
    else {
      throw new Error('listener must be a function, got: ' + typeof listener);
    }
  }
};

/**
* Error function thrown on detection of DOM manipulation.
* May be overriden to throw custom error function if desired.
*/
domInterceptor.listener = function(property) {
  var e = new Error(domInterceptor.defaultError + ' ' + property);
  //Find the relevant stack trace identification
  //The first two lines of stack trace refer to the error being thrown
  //As listener inside of this file
  //e += '\n' + e.stack.split('\n')[3];
  throw e;
};

domInterceptor.callListenerWithMessage = function(property) {
  return domInterceptor.listener(domInterceptor.defaultError + ' ' + property);
};

}((typeof module !== 'undefined' && module && module.exports) ?
      module.exports : (window.domInterceptor = {}) ));
