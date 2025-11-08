import React from "react";
import { ErrorMessage } from "./error-message";

const errorMessageStoryMeta = {
  title: "UI/ErrorMessage",
  component: ErrorMessage,
};

export default errorMessageStoryMeta;

export const Basic = () => (
  <ErrorMessage>Password must be at least 8 characters</ErrorMessage>
);

export const InlineSpan = () => (
  <p>
    Some helper text. <ErrorMessage as="span">Inline error</ErrorMessage>
  </p>
);
