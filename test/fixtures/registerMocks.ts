import { It, Mock } from "moq.ts";

import type { TransitRepository } from "@/interfaces/transitRepository";
import { buildTransitNetwork, FIXTURE_SHAPES } from "./transitNetwork";

/** A transit repository mock serving the fixture network and shapes. */
export function mockTransitRepository(): TransitRepository {
  const network = buildTransitNetwork();
  return new Mock<TransitRepository>()
    .setup((repository) => repository.getNetwork())
    .returnsAsync(network)
    .setup((repository) => repository.getShape(It.IsAny()))
    .callback(({ args: [shapeId] }) => Promise.resolve(FIXTURE_SHAPES[shapeId as string] ?? []))
    .object();
}
