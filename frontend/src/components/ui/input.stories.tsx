import React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { ErrorMessage } from "./error-message";

export default {
  title: "UI/Input",
  component: Input,
};

export const Basic = () => <Input placeholder="Email" />;

export const WithLabel = () => (
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" placeholder="you@example.com" />
  </div>
);

export const InvalidWithError = () => (
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input id="password" type="password" aria-invalid="true" aria-describedby="password-error" />
    <ErrorMessage id="password-error">Password must be at least 8 characters</ErrorMessage>
  </div>
);
