'use strict';

describe('Directive: sortable', function () {

  // load the directive's module
  beforeEach(module('fomodApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<sortable></sortable>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the sortable directive');
  }));
});
