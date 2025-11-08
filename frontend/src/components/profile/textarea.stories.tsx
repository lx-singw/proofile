import React from "react";
import { Textarea } from "./textarea";
import { Label } from "../ui/label";
import { ErrorMessage } from "../ui/error-message";

const textareaStoryMeta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default textareaStoryMeta;

export const Basic = {
  args: {
    placeholder: "Type your message here.",
    className: "w-80",
  },
};

export const WithLabel = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  ),
};

export const InvalidWithError = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="bio">Biography</Label>
      <Textarea placeholder="Tell us a little bit about yourself" id="bio" aria-invalid="true" />
      <ErrorMessage>Your bio must be at least 50 characters long.</ErrorMessage>
    </div>
  ),
};

export const Disabled = {
  args: {
    placeholder: "You can't type here.",
    disabled: true,
    className: "w-80",
  },
};