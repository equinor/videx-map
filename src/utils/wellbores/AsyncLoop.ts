/* eslint-disable curly */
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
  timers: { [key: string]: NodeJS.Timeout } = {}

  /**
   * Start a new asynchronous loop.
   * @param key Key of loop
   * @param config Configurations for asynchronous loop.
   * @param interval Configurations interval between batches
   */
  Start(key: string, config: Config, interval = 3) {
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
        delete this.timers[key];
        if (endFunc) endFunc();
        return;
      }
      const tail = Math.min(front + batchSize, iterations);

      for (let i = front; i < tail; i++) {
        func(i);
      }
      if (postFunc) postFunc();

      front += batchSize;
      this.timers[key] = setTimeout(batch, interval);
    }

    // Start batch
    this.timers[key] = setTimeout(batch, interval);
  }

  /**
   * Stop a single loop
   * @param key Key of loop
   */
  Stop(key: string) {
    if (key in this.timers) {
      // Stop interval
      clearTimeout(this.timers[key]);
      delete this.timers[key];
    }
  }

  /** Stop all ongoing loops */
  StopAll() {
    const keys = Object.keys(this.timers);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      clearTimeout(this.timers[key]);
      delete this.timers[key];
    }
  }
}
