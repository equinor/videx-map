interface Config {
  /** Total number of iterations. */
  iterations: number;
  /** Size of each individual batch. */
  batchSize: number;
  /** Function to call for each iteration. */
  func: (i: number) => void;
  /** Function to call after each batch. */
  postFunc?: () => void;
  /** Function to call after finishing loop. */
  endFunc?: () => void;
}

/** Class for running non-blocking for loops. */
export default class AsyncLoop {

  /** Dictionary with intervals */
  intervals: { [key: string]: NodeJS.Timeout } = {}

  /**
   * Start a new asynchronous loop.
   * @param key Key of loop
   * @param config Configurations for asynchronous loop.
   */
  Start(key: string, config: Config) {
    this.Stop(key); // Clear previous intervals

    // Get config
    const {
      iterations,
      batchSize,
      func,
      postFunc,
      endFunc,
    } = config;

    let front = 0;
    const batch = () => {
      if(front >= iterations) {
        clearInterval(this.intervals[key]);
        delete this.intervals[key];
        if (endFunc) endFunc();
        return;
      }
      const tail = Math.min(front + batchSize, iterations);

      for (let i = front; i < tail; i++) {
        func(i);
      }
      if (postFunc) postFunc();

      front += batchSize;
    }

    // Start interval
    this.intervals[key] = setInterval(batch, 3);
  }

  /**
   * Stop a single loop
   * @param key Key of loop
   */
  Stop(key: string) {
    if (key in this.intervals) {
      // Stop interval
      clearInterval(this.intervals[key]);
      delete this.intervals[key];
    }
  }

  /** Stop all ongoing loops */
  StopAll() {
    const keys = Object.keys(this.intervals);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      clearInterval(this.intervals[key]);
      delete this.intervals[key];
    }
  }
}
