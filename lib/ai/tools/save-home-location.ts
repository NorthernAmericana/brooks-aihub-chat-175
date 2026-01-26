import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { createHomeLocationRecord } from "@/lib/db/queries";

const MY_CAR_MIND_ROUTE = "/MyCarMindATO/";

type SaveHomeLocationProps = {
  session: Session;
};

export const saveHomeLocation = ({ session }: SaveHomeLocationProps) =>
  tool({
    description:
      "Save the user's home location for MyCarMindATO. Use only after the user explicitly approves.",
    inputSchema: z.object({
      rawText: z
        .string()
        .describe("The approved home location (address or description)."),
      normalizedText: z
        .string()
        .optional()
        .describe("Optional normalized address or formatted location text."),
    }),
    needsApproval: true,
    execute: async ({ rawText, normalizedText }) => {
      if (!session.user?.id) {
        throw new Error("Missing user session for saveHomeLocation.");
      }

      const record = await createHomeLocationRecord({
        ownerId: session.user.id,
        route: MY_CAR_MIND_ROUTE,
        rawText,
        normalizedText,
      });

      return {
        id: record.id,
        route: record.route,
        locationType: record.locationType,
        rawText: record.rawText,
        normalizedText: record.normalizedText,
        approvedAt: record.approvedAt,
      };
    },
  });
