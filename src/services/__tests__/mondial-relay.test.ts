import MondialRelayFulfillmentService, {
	InjectedDependencies,
} from "../mondial-relay";
import {
	LineItem,
	Order,
	Fulfillment,
	Logger,
} from "@medusajs/medusa";
import dotenv from "dotenv";
import { MondialRelayOptions } from "../../types/mondial-relay";
import { IStockLocationService } from "@medusajs/types";

// Load environment variables from .env file
dotenv.config();

describe("MondialRelayFulfillmentService Integration Test", () => {
	let service: MondialRelayFulfillmentService;

	beforeAll(() => {
		service =
			new MondialRelayFulfillmentService(
				{
					logger:
						console as any as Logger,
					stockLocationService: {
						// retrieve returns a promise
						retrieve: jest
							.fn()
							.mockResolvedValue({
								id: "loc_1",
								address: {
									address_1:
										"Test Street",
									address_2: "10",
									city: "Paris",
									country_code: "FR",
									postal_code: "75001",
								} as any,
							}) as any as IStockLocationService,
					} as any as IStockLocationService,
				} as InjectedDependencies,
				{} as MondialRelayOptions
			);
	});

	it("should create a fulfillment", async () => {
		const mockOrder: Order = {
			id: "order_123",
			customer_id: "customer_123",
			email: "john.doe@example.com",
			shipping_address: {
				first_name: "John",
				last_name: "Doe",
				address_1: "Test Street",
				address_2: "10",
				country_code: "FR",
				postal_code: "75001",
				city: "Paris",
				phone: "+33123456789",
			},
			object: "order",
			status: "pending",
			fulfillment_status:
				"not_fulfilled",
			payment_status: "awaiting",
			items: [],
			region: { id: "region_1" } as any,
			currency_code: "eur",
			tax_rate: 0,
			discounts: [],
			customer: {
				id: "customer_123",
			} as any,
			billing_address: {
				address_1: "Billing Street",
				city: "Paris",
				country_code: "FR",
				postal_code: "75001",
			} as any,
			sales_channel: {
				id: "sales_channel_1",
			} as any,
			created_at: new Date(),
			updated_at: new Date(),
			metadata: {},
		} as any as Order;

		const mockItems: LineItem[] = [
			{
				title: "Test Item",
				quantity: 1,
				variant: {
					weight: 1000,
					product: {} as any,
					inventory_quantity: 0,
					prices: [],
					options: [],
					metadata: {},
					created_at: new Date(),
					updated_at: new Date(),
				},
				id: "item_1",
				fulfilled_quantity: 0,
				returned_quantity: 0,
				shipped_quantity: 0,
				metadata: {},
				created_at: new Date(),
				updated_at: new Date(),
			},
		] as LineItem[];

		const mockFulfillment: Fulfillment =
			{
				id: "fulfillment_1",
				order_id: "order_123",
				location_id: "loc_1",
				metadata: {},
				tracking_numbers: [],
				shipped_at: null,
				canceled_at: null,
				created_at: new Date(),
				updated_at: new Date(),
			} as Fulfillment;

		const result =
			await service.createFulfillment(
				{},
				mockItems,
				mockOrder,
				mockFulfillment
			);

		expect(result).toHaveProperty(
			"shipment_number"
		);

		expect(result).toHaveProperty(
			"shipment_label"
		);

		expect(result).toHaveProperty(
			"shippement_raw_content"
		);
	});
});
