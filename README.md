# immutable-angular
Support for watching and enumerating [immutable-js](https://github.com/facebook/immutable-js) collections in Angular 1.x

[![Build Status](https://travis-ci.org/Adage-Technologies/immutable-angular.svg)](https://travis-ci.org/Adage-Technologies/immutable-angular)

## Getting started

1. Install `immutable-angular` using npm or jspm
    ```
    npm install immutable-angular
    ```
    ```
    jspm install npm:immutable-angular
    ```

2. Include the `'immutable'` module as a dependency of your module
    ```javascript
    import 'immutable-angular';

    angular.module('myModule', ['immutable-angular']);
    ```

3. Iterate over and watch Immutable structures
    ```javascript
    import Immutable from 'immutable';

    class SomethingController {

        static get $inject() { return ['$scope']; }

        constructor($scope) {
            this.list = Immutable.List([1, 2, 3]);
            $scope.$watchImmutable(() => this.list, () => this.listChanged());
        }

        listChanged() {
            // ...
        }
    }
    ```
    ```html
    <ul>
        <li repeat-immutable="item in something.list">{{item}}</li>
    </ul>
    ```

## How it works

### $watchImmutable()
```typescript
$watchImmutable(watchExpression: function | string, listener: function)
```
`$watchImmutable` allows for the watching of Immutable data structures with
dirty checking based on the `Immutable.is()` function. It will compile
`watchExpression` to a getter and then delegate to the original `$watch()`
using a wrapper getter which only returns a new result if `Immutable.is()`
reports a change in the value.

[Source](./src/watch-immutable.js)

### repeat-immutable
`repeat-immutable` currently only supports basic iteration syntax:
```html
<li repeat-immutable="item in list">...</li>
```
although more complex configuration will likely be introduced as needs arise.
`repeat-immutable` will track object values by attaching a non-enumerable,
non-writable GUID identifier. Objects with the same structure are permitted, as
they will be assigned different identifiers. Including the same object reference
multiple times in a single list is currently not allowed as it will marked as
handled on each iteration pass at the first reference. Similarly, primitive
values are tracked by identity and therefore repeated values are not allowed.

[Source](./src/repeat-immutable.js)

## Motivation
Angular's `ng-repeat` directive is not capable of iterating data structures
which are not plain arrays or objects. Furthermore, `ng-repeat` uses the
`$watchCollection()` function which sets up watchers not only for the collection
but also for each item in the collection in case the collection is mutated. In
the case that our collections are immutable, we should only be watching for
changes to the reference to the collection itself. Additionally, we should not
be converting to plain JS objects every time we need to re-render as Immutable
data structures are easily iterable on their own.

## Development
Install gulp globally
```
npm install -g gulp
```

To bundle sources to the dist directory:
```
gulp bundle
```

To run tests and linting:
```
gulp test
```

To generate API documentation:
```
gulp docs
```
