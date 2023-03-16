/* eslint-disable @typescript-eslint/no-explicit-any */

/** Date for each interval. */
export interface Interval {
  /** Type of interval [Screen, Perforation]. */
  type: string,
  /** Start of interval as distance along wellbore. */
  start: number,
  /** End of interval as distance along wellbore. */
  end: number,
  /** Start of interval along wellbore as a value between 0 and 1. */
  l1: number,
  /** End of interval along wellbore as a value between 0 and 1. */
  l2: number,
}

/** Wellbore data. */
export interface SourceData {
  [key: string]: any,
  /** Collection of intervals. */
  intervals: Interval[],
  /** Full label of wellbore. */
  label: string,
  /** Short label of wellbore, ie. no country code. */
  labelShort: string,
  /** Path along wellbore on lat/long format. */
  path: [number, number][],
}
