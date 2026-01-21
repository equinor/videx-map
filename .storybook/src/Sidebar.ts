import { Selection } from 'd3-selection';

type Div = Selection<HTMLDivElement, undefined, null, undefined>;

interface Config {
  /** Margin of buttons in percent. */
  marginPct: number;
}

export default class Sidebar {
    root: Div;
    marginPct: number;

    constructor(root: Div, config: Config) {
      this.root = root;
      this.marginPct = config.marginPct;
    }

    add(label: string, onClick: () => void) {
      const { marginPct } = this;

      this.root.append('button')
        .text(label)
        .style('font-size', '12px')
        .style('width', `${100 - 2 * marginPct}%`)
        .style('margin-left', `${marginPct}%`)
        .style('margin-right', `${marginPct}%`)
        .style('margin-bottom', '5px')
        .style('padding', '10px')
        .style('overflow', 'hidden')
        .style('borderRadius', '8px')
        .style('cursor', 'pointer')
        .on('click', onClick);
    }

    addGroup(label: string): Sidebar {
      const { marginPct } = this;

      const group = this.root.append('div')
        .style('padding', '8px 0');

      group.append('div')
        .text(label)
        .style('font-size', '14px')
        .style('width', `${100 - 2 * marginPct}%`)
        .style('margin', '5px 0')
        .style('margin-left', `${marginPct}%`)
        .style('margin-right', `${marginPct}%`)
        .style('overflow', 'hidden')
        .style('text-align', 'center');

        return new Sidebar(group, { marginPct: this.marginPct });
    }
}
