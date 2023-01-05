/* eslint-disable curly */
import { Interval } from './data';

/**
 * Combines overlapping intervals.
 * @param intervals A collection of intervals on the format: [start, stop]
 * @returns Array with compressed intervals
 *
 * @example compressInterval([ [1, 5], [4, 7] ]); // Returns: [[1, 7]]
 */
export function compressIntervals(intervals: [number, number][]): [number, number][] {
  const output: [number, number][] = [];

  // Set previous interval to first
  let prev: [number, number] = intervals[0].slice(0) as [number, number];

  for (let i: number = 1; i < intervals.length; i++) {
    const cur: [number, number]  = intervals[i].slice(0) as [number, number];
    if(cur[0] < prev[1]) { // If inside
      if(cur[1] > prev[1]) prev[1] = cur[1]; // Consume
    } else { // New interval
      output.push(prev);
      prev = cur;
    }
  }

  // Push last
  output.push(prev);

  return output;
}

/**
 * Sorts intervals by length and compresses.
 * @param intervals Intervals to process
 * @returns Processed intervals
 */
export function processIntervals(intervals: Interval[]): [number, number][] {
  let output: [number, number][] = intervals.map(i => [i.l1, i.l2] as [number, number])
    .sort((a, b) => { // Sort intervals
      if (a[0] < b[0]) return -1;
      return (a[0] > b[0]) ? 1 : 0;
    });
  if (output.length > 0) output = compressIntervals(output);
  return output;
}
