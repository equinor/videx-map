/* eslint-disable curly, @typescript-eslint/no-explicit-any */
import { SourceData } from './SourceData';
import { WellboreData } from './WellboreData';

export class WellboreEventData {
  public group: string;
  public data: SourceData;
  public mouseEvent?: MouseEvent;

  constructor(group: string, data: SourceData) {
    this.group = group;
    this.data = data;
  }

  static from(wellbore: WellboreData): WellboreEventData {
    return new WellboreEventData(
      wellbore.group.key,
      wellbore.data,
    );
  }
}

export class HighlightEvent {
  public changed: boolean;
  public originalEvent?: any;
  public eventData: WellboreEventData[];

  constructor(eventData: WellboreEventData[], changed: boolean, originalEvent: any) {
    this.eventData = eventData;
    this.changed = changed;
    this.originalEvent = originalEvent;
  }

  static from(wellbores: WellboreData[], changed: boolean, originalEvent: any) {
    return new HighlightEvent(wellbores.map(w => new WellboreEventData(w.group.key, w.data)), changed, originalEvent);
  }

  get count() {
    return this.eventData.length;
  }
}
