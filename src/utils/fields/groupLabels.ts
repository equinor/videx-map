/* eslint-disable curly */
import Vector2 from '@equinor/videx-vector2';

import { MultiField, Label } from './LabelManager';

interface Group {
  /** Index within multifield */
  index: number;
  consumed: number[];
  consumer: number;
}

/**
 * Function for grouping labels.
 */
export default function groupLabels(field: MultiField, scale: number): [number, number][] {
  // Get labels from field
  const labels = field.labels;

  // Put each label in separate group
  const groups: Group[] = [];
  for (let i = 0; i < labels.length; i++) {
    groups.push({
      index: i,
      consumed: [],
      consumer: -1,
    });
  }

  // Function for checking if two labels are overlapping
  const isOverlapping = (a: Label, b: Label) => {
    const dist = Vector2.sub(a.position, b.position);
    return (Math.abs(dist[0]) < field.width * scale && Math.abs(dist[1]) < field.height * scale);
  }

  // Iterate over labels
  for (let i = 0; i < labels.length; i++) {
    const group = groups[i];
    if (group.consumer >= 0) continue; // Skip group, if already consumed
    const label: Label = labels[i];
    for (let j = 0; j < labels.length; j++) {
      if (i === j) continue; // Skip self
      const compLabel: Label = labels[j];

      // CompLabel consume label, if overlap
      if (isOverlapping(label, compLabel)) {
        let compIndex = j;
        let compGroup = groups[j];

        // If compGroup have already been consumed
        if (compGroup.consumer >= 0) {
          compIndex = compGroup.consumer;
          if (compIndex === i) continue; // Don't be consumed by same group
          compGroup = groups[compGroup.consumer];
        }

        // Assign self and consumed to compGroup
        compGroup.consumed.push(...group.consumed, i);
        group.consumed.forEach(d => groups[d].consumer = compIndex);

        // Register consumption
        group.consumed = [];
        group.consumer = compIndex;
        break;
      }
    }
  }

  const output: [number, number][] = [];

  // Iterate over groups
  for (let i: number = 0; i < groups.length; i++) {
    const group = groups[i];
    if(group.consumer >= 0) continue; // Skip consumed
    output.push(
      recalculatePosition(labels, group.index, group.consumed),
    );
  }

  return output;
}

/**
 * Function for recalculating position of labels.
 * @param labels Full collection of labels
 * @param selfIndex Index of label to recalculate
 * @param targetIndiced Indices of consumed labels
 * @returns New position of label
 */
function recalculatePosition(labels: Label[], selfIndex: number, targetIndiced: number[]): [number, number] {
  const self: Label = labels[selfIndex];
  let comX: number = self.mass * self.position[0];
  let comY: number = self.mass * self.position[1];
  let totalMass: number = self.mass;
  targetIndiced.forEach(idx => {
    const target: Label = labels[idx];
    comX += target.mass * target.position[0];
    comY += target.mass * target.position[1];
    totalMass += target.mass;
  });

  return [comX / totalMass, comY / totalMass];
}
