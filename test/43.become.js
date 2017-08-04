'use strict'
require('../tools/test/describe')('.become', function (Promise, expect) {
	it('should return a new promise', function () {
		var p = Promise.resolve(5)
		return expect(p.become()).to.be.an.instanceof(Promise).and.not.equal(p)
	})
	describe('when given zero arguments', function () {
		it('should not affect rejected promises', function () {
			var err = new Error('foo')
			return expect(
				Promise.reject(err).become()
			).to.be.rejectedWith(err)
		})
		it('should provide undefined as a new value for fulfilled promises', function () {
			return expect(
				Promise.resolve(44).become()
			).to.become(undefined)
		})
	})
	describe('when given one argument', function () {
		it('should not affect rejected promises', function () {
			var err = new Error('foo')
			return expect(
				Promise.reject(err).become(9)
			).to.be.rejectedWith(err)
		})
		it('should provide a new value for fulfilled promises', function () {
			return expect(
				Promise.resolve(44).become(9)
			).to.become(9)
		})
	})
	describe('when given two arguments', function () {
		it('should provide a default value for rejected promises', function () {
			return expect(
				Promise.reject(new Error('foo')).become(9, 12)
			).to.become(12)
		})
		it('should provide a new value for fulfilled promises', function () {
			return expect(
				Promise.resolve(44).become(9, 12)
			).to.become(9)
		})
		it('should accept undefined as a second argument', function () {
			return expect(
				Promise.reject(new Error('foo')).become(9, undefined)
			).to.become(undefined)
		})
	})
})
