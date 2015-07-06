'use strict';

describe('Service: graphd3', function () {

  // load the service's module
  beforeEach(module('fomodApp'));

  // instantiate service
  var graphd3;
  beforeEach(inject(function (_graphd3_) {
    graphd3 = _graphd3_;
  }));

  it('should do something', function () {
    expect(!!graphd3).toBe(true);
  });

});
