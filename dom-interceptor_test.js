describe('domInterceptor', function() {
  var prototypeNotAvailable;
  var noRemove;

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

  Object.getOwnPropertyDescriptor(EventTarget.prototype, EventTarget.prototype.addEventListener);

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

  describe('patchExistingElements()', function() {
      it('should save versions of the original DOM elements', function() {
        var elements = document.getElementsByTagName('*');
        var length = elements.length;
        domInterceptor.patchExistingElements();
        expect(domInterceptor.savedElements[length - 1]).not.toBeUndefined();
        domInterceptor.unpatchExistingElements();
      });


      it('should patch existing elements in the DOM', function() {
          spyOn(hintLog, 'foundError');
          var testElement = document.createElement('div');
          testElement.setAttribute('id', 'test');
          document.body.appendChild(testElement);
          domInterceptor.patchExistingElements();
          testElement.innerHTML = 'new innerHTML value';
          //Counts once for getting innerHTML, once for setting
          expect(hintLog.foundError.callCount).toBe(2);
          domInterceptor.unpatchExistingElements();
      });
  });

  describe('patchProperties()', function() {
    it('should patch target properties of created HTML objects', function() {
      spyOn(hintLog, 'foundError');
      var testProperty = 'innerHTML';
      var element = document.createElement('a');
      var copy = element;
      domInterceptor.patchElementProperties(element);
      expect(hintLog.foundError).not.toHaveBeenCalled();
      element.innerHTML = 'new innerHTML value';
      expect(hintLog.foundError.callCount).toBe(2);
      domInterceptor.unpatchElementProperties(element, copy);
    });


    it('should not preserve the functionality of DOM APIS that are patched on individual elements', function() {
      spyOn(hintLog, 'foundError');
      var element = document.createElement('a');
      var copy = element;
      expect(element.innerHTML).toBe('');
      domInterceptor.patchElementProperties(element);
      element.innerHTML = 'Testing Value';
      expect(element.innerHTML).toBe('');
      expect(hintLog.foundError).toHaveBeenCalled();
      domInterceptor.unpatchElementProperties(element, copy);
    });
  });

  describe('unpatchExistingElements()', function() {
      it('should return existing elements to their before patch state', function() {
          spyOn(hintLog, 'foundError');
          var testElement = document.createElement('div');
          testElement.innerHTML = 'testing html';
          testElement.setAttribute('id', 'testNew');

          var testElement2 = document.createElement('div');
          testElement2.innerHTML = 'different html';
          testElement2.setAttribute('id', 'test2');

          document.body.appendChild(testElement);
          document.body.appendChild(testElement2);

          expect(testElement.innerHTML).toBe('testing html');
          expect(document.getElementById('testNew').innerHTML).toBe('testing html');

          domInterceptor.patchExistingElements();

          expect(testElement.innerHTML).toBe('testing html');
          expect(document.getElementById('testNew').innerHTML).toBe('testing html');
          expect(hintLog.foundError).toHaveBeenCalled();

          domInterceptor.unpatchExistingElements();

          expect(document.getElementById('testNew').innerHTML).toBe('testing html');
          expect(document.getElementById('test2').innerHTML).toBe('different html');
      });
  });
  describe('unpatchElementProperties()', function() {
    it('should unpatch target properties patched on HTML objects', function() {
      spyOn(hintLog, 'foundError');
      var element = document.createElement('a');
      expect(element.innerHTML).toBe('');
      domInterceptor.patchElementProperties(element);
      expect(element.innerHTML).toBe('');
      expect(hintLog.foundError).toHaveBeenCalled();
      var originalElementProperties = {
          'innerHTML': '',
          'parentElement': ''
      }
      domInterceptor.unpatchElementProperties(element, originalElementProperties);

      hintLog.foundError.reset();
      expect(element.innerHTML).toBe('');
      expect(hintLog.foundError).not.toHaveBeenCalled();
    });
  });
  describe('patchOnePrototype()', function() {
      it('should patch all properties of a given object .prototype', function() {
        var originalFunction = Element.prototype.getAttribute;
        domInterceptor.collectUnalteredPrototypeProperties(Element, 'Element');
        domInterceptor.patchOnePrototype(Element);
        expect(Element.prototype.getAttribute).not.toBe(originalFunction);
        domInterceptor.unpatchOnePrototype(Element, 'Element');
      });
  });
  describe('addManipulationListener()', function() {
    // CURRENTLY, THE IMPLEMENTATION DOES NOT PATCH INDIVIDUAL ELEMENTS
    // it('should patch existing DOM elements', function() {
    //   spyOn(hintLog, 'foundError');
    //   spyOn(domInterceptor, 'patchExistingElements');
    //   expect(domInterceptor.patchExistingElements).not.toHaveBeenCalled();
    //   domInterceptor.addManipulationListener(hintLog.foundError);
    //   expect(domInterceptor.patchExistingElements).toHaveBeenCalled();
    //   domInterceptor.removeManipulationListener();
    // });


    it('should patch the functions of Element.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      spyOn(hintLog, 'foundError');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(hintLog.foundError);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Element);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Node.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      spyOn(hintLog, 'foundError');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(hintLog.foundError);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Node);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of EventTarget.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      spyOn(hintLog, 'foundError');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(hintLog.foundError);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(EventTarget);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Document.prototype', function() {
     spyOn(domInterceptor, 'patchOnePrototype');
      spyOn(hintLog, 'foundError');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(hintLog.foundError);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Document);
      domInterceptor.removeManipulationListener();
    });


    it('should create a listener that conforms to the users default parameters', function() {
      spyOn(domInterceptor, 'setListenerDefaults');
      domInterceptor.addManipulationListener(true, true, true, true);
      expect(domInterceptor.setListenerDefaults).toHaveBeenCalledWith(true, true, true, true);
      domInterceptor.removeManipulationListener();
    });


    //WITHOUT PATCHING OF INDIVIDUAL ELEMENTS, THESE TESTS DO NOT PASS
    // it('should detect getting element.innerHTML', function() {
    //   spyOn(hintLog, 'foundError');
    //   var testElement = document.createElement('div');
    //   document.body.appendChild(testElement);
    //   domInterceptor.addManipulationListener();
    //   var inner = testElement.innerHTML;
    //   //expect(hintLog.foundError.callCount).toBe(1);
    //   expect(hintLog.foundError).toHaveBeenCalled();
    //   domInterceptor.removeManipulationListener();
    // });


    // it('should detect setting element.innerHTML', function() {
    //   spyOn(hintLog, 'foundError');
    //   var element = document.createElement('div');
    //   document.body.appendChild(element);
    //   domInterceptor.addManipulationListener();
    //   element.innerHTML = 'blank';
    //   expect(hintLog.foundError).toHaveBeenCalled();
    //   domInterceptor.removeManipulationListener();
    // });


    // it('should detect getting element.parentElement', function() {
    //   spyOn(hintLog, 'foundError');
    //   var element = document.createElement('div');
    //   document.body.appendChild(element);
    //   domInterceptor.addManipulationListener();
    //   var parent = element.parentElement;
    //   expect(hintLog.foundError).toHaveBeenCalled();
    //   domInterceptor.removeManipulationListener();
    // });

    if(!noRemove) {
      it('should detect calling element.remove', function() {
        spyOn(hintLog, 'foundError');
        domInterceptor.addManipulationListener();
        var element = document.createElement('div');
        element.remove();
        expect(hintLog.foundError).toHaveBeenCalled();
        domInterceptor.removeManipulationListener();
      });
    }

    //Will only be patched if Node.prototype and EventTarget.prototype can be patched
    //Test not run if prototype cannot be patched
    if(!prototypeNotAvailable) {
      it('should detect calling element.addEventListener', function() {
        spyOn(hintLog, 'foundError');
        domInterceptor.addManipulationListener();
        var element = document.createElement('div');
        var parent = element.addEventListener('click', function(e){});
        expect(hintLog.foundError).toHaveBeenCalled();
        domInterceptor.removeManipulationListener();
      });


      it('should detect calling element.insertBefore', function() {
        spyOn(hintLog, 'foundError');
        var parentElement = document.createElement('div');
        var referenceElement = document.createElement('div');
        parentElement.appendChild(referenceElement);
        domInterceptor.addManipulationListener();
        var newElement = document.createElement('div');
        parentElement.insertBefore(newElement, referenceElement);
        expect(hintLog.foundError).toHaveBeenCalled();
        domInterceptor.removeManipulationListener();
      });


      it('should detect calling element.appendChild', function() {
        spyOn(hintLog, 'foundError');
        var parentElement = document.createElement('div');
        var childElement = document.createElement('div');
        domInterceptor.addManipulationListener();
        parentElement.appendChild(childElement);
        expect(hintLog.foundError).toHaveBeenCalled();
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
      domInterceptor.collectUnalteredPrototypeProperties(Element, 'Element');
      domInterceptor.patchOnePrototype(Element);
      expect(Element.prototype[testProperty]).not.toBe(originalFunction);
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
      spyOn(domInterceptor, 'unpatchExistingElements');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(Element, 'Element');
    });


    it('should remove the patch from functions on Node.prototype', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      spyOn(domInterceptor, 'unpatchExistingElements');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(Node, 'Node');
    });


    it('should remove the patch from functions on EventTarget.prototype', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      spyOn(domInterceptor, 'unpatchExistingElements');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(EventTarget, 'EventTarget');
    });


    it('should remove the patch from functions on Document.prototype', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      spyOn(domInterceptor, 'unpatchExistingElements');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(Document, 'Document');
    });

    //CURRENTLY, INDIVIDUAL ELMENTS ARE NOT BEING PATCHED. HENCE UNPATCHING IS NOT NEEDED
    // it('should remove the patch from all DOM elements', function() {
    //   spyOn(domInterceptor, 'unpatchOnePrototype');
    //   spyOn(domInterceptor, 'unpatchExistingElements');
    //   expect(domInterceptor.unpatchExistingElements).not.toHaveBeenCalled();
    //   domInterceptor.removeManipulationListener();
    //   expect(domInterceptor.unpatchExistingElements).toHaveBeenCalled();
    // });
  });

  describe('listener properties', function() {
    it('should use default hintLog behavior if no defaults are set', function() {
      domInterceptor.setListenerDefaults();
      expect(hintLog.debugBreak).toBe(false);
      expect(hintLog.propOnly).toBe(false);
      expect(hintLog.includeLine).toBe(true);
    });


    it('should throw an error if loudError default is set', function() {
      domInterceptor.setListenerDefaults(true, false, false, true);
      expect(function() {
        hintLog.foundError('An error');
      }).toThrow();
    });


    it('should pause the debugger if the debugBreak parameter is set', function() {
      domInterceptor.setListenerDefaults(false, true, false, true);
      expect(hintLog.debugBreak).toEqual(true);
    });
  });

  // Tests that require the harmony-reflect library and implementations of proxies
  // describe('patchAccessMethods()', function() {
  //   it('should patch methods used to retrieve DOM objects to return proxies', function() {
  //     var test = document.createElement('div');
  //     test.setAttribute('id', 'test');
  //     document.body.appendChild(test);
  //     domInterceptor.patchAccess();
  //     test = document.getElementById('test');
  //     test.innerHTML = 'new value';
  //     //Proxies execute listener function
  //     expect(hintLog.foundError).toHaveBeenCalled();
  //     domInterceptor.unPatchAccess();
  //   });


  //   it('should patch methods used to retrieve lists of DOM objects', function() {
  //     domInterceptor.patchAccess();
  //     var test2 = document.createElement('div');
  //     document.body.appendChild(test2);
  //     var elements = document.getElementsByTagName('div');
  //     elements[0].innerHTML = 'new value';
  //     expect(hintLog.foundError).toHaveBeenCalled();
  //     domInterceptor.unPatchAccess();
  //   });
  // });

  // describe('unPatchAccess()', function() {
  //   it('should unpatch methods used to retrieve DOM objects', function() {
  //     domInterceptor.patchAccess();
  //     domInterceptor.unPatchAccess();
  //     var test = document.createElement('div');
  //     test.setAttribute('id', 'test');
  //     document.body.appendChild(test);
  //     test2 = document.getElementById('test');
  //     test2.innerHTML = 'new value';
  //     //Proxies execute listener function
  //     expect(hintLog.foundError).not.toHaveBeenCalled();
  //   });
  // });

  // Creating a proxy at the same time as element creation returns null.
  // The proxy strategy was found to be logistically unfeasible because of
  // limited browser support before this test was made to pass.
  // describe('patchCreation()', function() {
  //   it('should provide a proxy when elements are created', function() {
  //     domInterceptor.patchCreation();
  //     var test = document.createElement('div');
  //     expect(function(){
  //       document.body.appendChild(test);
  //     }).not.toThrow();
  //     test.innerHTML = 'new html';
  //     expect(hintLog.foundError).toHaveBeenCalled();
  //   });
  // });
});

