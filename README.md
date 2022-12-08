<a href="https://promisesaplus.com/"><img src="https://promisesaplus.com/assets/logo-small.png" align="right" /></a>
# wise-promise [![Build Status](https://travis-ci.org/JoshuaWise/wise-promise.svg?branch=master)](https://travis-ci.org/JoshuaWise/wise-promise)

This is a subclass of **native** promises.

Native promises saw a huge performance boost in Node.js v8.0.0, eliminating the need for complex promise libraries like [bluebird](https://github.com/petkaantonov/bluebird). Native promises are now safer, cleaner, and have become the new best practice.

Unfortunately, native promises alone lack many powerful utilities that libraries like [bluebird](https://github.com/petkaantonov/bluebird) provide. `wise-promise` extends native promises to provide that same power.

## Installation

```bash
npm install --save wise-promise
```

## Usage

```js
const Promise = require('wise-promise');

const promise = new Promise((resolve, reject) => {
  get('http://www.google.com', (err, res) => {
    if (err) reject(err);
    else resolve(res);
  });
});
```

# API

## new Promise(*handler*)

This creates and returns a new promise. `handler` must be a function with the following signature:

`function handler(resolve, reject)`

 1. `resolve` is a function that should be called with a single argument. If it is called with a non-promise value then the promise is fulfilled with that value. If it is called with a promise, then the constructed promise takes on the state of that promise.
 2. `reject` is a function that should be called with a single argument. The returned promise will be rejected with that argument.

### .then([*onFulfilled*], [*onRejected*]) -> *promise*

This method conforms to the [Promises/A+ spec](http://promises-aplus.github.io/promises-spec/).

If you are new to promises, the following resources are available:
 - [Matt Greer's promise tutorial](http://www.mattgreer.org/articles/promises-in-wicked-detail/)
 - [HTML5 Rocks's promise tutorial](http://www.html5rocks.com/en/tutorials/es6/promises/)
 - [Promises.org's introduction to promises](https://www.promisejs.org/)
 - [David Walsh's article on promises](https://davidwalsh.name/promises)

If they are provided, `onFulfilled` and `onRejected` should be functions.

### .catch([*predicate*], *onRejected*) -> *promise*

Sugar for `.then(null, onRejected)`, to mirror `catch` in synchronous code.

If a `predicate` is specified, the `onRejected` handler will only catch exceptions that match the `predicate`.

The `predicate` can be:
- an `Error` class
  - example: `.catch(TypeError, func)`
- a filter function
  - example: `.catch(err => err.statusCode === 404, func)`
- an array of accepted `predicates`
  - example: `.catch([TypeError, SyntaxError, is404], func)`

### .catchLater() -> *this*

Prevents this promise from triggering an [Unhandled Rejection](https://nodejs.org/api/process.html#process_event_unhandledrejection). This is useful if you plan on handling the promise at a later point in time.

### .finally(*handler*) -> *promise*

Pass a `handler` that will be called regardless of this promise's fate. The `handler` will be invoked with no arguments, and it cannot change the promise chain's current fulfillment value or rejection reason. If `handler` returns a promise, the promise returned by `.finally` will not be settled until that promise is settled.

This method is primarily used for cleanup operations.

### .tap(*handler*) -> *promise*

Like [`.finally`](#finallyhandler---promise), but the `handler` will not be called if this promise is rejected. The `handler` cannot change the promise chain's fulfillment value, but it can delay chained promises by returning an unsettled promise (just like [`.finally`](#finallyhandler---promise)). The handler is invoked with a single argument: the fulfillment value of the previous promise.

This method is primarily used for side-effects.

### .tapError(*handler*) -> *promise*

The opposite of [`.tap`](#taphandler---promise). The given `handler` will only be invoked if this promise is rejected. Unlike [`.catch`](#catchpredicate-onrejected---promise), however, the returned promise will still be rejected with the original rejection reason. Just like [`.tap`](#taphandler---promise) and [`.finally`](#finallyhandler---promise), the handler can delay chained promises by returning an unsettled promise. The handler is invoked with a single argument: the rejection reason of the previous promise.

### .become(*fulfilledValue*, [*rejectedValue*]) -> *promise*

Sugar for `.then(() => fulfilledValue)`.

If a second argument is passed, it is equivilent to `.then(() => fulfilledValue, () => rejectedValue)`.

### .else([*predicate*], *value*) -> *promise*

Sugar for `.catch(() => value)`. This method is used for providing default values on a rejected promise chain. Predicates are supported, just like with the [`.catch`](#catchpredicate-onrejected---promise) method.

### .delay(*milliseconds*) -> *promise*

Returns a new promise chained from this one, whose fulfillment is delayed by the specified number of `milliseconds` from when it would've been fulfilled otherwise. Rejections are not delayed.

### .timeout(*milliseconds*, [*reason*]) -> *promise*

Returns a new promise chained from this one. However, if this promise does not settle within the specified number of `milliseconds`, the returned promise will be rejected with a `TimeoutError`.

If you specify a string `reason`, the `TimeoutError` will have `reason` as its message. Otherwise, a default message will be used. If `reason` is an `instanceof Error`, it will be used instead of a `TimeoutError`.

`TimeoutError` is available at `Promise.TimeoutError`.

### .log([*prefix*]) -> *promise*

Conveniently logs the state and value of the promise when it becomes fulfilled or rejected.

If `prefix` is provided, it will be prepended to the logged `value`, separated by a space character.

### *static* Promise.resolve(*value*) -> *promise*

Creates a promise that is resolved with the given `value`. If you pass a promise or promise-like object, the returned promise takes on the state of that promise-like object (fulfilled or rejected).

### *static* Promise.reject(*value*) -> *promise*

Creates a promise that is rejected with the given `value` (usually an `Error` object) as its rejection reason.

### *static* Promise.race(*iterable*) -> *promise*

Returns a promise that will fulfill or reject with the same value/exception as the first fulfilled/rejected promise in the `iterable` argument.

Non-promise values in the `iterable` are treated like already-fulfilled promises.

### *static* Promise.all(*iterable*) -> *promise*

Returns a promise for an `iterable` of promises. The returned promise will be rejected if any of the promises in `iterable` are rejected. Otherwise, it will be fulfilled with an array of each fulfillment value, respectively.

Non-promise values in the `iterable` are treated like already-fulfilled promises.

```js
Promise.all([Promise.resolve('a'), 'b', Promise.resolve('c')])
  .then(function (results) {
    assert(results[0] === 'a')
    assert(results[1] === 'b')
    assert(results[2] === 'c')
  })
```

### *static* Promise.any(*iterable*) -> *promise*

Returns a promise for an `iterable` of promises. It will be fulfilled with the value of the first fulfilled promise in `iterable`. If all of the given promises reject, it will be rejected with the rejection reason of the promise that rejected first.

Non-promise values in the `iterable` are treated like already-fulfilled promises.

### *static* Promise.props(*object*) -> *promise*

Like [`Promise.all`](#static-promisealliterable---promise), but for an object's properties instead of iterated values. Returns a promise that will be resolved with an object that has fulfillment values at respective keys to the original `object`. Only the `object`'s own enumerable properties are considered.

Non-promise values in the `object` are treated like already-fulfilled promises.

```js
Promise.props({ users: getUsers(), news: getNews() })
  .then(function (results) {
    console.log(results.users)
    console.log(results.news)
  })
```

### *static* Promise.settle(*iterable*) -> *promise*

Given an `iterable` of promises, returns a promise that fulfills with an array of promise descriptor objects.

If the corresponding input promise is:
 - fulfilled, the descriptor will be `{ state: 'fulfilled', value: <fulfillmentValue> }`
 - rejected, the descriptor will be `{ state: 'rejected', reason: <rejectionReason> }`

Non-promise values in the `iterable` are treated like already-fulfilled promises.

### *static* Promise.after(*milliseconds*, [*value*]) -> *promise*

Returns a promise that will be resolved with `value` after the specified number of milliseconds. By default, `value` is `undefined`.

If `value` is a promise itself, the returned promise will adopt the state of `value` after the specified number of milliseconds.

### *static* Promise.isPromise(*value*) -> *boolean*

Returns either `true` or `false`, whether `value` is a promise-like object (i.e., it has a `.then` method).

### *static* Promise.promisify(*function*, [*options*]) -> *function*

Takes a `function` which accepts a node style callback and returns a new function that returns a promise instead.

```js
const fs = require('fs')
const read = Promise.promisify(fs.readFile)

const promise = read('foo.json', 'utf8')
  .then(str => JSON.parse(str))
```

There are two possible options:
  - `multiArgs`
    * Setting this option to `true` means the resulting promise will always fulfill with an array of the callback's success values (arguments after the first).
  - `deoptimize`
    * Setting this option to `true` can potentially improve the performance of functions that are frequently passed a widely varying number of arguments (and typically a very high number of arguments). In most cases though, this option will reduce the performance of the function.

### *static* Promise.nodeify(*function*) -> *function*

Takes a promise-returning `function`, and returns a new function that instead accepts a node style callback as its last argument. The newly created function will always return its `this` value.

```js
const callbackAPI = Promise.nodeify(promiseAPI)

callbackAPI('foo', 'bar', function (err, result) {
  // handle error or result here
})
```

## License

[MIT](https://github.com/JoshuaWise/wise-promise/blob/master/LICENSE)
