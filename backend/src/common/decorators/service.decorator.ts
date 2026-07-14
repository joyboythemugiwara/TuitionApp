import { injectable } from "tsyringe";

// Semantic decorator for service classes
export function Service(): ClassDecorator {
  return (target) => {
    injectable()(target as any);
  };
}