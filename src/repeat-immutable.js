/* global immutableModule */

/**
 * @ngdoc directive
 * @name immutable.directive:repeatImmutable
 *
 * @description
 * `repeatImmutable` instantiates a template for each item in an `Immutable`
 * collection. The `Immutable` collection is converted to an `Immutable.List`
 * before iteration to guarantee items are rendered in the exact order in which
 * they would be iterated.
 *
 * # Change Detection
 *
 * `repeatImmutable` uses `$watchImmutable()`
 * to track changes to the collection. This ensures that, for example, computed
 * properties which always return a new `Immutable` collection will not cause
 * an infinite digest error.
 *
 * # Tracking
 *
 * Every element in the list is assigned a non-writable, non-enumerable key
 * named `$$repeatImmutableKey` in order to track which elements should be added
 * or removed from the DOM. A `trackBy` option is planned in future iterations.
 *
 * # Example
 *
 * ```html
 * <ul ng-controller="ExampleController">
 *     <li repeat-immutable="item in items">{{item}}</li>
 * </ul>
 * ```
 *
 * ```js
 * app.controller('ExampleController', function ($scope) {
 *    $scope.items = Immutable.List([
 *        'one',
 *        'two',
 *        'three'
 *    ]);
 * });
 * ```
 * @param {string} repeatImmutable - The expression indicating how to enumerate
 *     the collection. Unlike `ngRepeat`, the only expression format is
 *     `"variable in expression"`.
 * @scope
 * @priority 100
 */
immutableModule.directive('repeatImmutable', function createRepeatImmutableDirective() {

    const EXPRESSION_REGEX = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)$/;

    /**
     * Generates a string of 4 random hex characters
     */
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
    }

    /**
     * Generates a key which consists of "$$repeatImmutable:object:" followed by
     * a GUID and attaches that id to the object as a non-writable,
     * non-enumerable property named "$$repeatImmutableKey"
     * @param {Object|Array} obj - the object to identify
     * @returns {string} the id generated for the object
     */
    function generateObjectId(obj) {

        if (!angular.isUndefined(obj.$$repeatImmutableKey)) {
            return obj.$$repeatImmutableKey;
        }

        const id = `$$repeatImmutable:object:${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;

        Object.defineProperty(obj, '$$repeatImmutableKey', {
            value: id
        });

        return id;
    }

    /**
     * Generates a key which consists of "$$repeatImmutable:primitive:" followed
     * by the value itself
     * @param {string|boolean|number|null|undefined} value - the value to identify
     * @returns {string} the id generated for the value
     */
    function generatePrimitiveId(value) {
        return `$$repeatImmutable:primitive${value}`;
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

        // IMPORTANT: needs to be less than the priority for other built-in
        // element-transcluded directives
        priority: 100,

        compile: function compileRepeatImmutable($element, $attr) {

            const expression = $attr.repeatImmutable;

            const expressionMatches = expression.match(EXPRESSION_REGEX);

            if (!expressionMatches) {
                throw new Error('expression must be of the form "item in collection"');
            }

            // the item identifier appears to the left of "in"
            const itemIdentifier = expressionMatches[1];

            // the collection identifier appears to the right of "in"
            const collectionIdentifier = expressionMatches[2];

            return function linkRepeatImmutable($scope, $element, $attr, controller, $transclude) {

                // A mapping of unique identifiers for values to the elements to
                // which they are rendered
                let elements = Immutable.OrderedMap();

                // The set of all keys for which an element currently exists.
                // Used for determining which elements can be removed after each
                // iteration
                let currentItemKeys = Immutable.Set();

                function destroyElementForItem(key) {

                    const element = elements.get(key);

                    // first trash the scope
                    element.scope().$destroy();

                    // then trash the element
                    element.remove();

                    // remove the item from the elements map.
                    // it seems dangerous to remove from a map while
                    // iterating it, but it's totally cool because of the
                    // whole immutability thing ;)
                    elements = elements.delete(key);
                }

                $scope.$watchImmutable(collectionIdentifier, function repeateImmutableAction(collection) {

                    // It's okay if the collection isn't specified yet, we can
                    // just work on a new list. But if the collection is defined
                    // and it is not something we can convert to an Immutable.List,
                    // throw an error to alert the user that they've used the
                    // directive incorrectly.
                    if (collection && !Immutable.List.isList(collection) && !collection.toList) {
                        throw new Error('repeatImmutable: iterated item must be an instance of an Immutable collection');
                    }

                    // we always want to work with Immutable.Lists so we can
                    // ensure elements are transcluded in the order in which
                    // they appear in the collection
                    const collectionList = collection ? (Immutable.List.isList(collection) ? collection : collection.toList()) : Immutable.List();

                    // start at the initial transclusion comment
                    let $previous = $element;

                    // Clear out the currentItemKeys set to start over tracking
                    // which elements should be kept
                    currentItemKeys = currentItemKeys.clear();

                    // Iterate and do stuff
                    collectionList.forEach(function(item, index) {

                        // Get the key for the current item, creating it if necessary
                        const itemKey = retrieveItemKey(item);

                        // Check that the item has not already been rendered
                        if (currentItemKeys.has(itemKey)) {
                            throw new Error('Duplicate items are not currently allowed in repeatImmutable');
                        }

                        // Track the item key
                        currentItemKeys = currentItemKeys.add(itemKey);

                        // If the item's key is already in the set of rendered
                        // elements, return and do not transclude a new element
                        // for this item
                        if (elements.has(itemKey)) {
                            if (elements.keySeq().indexOf(itemKey) === index) {
                                return;
                            }

                            destroyElementForItem(itemKey);
                        }

                        if (index !== 0) {
                            const previousItem = collectionList.get(index - 1);
                            const previousItemKey = retrieveItemKey(previousItem);
                            if (elements.has(previousItemKey)) {
                                $previous = elements.get(previousItemKey);
                            }
                        }

                        // create a cloned element and scope for the new item
                        $transclude(function(clone, scope) {

                            // track the element in the set of existing elements
                            elements = elements.delete(itemKey).set(itemKey, clone);

                            // inject the repeated item onto element's scope
                            scope[itemIdentifier] = item;

                            // inject the current element into the DOM after $previous
                            // and move $previous forward
                            $previous.after(clone);
                            $previous = clone;
                        });
                    });

                    // iterate the keys for the tracked elements and remove those
                    // that are not in the current set of included keys
                    elements.forEach(function(element, key) {

                        // if the element is still in the list, leave it alone
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
