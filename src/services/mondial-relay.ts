import {
	Cart,
	Fulfillment,
	LineItem,
	Logger,
	MedusaContainer,
	Order,
	AbstractFulfillmentService,
	OrderService,
} from "@medusajs/medusa";
import { IStockLocationService } from "@medusajs/types";
import { CreateReturnType } from "@medusajs/medusa/dist/types/fulfillment-provider";
import { EntityManager } from "typeorm";
import TrackingLinkRepository from "@medusajs/medusa/dist/repositories/tracking-link";
import MondialRelayClient from "../utils/mondial-relay-client";
import {
	FulfillmentProviderData,
	MondialRelayOptions,
} from "../types";

export interface InjectedDependencies
	extends MedusaContainer {
	logger: Logger;
	stockLocationService: IStockLocationService;
	trackingLinkRepository: typeof TrackingLinkRepository;
	orderService: OrderService;
	manager: EntityManager;
}

class MondialRelayFulfillmentService extends AbstractFulfillmentService {
	static identifier = "mondialrelay";

	private client: MondialRelayClient;
	protected readonly config_: MondialRelayOptions;
	protected readonly container_: InjectedDependencies;
	protected readonly logger_: Logger;
	protected readonly stockLocationService_: IStockLocationService;
	protected readonly trackingLinkRepository_: typeof TrackingLinkRepository;
	protected readonly orderService_: OrderService;

	constructor(
		container: InjectedDependencies,
		options: MondialRelayOptions
	) {
		super(
			container as any,
			options as any
		);

		this.config_ = options;
		this.container_ = container;
		this.logger_ = container.logger;
		this.stockLocationService_ =
			container.stockLocationService;
		this.trackingLinkRepository_ =
			container.trackingLinkRepository;
		this.orderService_ =
			container.orderService;
		this.client =
			new MondialRelayClient(
				options,
				container.logger
			);
	}

	async getFulfillmentOptions(): Promise<
		any[]
	> {
		return [
			{
				id: "mondialrelay-fulfillment",
			},
			{
				id: "mondialrelay-fulfillment-return",
				is_return: true,
			},
		];
	}

	async validateFulfillmentData(
		optionData: Record<string, unknown>,
		data: Record<string, unknown>,
		cart: Cart
	): Promise<Record<string, unknown>> {
		return data;
	}

	async validateOption(
		data: Record<string, unknown>
	): Promise<boolean> {
		return true;
	}

	async canCalculate(
		data: Record<string, unknown>
	): Promise<boolean> {
		return false;
	}

	async calculatePrice(
		optionData: {
			[x: string]: unknown;
		},
		data: { [x: string]: unknown },
		cart: Cart
	): Promise<number> {
		throw new Error(
			"Method not implemented."
		);
	}

	async createFulfillment(
		data: Record<string, unknown>,
		items: LineItem[],
		order: Order,
		fulfillment: Fulfillment
	): Promise<FulfillmentProviderData> {
		const locationId =
			fulfillment?.location_id ?? "";
		const { address: businessAddress } =
			await this.retrieveStockLocation(
				locationId
			);

		const parcels = [
			{
				content: fulfillment.id,
				weight: {
					value: items?.reduce(
						(acc, item) =>
							acc +
							(item?.fulfilled_quantity ??
								1) *
								(item?.variant
									?.weight ?? 500),
						0
					),
					unit: "gr",
				},
			},
		];

		const shipmentRequest = {
			context: {
				login: this.client.login,
				password: this.client.password,
				customerId:
					this.client.customerId,
				culture: this.client.culture,
				versionAPI:
					this.client.versionAPI,
			},
			outputOptions: {
				outputFormat: "10x15",
				outputType: "PdfUrl",
			},
			shipmentsList: [
				{
					orderNo:
						order?.display_id?.toString() ??
						"",
					customerNo:
						order?.customer_id ?? "",
					parcelCount: 1,
					deliveryMode: {
						mode: "24R",
						location:
							order?.shipping_address
								?.address_2,
					},
					collectionMode: {
						mode: "REL",
						location: "",
					},
					parcels: parcels,
					deliveryInstruction: "",
					sender: {
						title: "",
						firstName: "",
						lastName: "",
						streetname:
							businessAddress?.address_1 ??
							"",
						countryCode:
							businessAddress?.country_code ??
							"",
						postCode:
							businessAddress?.postal_code ??
							"",
						city:
							businessAddress?.city ??
							"",
						addressAdd1:
							businessAddress?.company ??
							"",
						addressAdd2:
							businessAddress?.address_2 ??
							"",
						mobileNo:
							this.client
								.businessPhone ?? "",
						email:
							this.client
								.businessEmail ?? "",
					},
					recipient: {
						title: "",
						firstName:
							order?.shipping_address
								?.first_name ?? "",
						lastName:
							order?.shipping_address
								?.last_name ?? "",
						streetname:
							order?.shipping_address
								?.address_1 ?? "",
						addressAdd2:
							order?.shipping_address
								?.address_2 ?? "",
						countryCode:
							order?.shipping_address
								?.country_code ?? "",
						postCode:
							order?.shipping_address
								?.postal_code ?? "",
						city:
							order?.shipping_address
								.city ?? "",
						addressAdd1: "",
						mobileNo:
							order?.shipping_address
								?.phone ?? "",
						email: order?.email ?? "",
					},
				},
			],
		};

		return await this.client.createShipment(
			shipmentRequest
		);
	}

