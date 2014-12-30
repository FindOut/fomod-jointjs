'use strict';

describe('Service: CustomElementLink', function () {

  // load the service's module
  beforeEach(module('fomodApp'));

  // instantiate service
  var CustomElementLink;
  beforeEach(inject(function (_CustomElementLink_) {
    CustomElementLink = _CustomElementLink_;
  }));

  it('should do something', function () {
    expect(!!CustomElementLink).toBe(true);
  });

});
