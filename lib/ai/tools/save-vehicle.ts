import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { createVehicleRecord } from "@/lib/db/queries";

const MY_CAR_MIND_ROUTE = "/MyCarMindATO/";

type SaveVehicleProps = {
  session: Session;
  chatId: string;
};

export const saveVehicle = ({ session, chatId }: SaveVehicleProps) =>
  tool({
    description:
      "Save the user's current vehicle for MyCarMindATO. Use only after the user explicitly approves.",
    inputSchema: z.object({
      make: z.string().describe("The vehicle make (e.g., Honda)."),
      model: z.string().describe("The vehicle model (e.g., Civic)."),
      year: z
        .number()
        .int()
        .optional()
        .describe("The vehicle year (e.g., 2019)."),
    }),
    needsApproval: true,
    execute: async ({ make, model, year }) => {
      if (!session.user?.id) {
        throw new Error("Missing user session for saveVehicle.");
      }

      const record = await createVehicleRecord({
        ownerId: session.user.id,
        chatId,
        route: MY_CAR_MIND_ROUTE,
        make,
        model,
        year,
      });

      return {
        id: record.id,
        route: record.route,
        make: record.make,
        model: record.model,
        year: record.year,
        approvedAt: record.approvedAt,
      };
    },
  });