	async createReturn(
		returnOrder: CreateReturnType
	): Promise<Record<string, unknown>> {
		let order: Order =
			returnOrder?.order;
		if (
			!order &&
			returnOrder?.order_id
		) {
			try {
				order =
					await this.orderService_.retrieve(
						returnOrder?.order_id,
						{
							relations: [
								"shipping_address",
							],
						}
					);
			} catch (error) {
				throw new Error(
					`Order with id ${returnOrder?.order_id} not found`
				);
			}
		}

		const providerId =
			returnOrder?.location_id;

		const { address: businessAddress } =
			await this.retrieveStockLocation(
				providerId
			);

		const parcels = [
			{
				content: returnOrder?.id,
				weight: {
					value:
						returnOrder?.items?.reduce(
							(acc, item) =>
								acc +
								(item?.item
									?.returned_quantity ??
									1) *
									(item?.item?.variant
										?.weight ?? 500),
							0
						),
					unit: "gr",
				},
			},
		];

		const shipmentRequest = {
			context: {
				login: this.client.login,
				password: this.client.password,
				customerId:
					this.client.customerId,
				culture: this.client.culture,
				versionAPI:
					this.client.versionAPI,
			},
			outputOptions: {
				outputFormat: "10x15",
				outputType: "PdfUrl",
			},
			shipmentsList: [
				{
					orderNo:
						order?.display_id?.toString(),
					customerNo:
						order?.customer_id,
					parcelCount: 1,
					deliveryMode: {
						mode: "24R",
						location:
							businessAddress?.address_2,
					},
					collectionMode: {
						mode: "REL",
						location: "",
					},
					parcels: parcels,
					deliveryInstruction: "",
					sender: {
						title: "",
						firstName:
							order?.shipping_address
								?.first_name ?? "",
						lastName:
							order?.shipping_address
								?.last_name ?? "",
						streetname:
							order?.shipping_address
								?.address_1 ?? "",
						addressAdd2:
							order?.shipping_address
								?.address_2 ?? "",
						countryCode:
							order?.shipping_address
								?.country_code ?? "",
						postCode:
							order?.shipping_address
								?.postal_code ?? "",
						city: order
							?.shipping_address.city,
						addressAdd1: "",
						mobileNo:
							order?.shipping_address
								?.phone ?? "",
						email: order?.email ?? "",
					},
					recipient: {
						title: "",
						firstName: "",
						lastName: "",
						streetname:
							businessAddress?.address_1 ??
							"",
						addressAdd2:
							businessAddress?.address_2 ??
							"",
						countryCode:
							businessAddress?.country_code ??
							"",
						postCode:
							businessAddress?.postal_code ??
							"",
						city:
							businessAddress?.city ??
							"",
						addressAdd1:
							businessAddress?.company ??
							"",
						mobileNo:
							this.client
								.businessPhone ?? "",
						email:
							this.client
								.businessEmail ?? "",
					},
				},
			],
		};

		return await this.client.createShipment(
			shipmentRequest
		);
	}

	async cancelFulfillment(
		fulfillment: Record<string, unknown>
	): Promise<any> {
		return {};
	}

	async getFulfillmentDocuments(
		data: Record<string, unknown>
	): Promise<any> {
		throw new Error(
			"Method not implemented."
		);
	}

	async getReturnDocuments(
		data: Record<string, unknown>
	): Promise<any> {
		throw new Error(
			"Method not implemented."
		);
	}

	async getShipmentDocuments(
		data: Record<string, unknown>
	): Promise<any> {
		throw new Error(
			"Method not implemented."
		);
	}

	async retrieveDocuments(
		fulfillmentData: Record<
			string,
			unknown
		>,
		documentType: "invoice" | "label"
	): Promise<any> {
		throw new Error(
			"Method not implemented."
		);
	}

	async retrieveStockLocation(
		id: string
	) {
		if (
			this.stockLocationService_ ===
			undefined
		) {
			throw new Error(
				"Stock location service not found, please make sure to install the stock-location module."
			);
		}
		try {
			const stockLocation =
				await this.stockLocationService_.retrieve(
					id,
					{
						relations: ["address"],
					}
				);

			return stockLocation;
		} catch (error) {
			throw new Error(
				`Stock location with id ${id} not found`
			);
		}
	}
}

export default MondialRelayFulfillmentService;
