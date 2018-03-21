"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var makeFilter = function (streamAdapter) {
    return function (stream, predicate) {
        return streamAdapter.adapt({}, function (_, observer) {
            return streamAdapter.streamSubscribe(stream, {
                next: function (r$) {
                    if (predicate(r$)) {
                        observer.next(r$);
                    }
                },
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer)
            });
        });
    };
};
var makeDriverSource = function (response$$, options) {
    var runStreamAdapter = options.runStreamAdapter, selectHelperName = options.selectHelperName, selectDefaultProp = options.selectDefaultProp, requestProp = options.requestProp, isolate = options.isolate, isolateProp = options.isolateProp, isolateNormalize = options.isolateNormalize;
    var filterStream = makeFilter(runStreamAdapter);
    var driverSource = {
        filter: function (predicate) {
            var filteredResponse$$ = filterStream(response$$, function (r$) { return predicate(r$.request); });
            return makeDriverSource(filteredResponse$$, options);
        },
        isolateSink: function (request$, scope) {
            return request$.map(function (req) {
                req = isolateNormalize ? isolateNormalize(req) : req;
                req[isolateProp] = req[isolateProp] || [];
                req[isolateProp].push(scope);
                return req;
            });
        },
        isolateSource: function (source, scope) {
            var requestPredicate = function (req) {
                return Array.isArray(req[isolateProp]) &&
                    req[isolateProp].indexOf(scope) !== -1;
            };
            return source.filter(requestPredicate);
        },
        select: function (category) {
            if (!category) {
                return response$$;
            }
            if (typeof category !== 'string') {
                throw new Error("category should be a string");
            }
            var requestPredicate = function (request) { return request && request.category === category; };
            return driverSource.filter(requestPredicate).select();
        }
    };
    return driverSource;
};
exports.default = makeDriverSource;
//# sourceMappingURL=makeDriverSource.js.map