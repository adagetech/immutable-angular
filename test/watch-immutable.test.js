describe('Scope#$watchImmutable', function () {

    beforeEach(angular.mock.module('immutable-angular'));

    var $rootScope, list, callback;

    function getList() { return list; }

    beforeEach(angular.mock.inject(function ($injector) {
        $rootScope = $injector.get('$rootScope');
        callback = sinon.spy();
        list = Immutable.List([1, 2, 3]);
        $rootScope.$watchImmutable(getList, callback);
        $rootScope.$digest();
    }));

    it('should create the $watchImmutable function', function () {
        $rootScope.$watchImmutable.should.exist;
    });

    it('should not trigger when the structure of an Immutable has not changed', function () {

        $rootScope.$apply(function () {
            list = Immutable.List([1, 2, 3]);
        });

        // angular always calls watch listeners at least once at startup
        callback.should.have.been.calledOnce;
    });

    it('should trigger a callback only when the structure of an Immutable has changed', function () {

        $rootScope.$apply(function () {
            list = Immutable.List([2, 4]);
        });

        callback.should.have.been.calledTwice;
    });
});
