'use strict';

describe('Service: mapper', function () {

  // load the service's module
  beforeEach(module('fomodApp'));

  // instantiate service
  var mapper;
  beforeEach(inject(function (_mapper_) {
    mapper = _mapper_;
  }));

  it('should do something', function () {
    expect(!!mapper).toBe(true);
  });

});
