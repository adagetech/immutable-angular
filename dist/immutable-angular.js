(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular', 'immutable'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(require('angular'), require('immutable'));
    } else {
        factory(global.angular, global.Immutable);
    }
})(this, function (angular, Immutable) {

'use strict';

var immutableModule = angular.module('immutable-angular', []);
'use strict';

immutableModule.directive('repeatImmutable', function createRepeatImmutableDirective() {

    var EXPRESSION_REGEX = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)$/;

    function s4() {
        return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
    }

    function generateObjectId(obj) {

        if (!angular.isUndefined(obj.$$repeatImmutableKey)) {
            return obj.$$repeatImmutableKey;
        }

        var id = '$$repeatImmutable:object:' + s4() + '' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '' + s4() + '' + s4();

        Object.defineProperty(obj, '$$repeatImmutableKey', {
            value: id
        });

        return id;
    }

    function generatePrimitiveId(value) {
        return '$$repeatImmutable:primitive' + value;
    }

    function objectIsPrimitive(value) {
        return !angular.isObject(value) && !angular.isArray(value);
    }

    function retrieveItemKey(value) {
        if (objectIsPrimitive(value)) {
            return generatePrimitiveId(value);
        }

        return generateObjectId(value);
    }

    return {
        restrict: 'A',
        transclude: 'element',

        priority: 100,

        compile: function compileRepeatImmutable($element, $attr) {

            var expression = $attr.repeatImmutable;

            var expressionMatches = expression.match(EXPRESSION_REGEX);

            if (!expressionMatches) {
                throw new Error('expression must be of the form "item in collection"');
            }

            var itemIdentifier = expressionMatches[1];

            var collectionIdentifier = expressionMatches[2];

            return function linkRepeatImmutable($scope, $element, $attr, controller, $transclude) {
                var elements = Immutable.OrderedMap();

                var currentItemKeys = Immutable.Set();

                function destroyElementForItem(key) {

                    var element = elements.get(key);

                    element.scope().$destroy();

                    element.remove();

                    elements = elements['delete'](key);
                }

                $scope.$watchImmutable(collectionIdentifier, function repeateImmutableAction(collection) {
                    if (collection && !Immutable.List.isList(collection) && !collection.toList) {
                        throw new Error('repeatImmutable: iterated item must be an instance of an Immutable collection');
                    }

                    var collectionList = collection ? Immutable.List.isList(collection) ? collection : collection.toList() : Immutable.List();

                    var $previous = $element;

                    currentItemKeys = currentItemKeys.clear();

                    collectionList.forEach(function (item, index) {
                        var itemKey = retrieveItemKey(item);

                        if (currentItemKeys.has(itemKey)) {
                            throw new Error('Duplicate items are not currently allowed in repeatImmutable');
                        }

                        currentItemKeys = currentItemKeys.add(itemKey);

                        if (elements.has(itemKey)) {
                            if (elements.keySeq().indexOf(itemKey) === index) {
                                return;
                            }

                            destroyElementForItem(itemKey);
                        }

                        if (index !== 0) {
                            var previousItem = collectionList.get(index - 1);
                            var previousItemKey = retrieveItemKey(previousItem);
                            if (elements.has(previousItemKey)) {
                                $previous = elements.get(previousItemKey);
                            }
                        }

                        $transclude(function (clone, scope) {
                            elements = elements['delete'](itemKey).set(itemKey, clone);

                            scope[itemIdentifier] = item;

                            $previous.after(clone);
                            $previous = clone;
                        });
                    });

                    elements.forEach(function (element, key) {
                        if (currentItemKeys.has(key)) {
                            return;
                        }

                        destroyElementForItem(key);
                    });
                });
            };
        }
    };
});
'use strict';

immutableModule.config(['$provide', function configureWatchImmutable($provide) {
    $provide.decorator('$rootScope', ['$delegate', '$parse', function ($delegate, $parse) {
        var NO_VALUE = {};

        $delegate.constructor.prototype.$watchImmutable = function watchImmutable(watchExpression, listener) {
            var _this = this;

            var getValue = $parse(watchExpression);

            var currentValue = NO_VALUE;

            this.$watch(function () {
                var latestValue = getValue(_this);

                if (!Immutable.is(latestValue, currentValue)) {
                    currentValue = latestValue;
                }

                return currentValue;
            }, listener);
        };

        return $delegate;
    }]);
}]);
});
