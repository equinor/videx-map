/* eslint-disable curly */
/**
 * Class for comparing arrays of numbers. Also supports objects with numeric elements.
 */
export default class ComparableArray<T extends object> {

  /**
   * Numbers held by comparable array.
   */
  numbers: number[];

  /**
   * Function used when selecting key from object.
   */
  selector: (val: T) => number

  /**
   * Create a new comparable array.
   * @param objects Objects used to fill array
   * @param sort If true, sort objects before storing
   * @param selector Selector used to get numeric element
   */
  constructor(objects: T[], sort: boolean, selector: (val: T) => number)

  /**
   * Create a new comparable array.
   * @param numbers Collection of numbers used to fill array
   * @param sort If true, sort objects before storing
   */
  constructor(numbers: number[], sort: boolean)

  /**
   * Create a new comparable array.
   * @param numbers Collection of numbers used to fill array
   */
  constructor(numbers: number[])

  /**
   * Create a new comparable array.
   * @param number Single number in array
   */
  constructor(number: number)

  constructor(a: T[] | number[] | number, sort: boolean = false, selector?: (val: T) => number) {
    // Special case for single number
    if (typeof a === 'number') {
      this.numbers = [ a ];
      return;
    }

    if (a.length <= 0) throw 'Array has no length.'

    const tempNumbers: number[] = [];
    for (let i = 0; i < a.length; i++) {
      const temp = a[i];
      if (typeof temp === 'number') tempNumbers.push(temp);
      else tempNumbers.push(selector(temp));
    }

    if (sort) tempNumbers.sort();

    this.numbers = tempNumbers;
    this.selector = selector;
  }

  /**
   * Compares the array to a collection of objects.
   * @param objects Objects to compare with
   * @param sort If true, sort objects before comparing
   * @returns True if arrays are equal
   */
  compare(objects: T[], sort?: boolean): boolean

  /**
   * Compares the array to a collection of numbers.
   * @param numbers Collection of numbers to compare with
   * @param sort If true, sort objects before comparing
   * @returns True if arrays are equal
   */
  compare(numbers: number[], sort?: boolean): boolean

  /**
   * Compares the array to a single number.
   * @param number Single number to compare with
   * @returns True if arrays are equal
   */
  compare(number: number): boolean

  compare(a: T[] | number[] | number, sort: boolean = true): boolean {
    // Create an array of a, if number
    if (typeof a === 'number') a = [a];

    if (this.numbers.length !== a.length) return false;

    const tempNumbers: number[] = [];
    for (let i = 0; i < a.length; i++) {
      const temp = a[i];
      if (typeof temp === 'number') tempNumbers.push(temp);
      else tempNumbers.push(this.selector(temp));
    }

    if (sort) tempNumbers.sort();

    for (let i = 0; i < tempNumbers.length; i++) {
      if (this.numbers[i] !== tempNumbers[i]) return false;
    }

    return true;
  }

  /**
   * Returns the internal array as a string.
   */
  toString() {
    return `[${this.numbers.toString()}]`;
  }

}
