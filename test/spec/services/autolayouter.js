'use strict';

describe('Service: AutoLayouter', function () {

  // load the service's module
  beforeEach(module('fomodApp'));

  // instantiate service
  var AutoLayouter;
  beforeEach(inject(function (_AutoLayouter_) {
    AutoLayouter = _AutoLayouter_;
  }));

  it('should do something', function () {
    expect(!!AutoLayouter).toBe(true);
  });

});
