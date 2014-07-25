var domInterceptor = require('./dom-interceptor');
describe('domInterceptor', function() {
  var prototypeNotAvailable;
  var noRemove;
  var listener;
  beforeEach(function(){
    listener = jasmine.createSpy('listener');
  });

  try {
    var objectProperties = Object.getOwnPropertyNames(Element.prototype);
    objectProperties.forEach(function(prop) {
      Object.getOwnPropertyDescriptor(Element.prototype, prop);
    });
  }
  catch(e) {
    prototypeNotAvailable = true;
  }

  var oneElem = document.createElement('div');
  if(typeof oneElem.remove != 'function') {
    noRemove = true;
  }

  describe('patchOnePrototype()', function() {
    it('should patch all properties of a given object .prototype', function() {
      var originalFunction = Element.prototype.getAttribute;
      domInterceptor.patchOnePrototype(Element, 'Element');
      expect(Element.prototype.getAttribute).not.toBe(originalFunction);
      domInterceptor.unpatchOnePrototype(Element, 'Element');
    });
  });

  describe('addManipulationListener()', function() {
    it('should patch the functions of Element.prototype', function() {
      domInterceptor.addManipulationListener(listener);
      var elem = document.createElement('div');
      elem.getAttribute('align');
      expect(listener).toHaveBeenCalledWith('Detected Manipulation of DOM API: getAttribute');
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Node.prototype', function() {
      var elem = document.createElement('div');
      var elem2 = document.createElement('div');
      domInterceptor.addManipulationListener(listener);
      elem.appendChild(elem2);
      expect(listener).toHaveBeenCalledWith('Detected Manipulation of DOM API: appendChild');
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Document.prototype', function() {
      domInterceptor.addManipulationListener(listener);
      var fragment = document.createDocumentFragment('div');
      expect(listener).toHaveBeenCalledWith('Detected Manipulation of DOM API: createDocumentFragment');
      domInterceptor.removeManipulationListener();
    });


    if(!noRemove) {
      it('should detect calling element.remove', function() {
        domInterceptor.addManipulationListener(listener);
        var element = document.createElement('div');
        element.remove();
        expect(listener).toHaveBeenCalled();
        domInterceptor.removeManipulationListener();
      });
    }


    //Will only be patched if prototypes can be patched
    //Test not run if prototype cannot be patched
    if(!prototypeNotAvailable) {
      it('should detect calling element.addEventListener', function() {
        domInterceptor.addManipulationListener(listener);
        var element = document.createElement('div');
        var parent = element.addEventListener('click', function(e){});
        expect(listener).toHaveBeenCalled();
        domInterceptor.removeManipulationListener();
      });


      it('should detect calling element.insertBefore', function() {
        var parentElement = document.createElement('div');
        var referenceElement = document.createElement('div');
        parentElement.appendChild(referenceElement);
        domInterceptor.addManipulationListener(listener);
        var newElement = document.createElement('div');
        parentElement.insertBefore(newElement, referenceElement);
        expect(listener).toHaveBeenCalled();
        domInterceptor.removeManipulationListener();
      });


      it('should detect calling element.appendChild', function() {
        var parentElement = document.createElement('div');
        var childElement = document.createElement('div');
        domInterceptor.addManipulationListener(listener);
        parentElement.appendChild(childElement);
        expect(listener).toHaveBeenCalled();
        domInterceptor.removeManipulationListener();
      });
    }
  });

  describe('enableLineNumber', function(){
    it('should add a line number to listener message if default is set', function() {
      domInterceptor.enableLineNumbers(3);
      domInterceptor.addManipulationListener(listener);
      var element = document.createElement('div');
      var parent = element.addEventListener('click', function(e){});
      expect(listener).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should throw if the parameter is not a valid number', function() {
      expect(function() {
        domInterceptor.enableLineNumbers('randomString');
      }).toThrow('Enabling line numbers requires an integer parameter of the stack trace line that '
      + 'should be given. Got: randomString');
    });
  });

  describe('unpatchOnePrototype()', function() {
    it('should unpatch the .prototype properties of the given parameter', function() {
      var objectProperties = Object.getOwnPropertyNames(Element.prototype);
      var testProperty = objectProperties[0];
      var originalFunction = Element.prototype[testProperty];
      expect(Element.prototype[testProperty]).toBe(originalFunction);
      domInterceptor.patchOnePrototype(Element, 'Element');
      domInterceptor.unpatchOnePrototype(Element, 'Element');
      expect(Element.prototype[testProperty]).toBe(originalFunction);
    });


    it('should throw if not given the name parameter used to find the original values', function() {
      expect(function() {
        domInterceptor.unpatchOnePrototype(Element);
      }).toThrow('typeName must be the name used to save prototype properties. Got: undefined');
    });
  });

  describe('removeManipulationListener()', function() {
    it('should remove the patch from functions on Element.prototype', function() {
      domInterceptor.addManipulationListener(listener)
      domInterceptor.removeManipulationListener();
      var elem = document.createElement('div');
      elem.getAttribute('align');
      expect(listener).not.toHaveBeenCalled();
    });


    it('should remove the patch from functions on Node.prototype', function() {
      var elem = document.createElement('div');
      var elem2 = document.createElement('div');
      domInterceptor.addManipulationListener(listener);
      domInterceptor.removeManipulationListener();
      elem.appendChild(elem2);
      expect(listener).not.toHaveBeenCalledWith();
    });


    it('should remove the patch from functions on Document.prototype', function() {
      domInterceptor.addManipulationListener(listener);
      domInterceptor.removeManipulationListener();
      var fragment = document.createDocumentFragment('div');
      expect(listener).not.toHaveBeenCalledWith();
    });
  });

  describe('browser consistency', function() {
    it('should not patch properties that are only patchable in some browsers', function() {
      var e = document.createElement('div');
      domInterceptor.addManipulationListener(listener);
      e.innerHTML += 'blank';
      domInterceptor.removeManipulationListener();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
