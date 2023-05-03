export { Detail } from './Detail';
export { DetailOptions } from './DetailOptions';

import { DetailOptions } from './DetailOptions';
import { ShoeDetail, ShoeOptions } from './ShoeDetail';

/**
 * Retrieve the appropriate detail based on the shape specified in the options.
 * @param options - Detail configuration parameters
 * @param group - Group to which the detail belongs
 * @returns The correct detail based on the provided shape
 */
export const getDetail = (options: DetailOptions, group: string = 'default') => {
  const { shape } = options;

  switch (shape) {
    case 'shoe':
      return new ShoeDetail(options as ShoeOptions, group);
    default:
      // TODO: Make better default
      return new ShoeDetail(options as ShoeOptions, group);
  }
}
