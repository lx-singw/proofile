import React from "react";
import { Button } from "./button";

export default {
  title: "UI/Button",
  component: Button,
};

export const Variants = () => (
  <div className="flex gap-2 flex-wrap">
    <Button>Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="link">Link</Button>
  </div>
);

export const Sizes = () => (
  <div className="flex items-center gap-2">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="Icon button">
      <span>★</span>
    </Button>
  </div>
);
