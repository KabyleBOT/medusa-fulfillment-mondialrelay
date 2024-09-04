import {
	Fulfillment,
	LineItem,
	Order,
} from "@medusajs/medusa";
import MondialRelayFulfillmentService from "./mondial-relay";
import {
	FulfillmentProviderData,
	OutputOptions,
} from "../types";
import { CreateReturnType } from "@medusajs/medusa/dist/types/fulfillment-provider";

class MondialRelayPrintInStoreFulfillmentService extends MondialRelayFulfillmentService {
	static identifier =
		"mondialrelay-print-in-store";

	constructor(container, options) {
		super(container, options);
	}

	async createFulfillment(
		data: Record<string, unknown> &
			OutputOptions,
		items: LineItem[],
		order: Order,
		fulfillment: Fulfillment
	): Promise<FulfillmentProviderData> {
		const outputOptions: OutputOptions =
			{
				outputType: "QRCode",
				outputFormat: undefined,
			};

		data = {
			...data,
			...outputOptions,
		};

		return super.createFulfillment(
			data,
			items,
			order,
			fulfillment
		);
	}

	async createReturn(
		returnOrder: CreateReturnType &
			OutputOptions
	): Promise<Record<string, unknown>> {
		const outputOptions: OutputOptions =
			{
				outputType: "QRCode",
				outputFormat: undefined,
			};

		return super.createReturn({
			...returnOrder,
			...outputOptions,
		});
	}
}

export default MondialRelayPrintInStoreFulfillmentService;
