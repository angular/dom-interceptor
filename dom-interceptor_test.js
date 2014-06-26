describe('domInterceptor', function() {
  beforeEach(function() {
    domInterceptor.callListenerWithMessage = jasmine.createSpy('callListenerWithMessage');
  });

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
          var testElement = document.createElement('div');
          testElement.setAttribute('id', 'test');
          document.body.appendChild(testElement);
          domInterceptor.patchExistingElements();
          testElement.innerHTML = 'new innerHTML value';
          //Counts once for getting innerHTML, once for setting
          expect(domInterceptor.callListenerWithMessage.callCount).toBe(2);
          domInterceptor.unpatchExistingElements();
      });
  });

  describe('patchProperties()', function() {
    it('should patch target properties of created HTML objects', function() {
      var testProperty = 'innerHTML';
      var element = document.createElement('a');
      var copy = element;
      domInterceptor.patchElementProperties(element);
      expect(domInterceptor.callListenerWithMessage).not.toHaveBeenCalled();
      element.innerHTML = 'new innerHTML value';
      expect(domInterceptor.callListenerWithMessage.callCount).toBe(2);
      domInterceptor.unpatchElementProperties(element, copy);
    });


    it('should not preserve the functionality of DOM APIS that are patched on individual elements', function() {
      var element = document.createElement('a');
      var copy = element;
      expect(element.innerHTML).toBe('');
      domInterceptor.patchElementProperties(element);
      element.innerHTML = 'Testing Value';
      expect(element.innerHTML).toBe('');
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      domInterceptor.unpatchElementProperties(element, copy);
    });
  });

  describe('unpatchExistingElements()', function() {
      it('should return existing elements to their before patch state', function() {
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
          expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();

          domInterceptor.unpatchExistingElements();

          expect(document.getElementById('testNew').innerHTML).toBe('testing html');
          expect(document.getElementById('test2').innerHTML).toBe('different html');
      });
  });
  describe('unpatchElementProperties()', function() {
    it('should unpatch target properties patched on HTML objects', function() {
      var element = document.createElement('a');
      expect(element.innerHTML).toBe('');
      domInterceptor.patchElementProperties(element);
      expect(element.innerHTML).toBe('');
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      var originalElementProperties = {
          'innerHTML': '',
          'parentElement': ''
      }
      domInterceptor.unpatchElementProperties(element, originalElementProperties);

      domInterceptor.callListenerWithMessage.reset();
      expect(element.innerHTML).toBe('');
      expect(domInterceptor.callListenerWithMessage).not.toHaveBeenCalled();
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
    it('should patch existing DOM elements', function() {
      spyOn(domInterceptor, 'patchExistingElements');
      expect(domInterceptor.patchExistingElements).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.callListenerWithMessage);
      expect(domInterceptor.patchExistingElements).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Element.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.callListenerWithMessage);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Element);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Node.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.callListenerWithMessage);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Node);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of EventTarget.prototype', function() {
      spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.callListenerWithMessage);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(EventTarget);
      domInterceptor.removeManipulationListener();
    });


    it('should patch the functions of Document.prototype', function() {
     spyOn(domInterceptor, 'patchOnePrototype');
      expect(domInterceptor.patchOnePrototype).not.toHaveBeenCalled();
      domInterceptor.addManipulationListener(domInterceptor.callListenerWithMessage);
      expect(domInterceptor.patchOnePrototype).toHaveBeenCalledWith(Document);
      domInterceptor.removeManipulationListener();
    });


    it('should create a listener that conforms to the users default parameters', function() {
      spyOn(domInterceptor, 'setListenerDefaults');
      domInterceptor.addManipulationListener(true, true, true, true);
      expect(domInterceptor.setListenerDefaults).toHaveBeenCalledWith(true, true, true, true);
      domInterceptor.removeManipulationListener();
    });


    it('should detect getting element.innerHTML', function() {
      var testElement = document.createElement('div');
      domInterceptor.addManipulationListener();
      var inner = testElement.innerHTML;
      //expect(domInterceptor.callListenerWithMessage.callCount).toBe(1);
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect setting element.innerHTML', function() {
      var element = document.createElement('div');
      domInterceptor.addManipulationListener();
      element.innerHTML = 'blank';
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect getting element.parentElement', function() {
      var element = document.createElement('div');
      domInterceptor.addManipulationListener();
      var parent = element.parentElement;
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect calling element.addEventListener', function() {
      domInterceptor.addManipulationListener();
      var element = document.createElement('div');
      var parent = element.addEventListener('click', function(e){});
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect calling element.remove', function() {
      domInterceptor.addManipulationListener();
      var element = document.createElement('div');
      element.remove();
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect calling element.insertBefore', function() {
      var parentElement = document.createElement('div');
      var referenceElement = document.createElement('div');
      parentElement.appendChild(referenceElement);
      domInterceptor.addManipulationListener();
      var newElement = document.createElement('div');
      parentElement.insertBefore(newElement, referenceElement);
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });


    it('should detect calling element.appendChild', function() {
      var parentElement = document.createElement('div');
      var childElement = document.createElement('div');
      domInterceptor.addManipulationListener();
      parentElement.appendChild(childElement);
      expect(domInterceptor.callListenerWithMessage).toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
    });
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


    it('should remove the patch from all DOM elements', function() {
      spyOn(domInterceptor, 'unpatchOnePrototype');
      spyOn(domInterceptor, 'unpatchExistingElements');
      expect(domInterceptor.unpatchExistingElements).not.toHaveBeenCalled();
      domInterceptor.removeManipulationListener();
      expect(domInterceptor.unpatchExistingElements).toHaveBeenCalled();
    });
  });

  describe('listener properties', function() {
    beforeEach(function() {
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
    });

    it('should throw an error if loudError default is set', function() {
      domInterceptor.setListenerDefaults(true, false, false, true);
      expect(function() {
        domInterceptor.callListenerWithMessage({message: 'A message:', property: 'A property'});
      }).toThrow();
    });


    it('should pause the debugger if the debugBreak parameter is set', function() {
      domInterceptor.setListenerDefaults(false, true, false, true);
      expect(domInterceptor.debugBreak).toEqual(true);
    });


    it('should only log the property if the propOnly parameter is set', function() {
      domInterceptor.setListenerDefaults(false, false, true, true);
      console.log = jasmine.createSpy('log');
      domInterceptor.callListenerWithMessage({message: 'A message:', property: 'A property'});
      expect(console.log).toHaveBeenCalledWith('A property');
    });


    it('should log a message to the console as the default', function() {
      domInterceptor.setListenerDefaults(false, false, false);
      console.log = jasmine.createSpy('log');
      domInterceptor.callListenerWithMessage({message: 'A message:', property: 'A property'});
      expect(console.log).toHaveBeenCalledWith('A message: A property');
    });
  });
});

