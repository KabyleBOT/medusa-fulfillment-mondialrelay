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
import { MondialRelayOptions } from "../../types";
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
									address_2: "FR-02071",
									city: "Créteil",
									country_code: "FR",
									postal_code: "94000",
								} as any,
							}) as any as IStockLocationService,
					} as any as IStockLocationService,
				} as InjectedDependencies,
				{
					businessAddress: {
						title: "Mr",
						firstName: "John",
						lastName: "Doe",
						streetname:
							"1 rue de la paix",
						addressAdd2: "Bâtiment B",
						countryCode: "FR",
						postCode: "75000",
						city: "Paris",
						addressAdd1: "",
						mobileNo: "0606060606",
						email: "john.doe@email.com",
						returnLocation: "FR-12345",
					},
					// Add other required options here if needed
				} as MondialRelayOptions
			);
	});

	it("should create a fulfillment", async () => {
		const mockOrder: Order = {
			id: "order_123",
			customer_id: "customer_123",
			email: "john.doe@example.com",
			display_id: 123,
			shipping_address: {
				first_name: "John",
				last_name: "Doe",
				address_1: "Test Street",
				address_2: "FR-21607",
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
			items: [
				{
					id: "item_1",
					title: "Test Item",
					quantity: 1,
				},
			],
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
				fulfilled_quantity: 1,
				returned_quantity: 1,
				shipped_quantity: 1,
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
