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
        .style('height', '25px')
        .style('overflow', 'hidden')
        .on('click', onClick);
    }

    addGroup(label: string): Sidebar {
      const { marginPct } = this;

      const group = this.root.append('div')
        .style('width', `${100 - 2 * marginPct}%`)
        .style('margin-left', `${marginPct}%`)
        .style('margin-right', `${marginPct}%`)
        .style('padding-top', '5px')
        .style('padding-bottom', '5px')
        .style('margin-bottom', '10px')
        .style('background-color', 'LightGray')
        .style('border-radius', '5px')

      group.append('div')
        .text(label)
        .style('font-size', '16px')
        .style('width', `${100 - 2 * marginPct}%`)
        .style('margin-left', `${marginPct}%`)
        .style('margin-right', `${marginPct}%`)
        .style('height', '25px')
        .style('overflow', 'hidden')
        .style('font-weight', 'bold')
        .style('text-align', 'center');

        return new Sidebar(group, { marginPct: this.marginPct });
    }
}
