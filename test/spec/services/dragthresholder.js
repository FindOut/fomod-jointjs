'use strict';

describe('Service: dragThresholder', function () {

  // load the service's module
  beforeEach(module('fomodApp'));

  // instantiate service
  var dragThresholder;
  beforeEach(inject(function (_dragThresholder_) {
    dragThresholder = _dragThresholder_;
  }));

  it('should do something', function () {
    expect(!!dragThresholder).toBe(true);
  });

});
