import React from "react";
import { ErrorMessage } from "./error-message";

export default {
  title: "UI/ErrorMessage",
  component: ErrorMessage,
};

export const Basic = () => (
  <ErrorMessage>Password must be at least 8 characters</ErrorMessage>
);

export const InlineSpan = () => (
  <p>
    Some helper text. <ErrorMessage as="span">Inline error</ErrorMessage>
  </p>
);
