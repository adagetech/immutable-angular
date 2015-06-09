(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular', 'immutable'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(require('angular'), require('immutable'));
    } else {
        factory(global.angular, global.Immutable);
    }
})(this, function (angular, Immutable) {
