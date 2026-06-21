import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { createElement } from "react";

vi.mock("next/image", () => ({
  default: (props: { alt?: string; src: string; className?: string }) =>
    createElement("img", {
      alt: props.alt ?? "",
      src: props.src,
      className: props.className,
    }),
}));

afterEach(() => {
  cleanup();
});
