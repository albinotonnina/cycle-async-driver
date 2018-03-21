"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var makeDriverSource_1 = require("./makeDriverSource");
var isFunction = function (f) { return typeof f === 'function'; };
var makeAsyncDriver = function (options) {
    var getResponse = options.getResponse, getProgressiveResponse = options.getProgressiveResponse, _a = options.requestProp, requestProp = _a === void 0 ? 'request' : _a, normalizeRequest = options.normalizeRequest, _b = options.isolate, isolate = _b === void 0 ? true : _b, _c = options.isolateProp, isolateProp = _c === void 0 ? '_namespace' : _c, _d = options.isolateNormalize, isolateNormalize = _d === void 0 ? null : _d, _e = options.selectHelperName, selectHelperName = _e === void 0 ? 'select' : _e, _f = options.selectDefaultProp, selectDefaultProp = _f === void 0 ? 'category' : _f, _g = options.lazy, lazy = _g === void 0 ? false : _g;
    if (normalizeRequest && !isFunction(normalizeRequest)) {
        throw new Error("'normalize' option should be a function.");
    }
    if (normalizeRequest && !isolateNormalize) {
        isolateNormalize = normalizeRequest;
    }
    if (isFunction(options)) {
        getResponse = options;
    }
    if (!isFunction(getResponse) && !isFunction(getProgressiveResponse)) {
        throw new Error("'getResponse' param is method is required.");
    }
    return function (request$, runStreamAdapter) {
        if (!runStreamAdapter) {
            throw new Error("Stream adapter is required as second parameter");
        }
        var empty = function () { };
        var emptySubscribe = function (stream) {
            return runStreamAdapter.streamSubscribe((stream), {
                next: empty,
                error: empty,
                complete: empty
            });
        };
        var response$$ = runStreamAdapter.adapt({}, function (_, observer) {
            runStreamAdapter.streamSubscribe(request$, {
                next: function (request) {
                    var requestNormalized = normalizeRequest
                        ? normalizeRequest(request)
                        : request;
                    var isLazyRequest = typeof requestNormalized.lazy === 'boolean'
                        ? requestNormalized.lazy : lazy;
                    var response$ = runStreamAdapter.adapt({}, function (_, observer) {
                        var dispose;
                        var disposeCallback = function (_) { return dispose = _; };
                        if (getProgressiveResponse) {
                            var contextFreeObserver = {
                                next: observer.next.bind(observer),
                                error: observer.error.bind(observer),
                                complete: observer.complete.bind(observer)
                            };
                            getProgressiveResponse(requestNormalized, contextFreeObserver, disposeCallback);
                        }
                        else {
                            var callback_1 = function (err, result) {
                                if (err) {
                                    observer.error(err);
                                }
                                else {
                                    observer.next(result);
                                    observer.complete();
                                }
                            };
                            var res = getResponse(request, callback_1, disposeCallback);
                            if (res && isFunction(res.then)) {
                                res.then(function (result) { return callback_1(null, result); }, callback_1);
                            }
                        }
                        return function () {
                            isFunction(dispose) && dispose();
                        };
                    });
                    if (!isLazyRequest) {
                        response$ = runStreamAdapter.remember(response$);
                        emptySubscribe(response$);
                    }
                    if (requestProp) {
                        Object.defineProperty(response$, requestProp, {
                            value: requestNormalized,
                            writable: false
                        });
                    }
                    observer.next(response$);
                },
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer)
            });
        });
        response$$ = runStreamAdapter.remember(response$$);
        emptySubscribe(response$$);
        return makeDriverSource_1.default(response$$, {
            runStreamAdapter: runStreamAdapter,
            selectHelperName: selectHelperName,
            selectDefaultProp: selectDefaultProp,
            requestProp: requestProp,
            isolate: isolate,
            isolateProp: isolateProp,
            isolateNormalize: isolateNormalize
        });
    };
};
exports.default = makeAsyncDriver;
//# sourceMappingURL=makeAsyncDriver.js.map