/* global immutableModule */

/**
 * @ngdoc overview
 * @name ng
 */
immutableModule.config(['$provide', function configureWatchImmutable($provide) {

    /**
     * @ngdoc service
     * @name ng.$rootScope
     */
    $provide.decorator('$rootScope', ['$delegate', '$parse', function($delegate, $parse) {

        // create a unique value to track when values actually change from the
        // default state
        const NO_VALUE = {};

        /**
         * @ngdoc method
         * @name ng.$rootScope#$watchImmutable
         * @kind function
         * @methodOf ng.$rootScope
         *
         * @description
         * Registers a `listener` to be executed whenever the `watchExpression` changes
         * according to `Immutable.is()`
         *
         * @param {(function()|string)} watchExpression Expression that is evaluated on
         *     $digest cycle. If the returned value is a different Immutable structure
         *     than the one previously returned, the `listener` will be fired.
         * @param {function (newVal, oldVal, scope)} listener Callback called whenever
         *     the value of `watchExpression` changes according to `Immutable.is()`
         */
        $delegate.constructor.prototype.$watchImmutable = function watchImmutable(watchExpression, listener) {

            // use the $parse service to generate a getter function that will
            // return the value referenced by the watched function or expression
            const getValue = $parse(watchExpression);

            // start off with no value
            let currentValue = NO_VALUE;

            // delegate to the original $watch to handle the machinery of
            // actually watching a value and triggering digests
            this.$watch(() => {

                // retrieve the latest value of the expression
                const latestValue = getValue(this);

                // compare latest against current and update current if the two
                // values are different according to Immutable.is()
                if (!Immutable.is(latestValue, currentValue)) {
                    currentValue = latestValue;
                }

                // return currentValue so that $watch can use reference equality
                // to evaluate whether a change has occured
                return currentValue;
            }, listener);
        };

        return $delegate;
    }]);
}]);
