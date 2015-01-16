'use strict';

describe('Service: paletteManager', function () {

  // load the service's module
  beforeEach(module('fomodApp'));

  // instantiate service
  var paletteManager;
  beforeEach(inject(function (_paletteManager_) {
    paletteManager = _paletteManager_;
  }));

  it('should do something', function () {
    expect(!!paletteManager).toBe(true);
  });

});
