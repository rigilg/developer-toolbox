import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { Workbench } from "../src/components/tools/workbench";
import { Directory } from "../src/components/directory";
import { toolBySlug } from "../src/config/tools";
afterEach(cleanup);
it("runs an example, copies output, clears inputs and never stores payloads", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  render(<Workbench tool={toolBySlug("base64")!} />);
  fireEvent.change(screen.getByLabelText("Input"), {
    target: { value: "private-sentinel" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Run tool/ }));
  await waitFor(() =>
    expect(
      screen.getByRole("region", { name: "Tool output" }),
    ).toHaveTextContent("cHJpdmF0ZS1zZW50aW5lbA=="),
  );
  fireEvent.click(screen.getByLabelText("Copy output"));
  expect(writeText).toHaveBeenCalledWith("cHJpdmF0ZS1zZW50aW5lbA==");
  expect(JSON.stringify(localStorage)).not.toContain("private-sentinel");
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(screen.getByLabelText("Input")).toHaveValue("");
  expect(screen.getByRole("region", { name: "Tool output" })).toHaveTextContent(
    "Your result will appear here",
  );
});
it("shows an accessible validation error", async () => {
  render(<Workbench tool={toolBySlug("json-formatter")!} />);
  fireEvent.change(screen.getByLabelText("Input"), {
    target: { value: "bad-json" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Run tool/ }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("JSON error"),
  );
});
it("searches by functionality and category", () => {
  render(<Directory />);
  fireEvent.change(screen.getByLabelText("Search utilities"), {
    target: { value: "PKCE" },
  });
  expect(
    screen.getByRole("heading", { name: "PKCE Code Generator" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "SQL Formatter" }),
  ).not.toBeInTheDocument();
});
