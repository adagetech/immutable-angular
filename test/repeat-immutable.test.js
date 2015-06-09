describe('repeatImmutable', function () {

    var $compile, scope;

    var people = [{
        name: 'Luke'
    }, {
        name: 'Ian'
    }];

    beforeEach(angular.mock.module('immutable-angular'));

    beforeEach(angular.mock.inject(function ($injector) {
        $compile = $injector.get('$compile');
        scope = $injector.get('$rootScope').$new();
    }));

    it('should repeat an element for every item in the specified property', function () {

        scope.items = Immutable.List(people);
        scope.$digest();
        var element = $compile('<div><span repeat-immutable="item in items">{{item.name}};</span></div>')(scope);
        scope.$digest();

        element.text().should.equal('Luke;Ian;');
    });

    it('should recognize when items have already been rendered and only render new elements', function () {

        scope.items = Immutable.List(people);
        scope.$digest();
        var element = $compile('<div><span repeat-immutable="item in items">{{item.name}};</span></div>')(scope);
        scope.$digest();

        scope.items = Immutable.List(people.concat({ name: 'Emily' }));

        scope.$digest();

        element.text().should.equal('Luke;Ian;Emily;');
    });

    it('should work with primitives', function () {

        scope.items = Immutable.List([1, 2, 3]);
        scope.$digest();
        var element = $compile('<div><span repeat-immutable="item in items">{{item}};</span></div>')(scope);
        scope.$digest();

        element.text().should.equal('1;2;3;');
    });


    it('should render a re-sorted list in the correct order', function () {

        scope.items = Immutable.List(people);
        scope.$digest();
        var element = $compile('<div><span repeat-immutable="item in items">{{item.name}};</span></div>')(scope);
        scope.$digest();

        scope.items = scope.items.reverse();

        scope.$digest();

        element.text().should.equal('Ian;Luke;');
    });
});
