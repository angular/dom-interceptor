describe('domInterceptor', function() {
  beforeEach(function() {
    domInterceptor.listener = jasmine.createSpy('listener');
  });

  describe('collectPrototypeProperties()', function() {
    it('should collect the unpatched properties of prototypes', function() {
      var objectPropertyNames = Object.getOwnPropertyNames(Element.prototype);
      var originalProperties = domInterceptor.collectPrototypeProperties(Element);
      expect(originalProperties[objectPropertyNames[0]]).toBe(Element.prototype[objectPropertyNames[0]]);
    });

    it('should throw if type.prototype is undefined', function() {
      expect(function() {
          domInterceptor.collectPrototypeProperties(document.body);
      }).toThrow('collectPrototypeProperties() needs a .prototype to collect properties from. [object HTMLBodyElement].prototype is undefined.');
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
          var testElement = document.createElement('div');
          testElement.setAttribute('id', 'test');
          document.body.appendChild(testElement);
          var testProperty = 'innerHTML';
          domInterceptor.patchExistingElements(domInterceptor.listener);
          testElement[testProperty] = 'new innerHTML value';
          expect(domInterceptor.listener).toHaveBeenCalled();
          domInterceptor.unpatchExistingElements();
      });
  });

  describe('patchProperties()', function() {
    it('should patch target properties of created HTML objects', function() {
      var testProperty = 'innerHTML';
      var element = document.createElement('a');
      var copy = element;
      domInterceptor.patchElementProperties(element, domInterceptor.listener);
      expect(domInterceptor.listener).not.toHaveBeenCalled();
      element.innerHTML = 'new innerHTML value';
      expect(domInterceptor.listener).toHaveBeenCalled();
      domInterceptor.unpatchElementProperties(element, copy);
    });


    it('should not preserve the functionality of DOM APIS that are patched on individual elements', function() {
      var element = document.createElement('a');
      var copy = element;
      expect(element.innerHTML).toBe('');
      domInterceptor.patchElementProperties(element, domInterceptor.listener);
      element.innerHTML = 'Testing Value';
      expect(element.innerHTML).toBe('');
      expect(domInterceptor.listener).toHaveBeenCalled();
      domInterceptor.unpatchElementProperties(element, copy);
    });
  });
  describe('unpatchExistingElements()', function() {
      it('should patch existing elements to protect from manipulation', function() {
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


          domInterceptor.patchExistingElements(domInterceptor.listener);

          expect(testElement.innerHTML).toBe('testing html');
          expect(document.getElementById('testNew').innerHTML).toBe('testing html');
          expect(domInterceptor.listener).toHaveBeenCalled();

          domInterceptor.unpatchExistingElements();

          expect(document.getElementById('testNew').innerHTML).toBe('testing html');
          expect(document.getElementById('test2').innerHTML).toBe('different html');
      });
  });
  describe('unpatchElementProperties()', function() {
    it('should unpatch target properties patched on HTML objects', function() {
      var element = document.createElement('a');
      expect(element.innerHTML).toBe('');
      domInterceptor.patchElementProperties(element, domInterceptor.listener);
      expect(element.innerHTML).toBe('');
      expect(domInterceptor.listener).toHaveBeenCalled();
      var originalElementProperties = {
          'innerHTML': '',
          'parentElement': ''
      }
      domInterceptor.unpatchElementProperties(element, originalElementProperties);

      domInterceptor.listener.reset();
      expect(element.innerHTML).toBe('');
      expect(domInterceptor.listener).not.toHaveBeenCalled();
    });
  });
  describe('patchOnePrototype()', function() {
      it('should patch all properties of a given object .prototype', function() {
        var objectProperties = Object.getOwnPropertyNames(Element.prototype);
        var testProperty = objectProperties[0];
        var originalFunction = Element.prototype[testProperty];
        expect(Element.prototype[testProperty]).toBe(originalFunction);
        domInterceptor.patchOnePrototype(Element);
        expect(Element.prototype[testProperty]).not.toBe(originalFunction);
        domInterceptor.unpatchOnePrototype(Element, 'Element');
      });


      it('should patch all properties of a given object .prototype with a specified function',
        function() {
          var objectProperties = Object.getOwnPropertyNames(Element.prototype);
          var testProperty = objectProperties[0];
          var testObject = {};
          testObject.exampleFunction = function() {};
          spyOn(testObject, 'exampleFunction');
          var originalFunction = Element.prototype[testProperty];
          expect(Element.prototype[testProperty]).toBe(originalFunction);
          domInterceptor.patchOnePrototype(Element, testObject.exampleFunction);
          var elem = document.createElement('div');
          elem.setAttribute('id', 'test');
          expect(Element.prototype[testProperty]).not.toBe(originalFunction);
          expect(testObject.exampleFunction).toHaveBeenCalled();
          domInterceptor.unpatchOnePrototype(Element, 'Element');
      });


      it('should patch .prototype with a default listener if none is provided', function() {
        var objectProperties = Object.getOwnPropertyNames(Element.prototype);
        var testProperty = objectProperties[0];

        var originalFunction = Element.prototype[testProperty];
        expect(Element.prototype[testProperty]).toBe(originalFunction);
        domInterceptor.patchOnePrototype(Element);
        var elem = document.createElement('div');
        elem.setAttribute('id', 'test');
        expect(Element.prototype[testProperty]).not.toBe(originalFunction);
        expect(domInterceptor.listener).toHaveBeenCalled();
        domInterceptor.unpatchOnePrototype(Element, 'Element');
      });
  });
  describe('addManipulationListener()', function() {
    it('should patch existing DOM elements', function() {
      spyOn(domInterceptor, 'patchExistingElements');
      expect(domInterceptor.patchExistingElements).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.listener);
      expect(domInterceptor.patchExistingElements).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Element.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.listener);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Element);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Node.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.listener);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Node);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of EventTarget.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.listener);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(EventTarget);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Document.prototype', function() {
     spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.listener);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Document);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the prototype functions to call the listener param', function() {
      var testFunctionObject = {};
      testFunctionObject.testingFunction = function(){
          return 'DOM manipulation detected';
      }
      spyOn(testFunctionObject, 'testingFunction');
      expect(testFunctionObject.testingFunction).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(testFunctionObject.testingFunction);
      var element = document.createElement('a');
      element.getAttribute('NamedNodeMap');
      expect(testFunctionObject.testingFunction).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect getting element.innerHTML', function() {
      var testObj2 = {};
      testObj2.testFunction = function(){};
      spyOn(testObj2, 'testFunction');
      expect(testObj2.testFunction).not.toHaveBeenCalled();
      var element = document.createElement('div');
      domInterceptor.patchElementProperties(element, testObj2.testFunction);
      var inner = element['innerHTML'];
      expect(testObj2.testFunction).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect setting element.innerHTML', function() {
      var testObj3 = {};
      testObj3.testFunction = function(){};
      spyOn(testObj3, 'testFunction');
      expect(testObj3.testFunction).not.toHaveBeenCalled();
      var element = document.createElement('div');
      domInterceptor.patchElementProperties(element, testObj3.testFunction);
      element.innerHTML = 'blank';
      expect(testObj3.testFunction).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect getting element.parentElement', function() {
      var testObj4 = {};
      testObj4.testFunction = function(){};
      spyOn(testObj4, 'testFunction');
      expect(testObj4.testFunction).not.toHaveBeenCalled();
      var element = document.createElement('div');
      domInterceptor.patchElementProperties(element, testObj4.testFunction);
      var parent = element.parentElement;
      expect(testObj4.testFunction).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect calling element.addEventListener', function() {
      var testObj5 = {};
      testObj5.testFunction = function(){};
      spyOn(testObj5, 'testFunction');
      domInterceptor.addManipulationListener(testObj5.testFunction);
      expect(testObj5.testFunction).not.toHaveBeenCalled();
      var element = document.createElement('div');
      var parent = element.addEventListener('click', function(e){});
      expect(testObj5.testFunction).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect calling element.remove', function() {
      var testObj6 = {};
      testObj6.testFunction = function(){};
      spyOn(testObj6, 'testFunction');
      domInterceptor.addManipulationListener(testObj6.testFunction);
      expect(testObj6.testFunction).not.toHaveBeenCalled();
      var element = document.createElement('div');
      element.remove();
      expect(testObj6.testFunction).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect calling element.insertBefore', function() {
      var parentElement = document.createElement('div');
      var referenceElement = document.createElement('div');
      parentElement.appendChild(referenceElement);
      var testObj7 = {};
      testObj7.testFunction = function(){};
      spyOn(testObj7, 'testFunction');
      domInterceptor.addManipulationListener(testObj7.testFunction);
      expect(testObj7.testFunction).not.toHaveBeenCalled();
      var newElement = document.createElement('div');
      parentElement.insertBefore(newElement, referenceElement);
      expect(testObj7.testFunction).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect calling element.appendChild', function() {
      var parentElement = document.createElement('div');
      var childElement = document.createElement('div');
      var testObj8 = {};
      testObj8.testFunction = function(){
        return 'test function';
      };
      spyOn(testObj8, 'testFunction');
      domInterceptor.addManipulationListener(testObj8.testFunction);
      expect(testObj8.testFunction).not.toHaveBeenCalled();
      parentElement.appendChild(childElement);
      expect(testObj8.testFunction).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });
  });
  describe('unpatchOnePrototype()', function() {
    it('should unpatch the .prototype properties of the given parameter', function() {
      var mockObject = {};
      mockObject.testFunction = function(){};
      var objectProperties = Object.getOwnPropertyNames(Element.prototype);
      var testProperty = objectProperties[0];
      var originalFunction = Element.prototype[testProperty];
      expect(Element.prototype[testProperty]).toBe(originalFunction);
      domInterceptor.patchOnePrototype(Element, mockObject.testFunction);
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


    it('should remove the patch from functions on EventTarget.prototype', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(EventTarget, 'EventTarget');
    });


    it('should remove the patch from functions on Document.prototype', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      expect(domInterceptor.unpatchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchOnePrototype).toHaveBeenCalledWith(Document, 'Document');
    });


    it('should remove the patch from all DOM elements', function() {
      spyOn(domInterceptor, 'unpatchExistingElements');
      expect(domInterceptor.unpatchExistingElements).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchExistingElements).toHaveBeenCalled();
    });
  });

  describe('setListener()', function() {
    it('should set the listener function to a parameter', function() {
      var newListener = function () {
        return 'This is a new listener for controller manipulations.';
      }
      expect(domInterceptor.listener).not.toBe(newListener);
      domInterceptor.setListener(newListener);
      expect(domInterceptor.listener).toBe(newListener);
    });


    it('should throw if provided an invalid parameter', function() {
      expect(function() {
        domInterceptor.setListener('This is a listener');
      }).toThrow('listener must be a function, got: string');
    });


    it('should default to the current listener if no parameter is provided', function() {
      var originalListener = domInterceptor.listener;
      domInterceptor.setListener();
      expect(originalListener).toBe(domInterceptor.listener);
    });


    it('should be harmless if called when no manipulation listener has been added', function() {
      expect(function() {
        domInterceptor.removeManipulationListener();
      }).not.toThrow();
    });
  });
});
