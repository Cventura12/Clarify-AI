import { describe, expect, it } from "vitest";
import { scoreConfidence } from "./confidence";

describe("scoreConfidence", () => {
  it("labels low confidence", () => {
    const result = scoreConfidence(0.2);
    expect(result.label).toBe("low");
  });

  it("labels high confidence", () => {
    const result = scoreConfidence(0.9);
    expect(result.label).toBe("high");
  });
});
