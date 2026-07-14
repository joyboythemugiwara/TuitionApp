import { injectable } from "tsyringe";

// Semantic decorator for repository classes
export function Repository(): ClassDecorator {
  return (target) => {
    injectable()(target as any);
  };
}