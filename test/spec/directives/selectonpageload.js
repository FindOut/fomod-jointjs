'use strict';

describe('Directive: selectOnPageLoad', function () {

  // load the directive's module
  beforeEach(module('fomodApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<select-on-page-load></select-on-page-load>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the selectOnPageLoad directive');
  }));
});
