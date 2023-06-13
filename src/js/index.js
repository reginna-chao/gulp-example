// Import polyfill from node_modules
import 'core-js/modules/es6.set.js';
import 'core-js/modules/es6.array.find-index.js';

(function() {
    console.log('test normal console 123');

	// Test class
    class Test {
		constructor() {
			this.width = 123;
			console.log('test class 1');
		}
	}

	class TestA extends Test {
		constructor() {
			super()

			this.height = 456;
			console.log('test extends class');
		}
	}

	const test = new TestA();

	console.log('test class result', test);

	// ==========

	// Test Array

	const array = ['a', 'b', 'c'];
	const array2 = [...array, 'a', 'b', 'c'];

	console.log('test array concat', array2);

	const array3 = [1, 2, 3, 4];
	const array3Include = array3.includes((item) => item > 2);

	console.log('test array includes', array3Include);

	// ==========

	// Test for of

	for(let item of ['aaa', 'bbb', 'ccc']) {
		console.log('test for of', item);
	}

})();
