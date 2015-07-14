'use strict';

describe('Service: manipulator', function () {

  // load the service's module
  beforeEach(module('fomodApp'));

  // instantiate service
  var manipulator;
  beforeEach(inject(function (_manipulator_) {
    manipulator = _manipulator_;
  }));

  it('should do something', function () {
    expect(!!manipulator).toBe(true);
  });

});
