import { injectable } from "tsyringe";

// Semantic decorator for controller classes
export function Controller(): ClassDecorator {
  return (target) => {
    injectable()(target as any);
  };
}