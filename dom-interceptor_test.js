describe('domInterceptor', function() {
  var propsNotConfigurable;
  var prototypeNotAvailable;
  var noRemove;
  var listener;
  beforeEach(function(){
    listener = jasmine.createSpy('listener');
  })

  try {
    var div = document.createElement('div');
    domInterceptor.patchElementProperties(div);
  }
  catch(e) {
    propsNotConfigurable = true;
  }

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

  describe('collectUnalteredPrototypeProperties()', function() {
    it('should collect the unpatched properties of prototypes', function() {
      var objectPropertyNames = Object.getOwnPropertyNames(Element.prototype);
      var originalProperties = domInterceptor.collectUnalteredPrototypeProperties(Element, 'Element');
      expect(originalProperties[objectPropertyNames[0]]).toBe(Element.prototype[objectPropertyNames[0]]);
    });


    it('should throw if typeName is not provided', function() {
      expect(function() {
          domInterceptor.collectUnalteredPrototypeProperties(Element);
      }).toThrow('typeName is required to save properties, got: undefined');
    });


    it('should throw if type.prototype is undefined', function() {
      expect(function() {
          domInterceptor.collectUnalteredPrototypeProperties(document.body, 'Body');
      }).toThrow('collectUnalteredPrototypeProperties() needs a .prototype to collect properties from. [object HTMLBodyElement].prototype is undefined.');
    });
  });

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
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(listener);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Element, 'Element');
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Node.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(listener);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Node, 'Node');
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Document.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(listener);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Document, 'Document');
      domInterceptor.removeManipulationListener();
    });


    // it('should create a listener that conforms to the users default parameters', function() {
    //   spyOn(domInterceptor, 'setListenerDefaults');
    //   domInterceptor.addManipulationListener(true, true, true, true);
    //   expect(domInterceptor.setListenerDefaults).toHaveBeenCalledWith(true, true, true, true);
    //   domInterceptor.removeManipulationListener();
    // });


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


    it('should throw if not given the name parameter used to find the original values',
      function() {
        expect(function() {
          domInterceptor.unpatchOnePrototype(Element);
        }).toThrow('typeName must be the name used to save prototype properties. Got: undefined');
      });
  });
  describe('removeManipulationListener()', function() {
    it('should remove the patch from functions on Element.prototype', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(Element, 'Element');
    });


    it('should remove the patch from functions on Node.prototype', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(Node, 'Node');
    });


    it('should remove the patch from functions on Document.prototype', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(Document, 'Document');
    });
  });

  // describe('listener properties', function() {
  //   it('should use default hintLog behavior if no defaults are set', function() {
  //     domInterceptor.setListenerDefaults();
  //     expect(hintLog.debugBreak).toBe(false);
  //     expect(hintLog.propOnly).toBe(false);
  //     expect(hintLog.includeLine).toBe(true);
  //   });


  //   it('should throw an error if loudError default is set', function() {
  //     domInterceptor.setListenerDefaults(true, false, false, true);
  //     expect(function() {
  //       listener('An error');
  //     }).toThrow();
  //   });


  //   it('should pause the debugger if the debugBreak parameter is set', function() {
  //     domInterceptor.setListenerDefaults(false, true, false, true);
  //     expect(hintLog.debugBreak).toEqual(true);
  //   });
  // });
});

